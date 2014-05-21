/**
 * User: hammer
 * Date: 13-8-16
 * Time: 下午4:39
 */

var effect = loadModule("effect.js");
var table = loadModule("table.js");
var stage = loadModule("stage.js");
var role = loadModule("role.js");
var scroller = loadModule("scroller.js");
var ui = loadModule("UIComposer.js");
var libItem = loadModule("xitem.js");
var libUIKit = loadModule("uiKit.js");
var libQuest = loadModule("questInfo.js");

var theLayer = null;
var theChapterClass;
var theStageClass;

var theEnergyCost = 0;

var BIRD_HIGH = 30;
var CLOUD_HIGH = 40;

var MODE_WORLD = 0;
var MODE_STAGE = 1;

var TYPE_NORMAL = 0;
var TYPE_CHALLENGE = 1;
var theType = -1;

function onEvent(event)
{
    return false;
}

function onClose(sender)
{
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    var main = loadModule("sceneMain.js");
    engine.ui.newScene(main.scene());
}

function onQuest(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libQuest.show();
}

function onEnter()
{
    theLayer = engine.ui.curLayer;

    if( !cc.AudioEngine.getInstance().isMusicPlaying() )
    {
        cc.AudioEngine.getInstance().playMusic("login.mp3");
    }

    var sfc = cc.SpriteFrameCache.getInstance();
    sfc.addSpriteFrames("map.plist");
    sfc.addSpriteFrames("map2.plist");

    var winSize = cc.Director.getInstance().getWinSize();

    theLayer.bgOwner = {};
    theLayer.bg = cc.BuilderReader.load("ui-map.ccbi", theLayer.bgOwner);
    theLayer.bg.setPosition(cc.p(0, 0));
    theLayer.addChild(theLayer.bg);

    {//cache calculation
        theLayer.mapsize = theLayer.bg.getContentSize();

        //calc map restriction
        theLayer.mapMinY = winSize.height - theLayer.mapsize.height;
        theLayer.mapMaxY = 0;
    }

    //add stage scene
    theLayer.owner = {};
    theLayer.owner.onClose = onClose;
    theLayer.owner.onQuest = onQuest;
    var node = cc.BuilderReader.load("sceneMap.ccbi", theLayer.owner);
    theLayer.addChild(node);

    theLayer.onTouchBegan = onTouchBegan;
    theLayer.onTouchMoved = onTouchMoved;
    theLayer.onTouchEnded = onTouchEnded;
    theLayer.onTouchCancelled = onTouchCancelled;
    theLayer.setTouchMode(cc.TOUCHES_ONE_BY_ONE);
    theLayer.setTouchEnabled(true);

    engine.ui.regMenu(theLayer);
    engine.ui.regMenu(theLayer.owner.menuRoot);

    initStage();

    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);
}

function onExit()
{
    loadModule("broadcastx.js").instance.close();
}

function onActivate(){
    engine.pop.setAllAndInvoke("stage");
}

function initStage()
{
    var stg = engine.user.stage;
    theLayer.chapterList = {};
    for(var k=0; k<table.getTableLength(TABLE_STAGE); ++k)
    {
        var locked = true;
        if( stg.Chapters[k] != null ){
            locked = false;
        }

        var ChClass = table.queryTable(TABLE_STAGE, k);
        if( ChClass.hidden != true ){
            //replace check
            var parent = theLayer.bgOwner.nodeList.getChildByTag(ChClass.idx);
            if( parent.CID != null ){
                if( parent.LCK == true ){
                    parent.removeAllChildren();
                    delete theLayer.chapterList[parent.CID];
                }
                else{
                    continue;
                }
            }

            var sprite = cc.Sprite.createWithSpriteFrameName(ChClass.style+".png");
            sprite.setPosition(cc.p(0, 0));
            parent.addChild(sprite);
            parent.CID = k;
            parent.LCK = locked;

            theLayer.chapterList[k] = {
                sprite: sprite,
                parent: parent,
                locked: locked
            };

            if( locked ){
                var nstyle = ChClass.style+"x.png";
                var sfc = cc.SpriteFrameCache.getInstance();
                sprite.setDisplayFrame(sfc.getSpriteFrame(nstyle));
            }
        }
    }
}

var touchRange = 100;

