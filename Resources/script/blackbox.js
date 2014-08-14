/**
 * User: hammer
 * Date: 13-9-13
 * Time: 上午11:07
 */

require("blackboxUtil.js");
var dg = loadModule("dungeon.js");
var define = loadModule("define.js");
//var spellLib = loadModule("spell.js");

var flist = [
    "define",
    "serializer",
    "spell",
    "unit",
    "container",
    "item",
    "seed-random",
    "commandStream",
    "dungeon",
    "trigger"
];

var theDungeon = null;

var reqBox = [
    Request_DungeonExplore,
    Request_DungeonActivate,
    Request_DungeonAttack,
    Request_DungeonSpell,
    Request_DungeonCard,
    Request_CancelDungeon,
    Request_DungeonRevive
];

function init()
{
  if (theDungeon) delete theDungeon;
  var x = readTable(TABLE_STAGE);
  overrideTable(TABLE_STAGE, define.initStageConfig(x));
}

function save()
{
    if( theDungeon != null ){
        return {
            init: theDungeon.getInitialData(),
            actions: theDungeon.getActionLog()
        };
    }
    else{
        return null;
    }
}

//return true, if data is reset
function load(obj)
{
    try{
        theDungeon = new dg.Dungeon(obj.init);
        theDungeon.initialize();
        theDungeon.replayActionLog(obj.actions);
        return false;
    }
    catch(ex){
        debug("- RELOAD DUNGEON FAILED - ");
        traceError(ex);
        theDungeon = new dg.Dungeon(theDungeon.getInitialData());
        theDungeon.initialize();
        return true;
    }
}

//replay battle log
function replayLog(log)
{
    try{
        theDungeon = new dg.Dungeon(log.initial_data);
        theDungeon.initialize();
        theDungeon.replayActionLog(log.replay);
    }
    catch(e){
        debug("*** REPLAY LOG FAILED ***");
    }
}

function requestFilter(req)
{
    if( !FLAG_BLACKBOX )
    {
        return false;
    }
    for(var k in reqBox)
    {
        if( req.CNF == reqBox[k] )
        {
            return true;
        }
    }
    return false;
}

function process(event)
{
    return theDungeon.doAction(event);
}

/*
 * --- param ---
 * stage
 * difficulty
 * randSeedZ
 * team
 * --- team ---
 * nam
 * gen
 * cid
 * lev
 * hst
 * hcl
 * xp
 */
function start(param)
{
    if( FLAG_BLACKBOX )
    {
        theDungeon = new dg.Dungeon(param);
        theDungeon.initialize();
    }
}

function fetchRequestLog()
{
    var fv = {};
    flist.forEach(function(val){
        var file = val+".js";
        var ver = loadModule(file).fileVersion;
        fv[val] = ver;
    });
    return {
        rep:theDungeon.getActionLog(),
        fileVersion:fv
    };
}

function cleanup()
{
    if (theDungeon) delete theDungeon;
}

function calcHeroPower(role){
    var unit = loadModule("unit.js");
    var hero = new unit.Hero(role.internal());
    return hero.calculatePower();
}

function fixHeroProperty(role)
{
    var unit = loadModule("unit.js");

    //debug("HERO IN = \n"+JSON.stringify(role.internal()));
    var hero = new unit.Hero(role.internal());
    //debug("HERO OUT = \n"+JSON.stringify(hero));
    role.Level = hero.level;
    role.Health = hero.health;
    role.Attack = hero.attack;
    role.Speed = hero.speed;
    role.Critical = hero.critical;
    role.Strong = hero.strong;
    role.Accuracy = hero.accuracy;
    role.Reactivity = hero.reactivity;

    var skill = loadModule("skill.js");
    for(var k in hero.wSpellDB)
    {
        var spell = hero.wSpellDB[k];
        //debug("* SKILL = "+JSON.stringify(spell));
        var src = {};
        src.cid = Number(k);
        src.lev = spell.level;
        var sk = new skill.Skill(src);
        role.setSkill(sk);
    }
}

function processRequest(req){
    var msgBOXIN = "* BOX IN = \n"+JSON.stringify(req);
    debug(msgBOXIN);
    DebugRecorderInstance.addDebugMsg(msgBOXIN);
    var obj = process(req);
    var msgBOXOUT = "* BOX OUT = \n"+JSON.stringify(obj);
    debug(msgBOXOUT);
    DebugRecorderInstance.addDebugMsg(msgBOXOUT);
    if( Array.isArray(obj) )
    {//multi-response
        for(var k in obj)
        {
            engine.event.postResponse(obj[k]);
        }
    }
    else
    {//single-response
        engine.event.postResponse(obj);
    }
}

function queryParty(){
    return theDungeon.getInitialData().team;
}

exports.init = init;
exports.load = load;
exports.save = save;
exports.replay = replayLog;
exports.filter = requestFilter;
exports.process = processRequest;
exports.start = start;
exports.cleanup = cleanup;
exports.record = fetchRequestLog;
exports.queryParty = queryParty;
//APIs
exports.calcHeroPower = calcHeroPower;
exports.fixHeroProperty = fixHeroProperty;
