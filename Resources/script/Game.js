/**
 * User: hammer
 * Date: 13-10-15
 * Time: 下午3:06
 */

function Game()
{
    this.serverTimeOffset = 0;
    this.config = {};
}

Game.prototype.init = function()
{
    //init directory
    var res = file.getResourcePath();
    var doc = file.getDocumentPath();
    var utils = loadModule("util.js");
    utils.initDirectory(doc+PATH_DOWNLOAD);
    utils.initDirectory(doc+PATH_UPDATE);
    utils.initDirectory(doc+PATH_USER);
    utils.initDirectory(doc+PATH_LOG);
    utils.initDirectory(doc+PATH_DEBUG);

    //init config
    if( file.exist(doc+"dynamic.json") )
    {
        var data = file.read(doc+"dynamic.json");
        this.config = JSON.parse(data);
    }
    else
    {
        var data = file.read("static.json");
        this.config = JSON.parse(data);

        this.saveConfig();
    }

    //binary version check: special for 1.0.3 hotfix
    if( system.getBinaryVersion() != this.config.binary_version ){
        //re init dynamic version
        debug("--- RE-INIT DYNAMIC ---");
        var data = file.read("static.json");
        this.config = JSON.parse(data);
        this.config.binary_version = system.getBinaryVersion();
        this.saveConfig();
    }

    var uiComposer = loadModule("UIComposer.js");
    uiComposer.initUI();
    //register classes for util
    utils.registerClass(loadModule("role.js").Role);
    utils.registerClass(loadModule("skill.js").Skill);
    utils.registerClass(loadModule("xitem.js").Item);
    utils.registerClass(loadModule("xitem.js").Inventory);
    utils.registerClass(loadModule("xdungeon.js").Dungeon);
    utils.registerClass(loadModule("player.js").Player);
    utils.registerClass(loadModule("stage.js").Stage);
    utils.registerClass(loadModule("quest.js").Quest);
    utils.registerClass(loadModule("quest.js").QuestLog);
    utils.registerClass(loadModule("role.js").FriendList);
    utils.registerClass(loadModule("bountyx.js").BountyLog);

    //register pop ups
    engine.pop.registerPop("announce", loadModule("pops.js").invokeAnnouncement);
    engine.pop.registerPop("level", loadModule("pops.js").invokePopLevelUp);
    engine.pop.registerPop("quest", loadModule("questInfo.js").checkQuestPop);
    engine.pop.registerPop("activity", loadModule("activity.js").invokeActivity);
    engine.pop.registerPop("tutorial", loadModule("tutorialx.js").activateTutorial);
    engine.pop.registerPop("monthcard", loadModule("pops.js").invokeMonthCardPop);

    //read game tables
    var table = loadModule("table.js");
    table.loadTable(TABLE_ITEM);
    table.loadTable(TABLE_ROLE);
    table.loadTable(TABLE_STAGE);
    table.loadTable(TABLE_EFFECT);
    table.loadTable(TABLE_CARD);
    table.loadTable(TABLE_SKILL);
    table.loadTable(TABLE_LEVEL);
    table.loadTable(TABLE_DUNGEON);
    table.loadTable(TABLE_UPGRADE);
    table.loadTable(TABLE_ENHANCE);
    table.loadTable(TABLE_QUEST);
    table.loadTable(TABLE_DIALOGUE);
    table.loadTable(TABLE_VIP);
    table.loadTable(TABLE_BROADCAST);
    table.loadTable(TABLE_TRIGGER);
    table.loadTable(TABLE_TUTORIAL);
    table.loadTable(TABLE_TUTORIAL_CONFIG);
    table.loadTable(TABLE_BAN);
    table.loadTable(TABLE_BOUNTY);
    table.loadTable(TABLE_FACTION);
    table.loadTable(TABLE_COST);
    table.loadTable(TABLE_DROP);
    table.loadTable(TABLE_DP);
    table.loadTable(TABLE_ARENA);

    //init global resources
    var sfc = cc.SpriteFrameCache.getInstance();
    sfc.addSpriteFrames("commonui.plist");
    sfc.addSpriteFrames("avatar.plist");
    sfc.addSpriteFrames("popnum.plist");

    //push back handler
    var back = loadModule("back.js");
    engine.event.pushNTFHandler(back.onEvent, back);

    debug("Version "+system.getBinaryVersion()+"("+this.config.resource_version+")");

    this.processPreference();
}

/*** Manage Server Time ***/

Game.prototype.getServerTime = function()
{
    return Date.now()+this.serverTimeOffset;
}

Game.prototype.syncServerTime = function(serverTime)
{
    this.serverTimeOffset = serverTime*1000 - Date.now();
    debug("SERVER TIME OFFSET = "+this.serverTimeOffset);
}

/*** Manage Config File ***/

Game.prototype.saveConfig = function()
{
    var doc = file.getDocumentPath();
    file.write(doc+"dynamic.json", JSON.stringify(this.config));
}

Game.prototype.getConfig = function()
{
    return this.config;
}

Game.prototype.processPreference = function(){
    //debug mode detect
    var debugOld = false;
    if( this.config.debug != null ){
        debugOld = this.config.debug;
    }
    var debugNew = false;
    var debugStrNew = system.getPreference("flag_debug");
    if( debugStrNew == "1" ){
        debugNew = true;
    }
    if( debugOld != debugNew ){
        engine.user.clearAllProfiles();
    }
    this.config.debug = debugNew;

    if( this.config.debug ){
        var blackbox = false;
        var bboxStr = system.getPreference("flag_blackbox");
        if( bboxStr == "1" ){
            blackbox = true;
        }
        FLAG_BLACKBOX = !blackbox;
    }
    else{
        FLAG_BLACKBOX = true;
    }

    this.saveConfig();
    debug("-- SETTINGS --\nDEBUG="+this.config.debug+"\nBLACKBOX="+FLAG_BLACKBOX);

    //--load music&sfx settings
    if( this.config.flag_music === false ){
        cc.AudioEngine.getInstance().setMusicVolume(0);
    }
    else{
        cc.AudioEngine.getInstance().setMusicVolume(MUSIC_VOLUME);
    }
    if( this.config.flag_sfx === false ){
        cc.AudioEngine.getInstance().setEffectsVolume(0);
    }
    else{
        cc.AudioEngine.getInstance().setEffectsVolume(SFX_VOLUME);
    }
}

var singleton = new Game();

exports.instance = singleton;