function chapterAtPos(pos)
{
    for(var k in theLayer.chapterList){
        var data = theLayer.chapterList[k];
        if( data.locked == false ){
            var dst = cc.pDistance(data.parent.getPosition(), pos);
            if( dst < touchRange ){
                return k;
            }
        }
    }
    return -1;
}

function onMode(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( theType == TYPE_NORMAL ){
        onChallenge();
    }
    else if( theType == TYPE_CHALLENGE ){
        onNormal();
    }
}

function onNormal(){
    theType = TYPE_NORMAL;
    var chInst = engine.user.stage.Chapters[theChapterClass.chapterId];
    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.stage.owner.nodeNormal.setVisible(true);
    theLayer.stage.owner.nodeChallenge.setVisible(false);

    //hide all seven stage buttons
    for(var k=1; k<=7; ++k){
        var btn = theLayer.stage.owner.menu.getChildByTag(k);
        btn.setVisible(true);
    }

    debug("chInst = \n"+JSON.stringify(chInst));
    //show the seven stage buttons
    var curStageIndex = 0;
    var foreverStage = false;
    for(var k in theChapterClass.stage)
    {
        var n = Number(k);
        var stg = theChapterClass.stage[k];

        if( stg.isInfinite ){//skip infinite
            if( chInst.Stages[k] != null && chInst.Stages[k].State >= 1 ){
                foreverStage = true;
                theLayer.INFIKEY = Number(k);
            }
            continue;
        }

        var stageKey = "spriteStage"+(n+1);
        var stageNode = theLayer.stage.owner[stageKey];

        var sta = 0;
        if( chInst.Stages[k] != null )
        {
            sta = chInst.Stages[k].State;
        }
        if( /*stg.hidden != true ||*/ sta != 0 )
        {
            stageNode.setVisible(true);
        }
        switch(sta)
        {
            case 0://未激活
                break;
            case 1://已激活
                break;
            case 2://已击穿
                stageNode.setDisplayFrame(sfc.getSpriteFrame("dungeoniconbg1.png"));
                break;
        }
        if( sta > 0 )
        {
            curStageIndex = n;
        }
    }
    selectStage(curStageIndex);
    if( foreverStage ){
        debug("FOREVER STAGE IS ENABLED");
        theLayer.stage.owner.btnMode.setEnabled(true);
    }
    else{
        debug("FOREVER STAGE IS DISABLED");
        theLayer.stage.owner.btnMode.setEnabled(false);
    }
    //set challenge button
    theLayer.stage.owner.btnMode.setNormalSpriteFrame(sfc.getSpriteFrame("map-btn-wjms1.png"));
    theLayer.stage.owner.btnMode.setSelectedSpriteFrame(sfc.getSpriteFrame("map-btn-wjms2.png"));
    theLayer.stage.owner.btnMode.setDisabledSpriteFrame(sfc.getSpriteFrame("map-btn-wjms2.png"));
}

function getInfiPrize(dungeon, level){
    var infiPrize = dungeon.infinityPrize;
    for(var k in infiPrize){
        var pl = infiPrize[k];
        if( pl.level >= level ){
            return pl;
        }
    }
    //if not found
    return {
        level: -1
    };
}

function onChallenge(){
    theType = TYPE_CHALLENGE;
    var chInst = engine.user.stage.Chapters[theChapterClass.chapterId];
    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.stage.owner.nodeNormal.setVisible(false);
    theLayer.stage.owner.nodeChallenge.setVisible(true);
    if( theLayer.stage.spriteSelect != null)
    {
        theLayer.stage.spriteSelect.setVisible(false);
    }

    //hide all seven stage buttons
    for(var k=1; k<=7; ++k){
        var btn = theLayer.stage.owner.menu.getChildByTag(k);
        btn.setVisible(false);
    }
    //set challenge button
    theLayer.stage.owner.btnMode.setNormalSpriteFrame(sfc.getSpriteFrame("map-btn-zcms1.png"));
    theLayer.stage.owner.btnMode.setSelectedSpriteFrame(sfc.getSpriteFrame("map-btn-zcms2.png"));
    theLayer.stage.owner.btnMode.setDisabledSpriteFrame(sfc.getSpriteFrame("map-btn-zcms2.png"));

    var team = 3;
    if( Math.floor(chInst.Stages[theLayer.INFIKEY].Level%10 == 0 )){
        team = 1;
    }
    else if( Math.floor(chInst.Stages[theLayer.INFIKEY].Level%5) == 0 ){
        team = 2;
    }
    theLayer.TEAM = team;
    theLayer.stage.owner.labelTeam.setString("队伍人数："+team+"人");
    theLayer.stage.owner.labelLevel.setString(chInst.Stages[theLayer.INFIKEY].Level);

    theStageClass = theLayer.CHCLASS.stage[theLayer.INFIKEY];
    theLayer.stageSelected = theStageClass.stageId;
    theLayer.COST = theStageClass.cost;
    var dungeon = table.queryTable(TABLE_DUNGEON, theStageClass.dungeon);
    var prize = getInfiPrize(dungeon, chInst.Stages[theLayer.INFIKEY].Level);
    var preview = libItem.ItemPreview.create([prize]);
    theLayer.stage.owner.labNext.setString("打通第"+prize.level+"关可以获得额外奖励：");
    theLayer.stage.owner.nodePrize.addChild(preview);
    theLayer.stage.owner.labelEnergy.setString("精力消耗："+theLayer.COST+"点");

    theEnergyCost = theLayer.COST;
    engine.session.set("stage", theStageClass);
}

function showStages(chId)
{
    var stage = engine.ui.newLayer();
    var mask = blackMask();
    stage.addChild(mask);
    var winSize = cc.Director.getInstance().getWinSize();
    theLayer.stageLayer = stage;
    theLayer.stage = {};
    theLayer.stage.owner = {};
    theLayer.stage.owner.onStage = onSelectStage;
    theLayer.stage.owner.onMode = onMode;
    theLayer.stage.node = cc.BuilderReader.load("ui-stage.ccbi", theLayer.stage.owner);
    theLayer.stage.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    stage.addChild(theLayer.stage.node);
    engine.ui.regMenu(theLayer.stage.owner.menu);

    //set values
    theLayer.CHID = chId;
    theLayer.CHCLASS = table.queryTable(TABLE_STAGE, chId);
    var chClass = theLayer.CHCLASS;
    theChapterClass = theLayer.CHCLASS;
    var sfc = cc.SpriteFrameCache.getInstance();

    theLayer.stage.owner.spriteIcon1.setDisplayFrame(sfc.getSpriteFrame(chClass.icon));
    theLayer.stage.owner.spriteIcon2.setDisplayFrame(sfc.getSpriteFrame(chClass.icon));
    theLayer.stage.owner.spriteTitle.setDisplayFrame(sfc.getSpriteFrame("x"+chClass.title));
    theLayer.stage.owner.labelDesc.setString(chClass.desc);
    var btnOK = buttonNormalL("buttontext-confirm.png", BUTTON_OFFSET, this, onBtnOK, BUTTONTYPE_DEFAULT);
    btnOK.setPosition(theLayer.stage.owner.nodeButton2.getPosition());
    theLayer.stage.owner.menu.addChild(btnOK);
    var btnCancel = buttonNormalL("buttontext-qx.png", BUTTON_OFFSET, this, onBtnCancel);
    btnCancel.setPosition(theLayer.stage.owner.nodeButton1.getPosition());
    theLayer.stage.owner.menu.addChild(btnCancel);

    onNormal();

    theLayer.stage.node.setScale(0);
    theLayer.stage.node.runAction(actionPopIn());
}

function hideStages()
{
    theLayer.stage.node.runAction(actionPopOut(function(){
        engine.ui.removeLayer(theLayer.stageLayer);
        delete theLayer.stageLayer;
        delete theLayer.stage;
    }));
}

function onBtnOK(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    hideStages();
    startStage(theLayer.stageSelected, theLayer.TEAM, theEnergyCost);
    debug("START STAGE "+theLayer.CHID+" - "+theLayer.stageSelected);
}

function onBtnCancel(sender)
{
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    hideStages();
}

function selectStage(sId)
{
    var num = sId+1;
    var stageKey = "spriteStage"+num;
    var stageNode = theLayer.stage.owner[stageKey];

    if( theLayer.stage.spriteSelect == null)
    {
        theLayer.stage.spriteSelect = cc.Sprite.createWithSpriteFrameName("mapicon-selected.png");
        theLayer.stage.node.addChild(theLayer.stage.spriteSelect);
    }
    else{
        theLayer.stage.spriteSelect.setVisible(true);
    }
    theLayer.stage.spriteSelect.setPosition(stageNode.getPosition());

    var chClass = table.queryTable(TABLE_STAGE, theLayer.CHID);
    var stg = chClass.stage[sId];
    theStageClass = stg;
    theLayer.stageSelected = stg.stageId;
    theLayer.TEAM = stg.team;
    theLayer.stage.owner.labelTeam.setString("队伍人数："+stg.team+"人");
    theLayer.stage.owner.labelEnergy.setString("精力消耗："+stg.cost+"点");
    theEnergyCost = stg.cost;

    //set current stage data
    engine.session.set("stage", stg);
}

function onSelectStage(sender)
{
    var tag = sender.getTag();
    var stageKey = "spriteStage"+tag;
    var stageNode = theLayer.stage.owner[stageKey];
    if( stageNode.isVisible() )
    {
        selectStage(tag -1);
        cc.AudioEngine.getInstance().playEffect("xuanze.mp3");
    }
}

function onTouchBegan(touch, event)
{
    var pos = touch.getLocation();
    theLayer.beginTouch = pos;
    theLayer.beginMapPos = theLayer.bg.getPosition();

    var rpos = theLayer.bg.convertTouchToNodeSpace(touch);
    var chId = chapterAtPos(rpos);
    if( chId >= 0 ){
        debug("touchBegin = "+chId);
        var data = theLayer.chapterList[chId];
        var scale1 = cc.ScaleTo.create(0.1, 1.4);
        var scale2 = cc.ScaleTo.create(0.1, 1);
        var sequence = cc.Sequence.create(scale1, scale2);
        data.sprite.runAction(sequence);
        cc.AudioEngine.getInstance().playEffect("xuanze.mp3");
    }

    return true;
}

function onTouchMoved(touch, event)
{
    var pos = touch.getLocation();
    var dis = cc.pSub(pos, theLayer.beginTouch);
    dis.x = 0;
    var np = cc.pAdd(theLayer.beginMapPos, dis);
    //check map restriction
    if( np.y < theLayer.mapMinY )
    {
        np.y = theLayer.mapMinY;
    }
    if( np.y > theLayer.mapMaxY )
    {
        np.y = theLayer.mapMaxY;
    }
    theLayer.bg.setPosition(np);
}

function onTouchEnded(touch, event)
{
    var pos = touch.getLocation();

    var dis = cc.pDistance(pos, theLayer.beginTouch);
    if( dis < CLICK_RANGE )
    {//touch
        var rpos = theLayer.bg.convertTouchToNodeSpace(touch);
        debug("TOUCH RPOS = "+JSON.stringify(rpos));
        var chId = chapterAtPos(rpos);
        if( chId > 0 )
        {
            showStages(chId);
        }
    }
}

function onTouchCancelled(touch, event)
{
    theLayer.onTouchEnded(touch, event);
}

function scene()
{
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onEvent,
        onActivate: onActivate
    };
}

//-------------------
function startStage(stg, team, cost){
    debug("startStage("+stg+", "+team+", "+cost+")");
    //check energy
    if( engine.user.player.Energy < cost ){
        var need = cost - engine.user.player.Energy;
        var str1 = "精力值不足\n进入此关还需要"+need+"精力\n需要使用"+need+"宝石来立即恢复吗?";
        var str2 = "精力值不足，无法进入此关\n使用"+need+"宝石可以立即恢复\n需要充值吗?";
        libUIKit.confirmPurchase(Request_BuyFeature, {
            typ: 0,
            tar: cost
        }, str1, str2, cost, function(rsp){
            if( rsp.RET == RET_OK ){
                //统计
                tdga.itemPurchase("精力值", need, 1);
            }
        });
        return;
    }

    var dungeon = {};
    dungeon.stage = stg;
    dungeon.party = [];
    dungeon.team = team;
    engine.user.setData("dungeon", dungeon);

    if( dungeon.team > 1 )
    {//choose teammate
        loadModule("sceneTeam.js").show(team);
    }
    else
    {//start dungeon
        requestBattle(engine.user.dungeon.stage, [engine.user.actor]);
    }
}

exports.startStage = startStage;
exports.scene = scene;