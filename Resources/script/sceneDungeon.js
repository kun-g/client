/**
 * User: hammer
 * Date: 13-7-15
 * Time: 上午9:26
 */

var theLayer = null;
var ui = loadModule("UIComposer.js");
var role = loadModule("role.js");
var dungeon = loadModule("xdungeon.js");
var action = loadModule("action.js");
var actions = loadModule("actions.js");
var avatar = loadModule("avatar.js");
var effect = loadModule("effect.js");
var table = loadModule("table.js");
var skill = loadModule("skill.js");
var stage = loadModule("sceneStage.js");
var box = loadModule("blackbox.js");
var libUIKit = loadModule("uiKit.js");
var libGadgets = loadModule("gadgets.js");

var theDungeon = null;
var thePopMsg = null;

var gameOverFlag = false;
var resultFlag = false;
var hasResult;
var FailReason;

var TOUCH_NONE = -1;
var TOUCH_GRID = 0;
var TOUCH_CARD = 1;

var MODE_PLAY = 0;
var MODE_PAUSE = 1;

var MAGIC_WALL = 0.109756;

var theSkillCdEffect;
var theFadeInFlag = false;

function onEvent(event)
{
    switch(event.NTF)
    {
        case Event_DungeonEnter:
        {
            if( event.arg.stg != null ){
                engine.user.dungeon.stage = event.arg.stg;
                if( event.arg.stg == INITIAL_STAGE )
                {
                    theDungeon.TutorialFlag = true;
                    debug("DUNGEON TUTOROAL FLAG");
                }
            }
            //set skill cd
            var cd = 0;
            if( event.arg.cd != null )
            {
                cd = event.arg.cd;
            }
            theDungeon.SkillCd = cd;
            theLayer.setCardCd(0, cd);

            //override party setting
            if( event.arg.pat != null )
            {
                engine.user.dungeon.party = [];
                for(var k in event.arg.pat)
                {
                    var m = new role.Role(event.arg.pat[k]);
                    m.fix();
                    engine.user.dungeon.party.push(m);
                }
            }
            if( theDungeon.Heroes == null || theDungeon.Heroes.length == 0 )
            {
                applyParty();
            }

            hasResult = false;
            return true;
        }
        case Event_DungeonAction:
        {
            theLayer.actions.batch();//batch a new wave of actions
            if( Array.isArray(event.arg) )
            {
                for(var pace in event.arg)
                {
                    pace = Number(pace);
                    var acts = event.arg[pace];
                    if( Array.isArray(acts) )
                    {
                        for(var k in acts)
                        {
                            var act = acts[k];
                            //debug("act src="+JSON.stringify(act));
                            theLayer.actions.pushAction(actions.make(pace, act.id, act));
                        }
                    }
                    else
                    {
                        //debug("act src="+JSON.stringify(acts));
                        theLayer.actions.pushAction(actions.make(pace, acts.id, acts));
                    }
                }
            }
            else
            {
                var act = event.arg;
                //debug("act src="+JSON.stringify(act));
                theLayer.actions.pushAction(actions.make(0, act.id, act));
            }

            theLayer.waitResponse = false;
            theLayer.updateMode();
            return true;
        }
        case Message_TouchGrid:
        {
            var pos = event.arg.pos;
            var block = theDungeon.Blocks[pos];
            if( block.trans != null ){
                pos = block.trans;
            }

            if( theLayer.canControl )
            {
                if( theLayer.mode == MODE_PLAY )
                {
                    if( theDungeon.Blocks[pos].access )
                    {
                        var command = null;
                        if( !theDungeon.Blocks[pos].explored )
                        {
                            if( theLayer.approachGrid(pos) )
                            {
                                command = Request_DungeonExplore;
                                theLayer.requestExplore = true;
                            }
                        }
                        else
                        {
                            if( theDungeon.Blocks[pos].type == BLOCK_EXIT )
                            {
                                if( theLayer.moveGrid(pos) )
                                {
                                    command = Request_DungeonActivate;
                                    engine.event.holdNotifications();

                                    theLayer.actions.batch();
                                    var sound = {};
                                    sound.sod = "nextfloor.mp3";
                                    theLayer.actions.pushAction(actions.make(0, 108, sound));
                                    theLayer.actions.pushAction(actions.make(0, 9, {
                                        mod: 0,
                                        tim: 2
                                    }));
                                    theLayer.actions.pushAction(actions.make(0, 10, {
                                        tim: 2
                                    }));
                                    var evt = {};
                                    evt.NTF = Message_LevelCompleted;
                                    theLayer.actions.pushAction(actions.make(1, 300, {
                                        event: evt
                                    }));
                                }
                                else{
                                    thePopMsg.pushMsg("那个出口被挡住了", POPTYPE_ERROR);
                                }
                            }
                            else if( theDungeon.Blocks[pos].type == BLOCK_ENEMY )
                            {
                                //try to fight against the enemy
                                if( theLayer.approachGrid(pos) )
                                {
                                    command = Request_DungeonAttack;
                                }
                                else{
                                    thePopMsg.pushMsg("够不到这个怪物", POPTYPE_ERROR);
                                }
                            }
                            else if( theDungeon.Blocks[pos].type == BLOCK_NPC )
                            {
                                if( theLayer.approachGrid(pos) )
                                {
                                    command = Request_DungeonActivate;
                                }
                                else{
                                    thePopMsg.pushMsg("到不了那个地方", POPTYPE_ERROR);
                                }
                            }
                        }
                        if( command != null )
                        {
                            theLayer.waitResponse = true;
                            theLayer.updateMode();

                            var arg = {};
                            arg.tar = pos;
                            for(var k in theDungeon.Heroes)
                            {
                                var unit = theDungeon.Heroes[k];
                                var index = unit.ref - HERO_TAG;
                                var key = "pos";
                                if(index > 0 )
                                {
                                    key += index;
                                }
                                arg[key] = unit.rpos;
                            }
                            engine.event.sendNTFEvent(command, arg);
                        }
                    }
                    else{
                        thePopMsg.pushMsg("还去不了这个地方", POPTYPE_ERROR);
                    }
                }
            }
            return true;
        }
        case Event_DungeonReward:
        {
            var result = loadModule("sceneResult.js");
            result.setResult(event.arg);
            result.setParty(engine.user.dungeon.party);
            resultFlag = true;

            if( event.arg.prize != null ){
                hasResult = true;
            }

            return true;
        }
        case Message_LevelCompleted:
        {
            cc.log("RUNNING LOADING...");//debug
            theLayer.hideBossHp();
            engine.event.releaseNotifications();
            return true;
        }
        case Message_OnCardSelect:
        {
            //assign new value
            theLayer.card.select = event.arg.slot;

            if( theLayer.card.showDesc )
            {
                theLayer.updateCardDesc();
            }
            else
            {
                theLayer.card.hover = true;
                theLayer.card.timer = 0;
            }

            theLayer.fadeCardPop();//clean existing pop if any

            if( theLayer.card.select > 0 )
            {//use card
                var pop = {};
                pop.ServerId = -1;
                pop.Type = theDungeon.Cards[theLayer.card.select-1].Type;
                pop.Count = 1;
                theLayer.card.pop = theLayer.makeCard(pop);
                theLayer.card.pop.setPosition(cc.p(theLayer.card.select*CARD_SPACE, 0));
                theLayer.card.pop.setTag(theLayer.card.select);
                theLayer.card.nodePop.addChild(theLayer.card.pop);

                var cscale1 = cc.ScaleTo.create(0.1, 1.5);
                var cscale4 = cc.ScaleTo.create(0.1, 1.3);
                var cscales = cc.Sequence.create(cscale1, cscale4);
                theLayer.card.pop.runAction(cscales);

                theLayer.setCardCount(theLayer.card.select, theDungeon.Cards[theLayer.card.select-1].Count-1);

                var node = theLayer.card.nodeList.getChildByTag(theLayer.card.select);
                node.setColor(cc.c3b(128, 128, 128));
            }
            else
            {//use skill
                var theSkill = engine.user.dungeon.party[0].querySkill(0);
                var SkClass = table.queryTable(TABLE_SKILL, theSkill.ClassId);
                theLayer.card.pop = cc.Sprite.createWithSpriteFrameName("cardbg1.png");
                var image = cc.Sprite.create(SkClass.icon);
                image.setPosition(cc.p(theLayer.card.pop.getContentSize().width/2, theLayer.card.pop.getContentSize().height/2));
                image.setScale(UI_SKILL_SCALE);
                theLayer.card.pop.setTag(0);
                theLayer.card.pop.addChild(image);
                theLayer.card.nodePop.addChild(theLayer.card.pop);

                var cscale1 = cc.ScaleTo.create(0.1, 1.5);
                var cscale4 = cc.ScaleTo.create(0.1, 1.3);
                var cscales = cc.Sequence.create(cscale1, cscale4);
                theLayer.card.pop.runAction(cscales);

                var node = theLayer.card.nodeList.getChildByTag(0);
                node.setColor(cc.c3b(128, 128, 128));
            }

            return true;
        }
        case Message_OnCardDismiss:
        {
            theLayer.card.select = -1;
            theLayer.updateCardDesc();

            return true;
        }
        case Message_OnCardUse:
        {
            if( theLayer.card.select == 0 )
            {//use skill
                //check skill cd
                if( theDungeon.SkillCd == 0 ){

                    theLayer.waitResponse = true;
                    theLayer.updateMode();

                    engine.event.sendNTFEvent(Request_DungeonSpell);

                    theLayer.fadeCardUse();
                }
                else{
                    theLayer.fadeCardPop();
                }
            }
            else
            {//use card
                //check count and usage
                var card = theDungeon.Cards[theLayer.card.select-1];
                var cardClass = table.queryTable(TABLE_CARD, card.Type);
                if( cardClass.passive != true )
                {
                    {//use directly
                        theLayer.waitResponse = true;
                        theLayer.updateMode();

                        engine.event.sendNTFEvent(Request_DungeonCard, {
                            slt: card.ServerId
                        });
                    }
                    theLayer.fadeCardUse();
                }
                else
                {
                    theLayer.fadeCardPop();
                }
            }
            theLayer.card.select = -1;
            theLayer.updateCardDesc();

            return true;
        }
        case Message_About2Reboot:
        {
            //dump battle state
            engine.user.setData("ddump", engine.box.save());
            engine.user.saveProfile();
            return false;
        }
        case Message_OnEnterBackground:
        {
            //dump battle state
            engine.user.setData("ddump", engine.box.save());
            return false;
        }
        case Message_QuestUpdate:{
            //debug("QUEST UPDATE = "+JSON.stringify(event));
            for(var k in event.arg){
                var qu = event.arg[k];
                thePopMsg.pushMsg(qu.label+" "+qu.now+"/"+qu.total, POPTYPE_INFO);
            }
            return false;
        }
        case Message_ResetDungeon:{
            //pop ui
            loadModule("pops.js").popInvalidDungeon();
            return true;
        }
    }
}

function onPauseExit(sender)
{
    theLayer.pause.node.runAction(actionPopOut(function(){
        engine.ui.popLayer();
        theLayer.greymask.setVisible(false);
        delete theLayer.pause;

        onCancelDungeon(false);
    }));
}

function onPauseCancel(sender)
{
    theLayer.pause.node.runAction(actionPopOut(function(){
        engine.ui.popLayer();
        theLayer.greymask.setVisible(false);
        delete theLayer.pause;
    }));
}

function onPauseHint(sender)
{
    theLayer.pause.node.runAction(actionPopOut(function(){
        engine.ui.popLayer();
        theLayer.greymask.setVisible(false);
        delete theLayer.pause;

        loadModule("tutorial.js").showHint();
    }));
}

function onPause(sender)
{
    var thiz = theLayer;
    var newLayer = engine.ui.newLayer();

    var winSize = cc.Director.getInstance().getWinSize();
    thiz.greymask.setVisible(true);

    thiz.pause = {};
    thiz.pause.owner = {};
    thiz.pause.node = cc.BuilderReader.load("ui-pause.ccbi", thiz.pause.owner);
    thiz.pause.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    thiz.pause.node.setScale(0);
    newLayer.addChild(theLayer.pause.node);
    thiz.pause.node.runAction(actionPopIn());

    thiz.pause.menu = cc.Menu.create();
    thiz.pause.menu.setPosition(cc.p(0, 0));
    thiz.pause.node.addChild(thiz.pause.menu);

    engine.ui.regMenu(thiz.pause.menu);

    var exit = buttonNormalL("buttontext-tc.png", BUTTON_OFFSET, thiz, thiz.onPauseExit);
    exit.setPosition(thiz.pause.owner.btnExit.getPosition());
    var cancel = buttonNormalL("buttontext-qx.png", BUTTON_OFFSET, thiz, thiz.onPauseCancel);
    cancel.setPosition(thiz.pause.owner.btnCancel.getPosition());
    var tips = buttonNormalL("tutorial-title.png", BUTTON_OFFSET, thiz, thiz.onPauseHint);
    tips.setPosition(thiz.pause.owner.btnTips.getPosition());
    thiz.pause.menu.addChild(exit);
    thiz.pause.menu.addChild(tips);
    thiz.pause.menu.addChild(cancel);

    if( theDungeon.TutorialFlag ){
        exit.setEnabled(false);
    }
}

function onQuest(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    loadModule("questInfo.js").show();
}

function showBuyRevive(){
    var order = engine.session.queryStore(ItemId_RevivePotion, 1);
    if( order != null ){
        var alert = libUIKit.alert();
        if( engine.user.inventory.Diamond >= order.cost.diamond ){
            alert.setContent("你没有复活药水\n是否立即花"+order.cost.diamond+"宝石购买一瓶？");
            alert.setButton([
                {
                    label: "buttontext-qx.png",
                    func: function(sender){
                        this.setCloseCallback(onCancelDungeon, theLayer);
                        this.onClose();
                    },
                    obj: alert
                },
                {
                    label: "buttontext-confirm.png",
                    func: function(sender){
                        libUIKit.waitRPC(Request_StoreBuyItem, {
                            sid: order.sid,
                            cnt: 1,
                            ver: engine.session.shop.version
                        }, function(rsp){
                            if( rsp.RET == RET_OK ){
                                alert.setCloseCallback(onUseRevive, theLayer);
                                alert.onClose();
                            }
                            else{
                                alert.setCloseCallback(function(){
                                    libUIKit.showAlert(ErrorMsgs[rsp.RET], onCancelDungeon, theLayer);
                                }, alert);
                                alert.onClose();
                            }
                        })
                    },
                    obj: alert,
                    type: BUTTONTYPE_DEFAULT
                }
            ]);
        }
        else{
            alert.setContent("你没有复活药水\n也没有足够的宝石购买一瓶\n是否要立即充值？");
            alert.setButton([
                {
                    label: "buttontext-qx.png",
                    func: function(sender){
                        this.setCloseCallback(onCancelDungeon, theLayer);
                        this.onClose();
                    },
                    obj: alert
                },
                {
                    label: "buttontext-confirm.png",
                    func: function(sender){
                        this.setCloseCallback(function(){
                            loadModule("uiChargeDiamond.js").node(showBuyRevive, theLayer);
                        }, theLayer);
                        this.onClose();
                    },
                    obj: alert,
                    type: BUTTONTYPE_DEFAULT
                }
            ]);
        }
    }
}

function onUseRevive(){
    var pos = calcPosInGrid(17);
    effect.attachEffectCCBI(theLayer.effects, pos, "effect-revie2.ccbi");
    engine.event.sendNTFEvent(Request_DungeonRevive);

    //统计使用复活药水
    var ItemClass = table.queryTable(TABLE_ITEM, ItemId_RevivePotion);
    tdga.itemUse(ItemClass.label, 1);
}

function onCancelDungeon(force){
    if( force == null ){
        force = true;
    }
    if( !theDungeon.TutorialFlag ){
        if( !force ){
            libUIKit.confirm(
                "放弃战斗会立即使战斗失败，\n确定要放弃吗？",
                libUIKit.CONFIRM_NEUTRAL,
                function(){
                    engine.event.sendNTFEvent(Request_CancelDungeon);

                    FailReason = "玩家放弃";
                }, theLayer
            );
        }
        else{
            engine.event.sendNTFEvent(Request_CancelDungeon);

            FailReason = "玩家放弃";
        }
    }
}

function showRevive(potionNeedCount){
    //show revive dialogue
    var alert = libUIKit.alert();
    alert.setContent("队伍成员已经全部牺牲\n是否要使用复活药水继续战斗？");
    alert.setImage("item-revive.png");
    alert.setButton([
        {
            label: "buttontext-qx.png",
            func: function(sender){
                this.setCloseCallback(onCancelDungeon, theLayer);
                this.onClose();
            },
            obj: alert
        },
        {
            label: "buttontext-confirm.png",
            func: function(sender){
                var RevivePotionCount = engine.user.inventory.countItem(ItemId_RevivePotion);
                if( RevivePotionCount > potionNeedCount ){
                    this.setCloseCallback(onUseRevive, theLayer);
                    this.onClose();
                }
                else{
                    this.setCloseCallback(showBuyRevive, theLayer);
                    this.onClose();
                }
            },
            obj: alert,
            type: BUTTONTYPE_DEFAULT
        }
    ]);
}

function doDungeonResult(win){
    theLayer.waitResponse = true;
    theLayer.updateMode();
    var winSize = cc.Director.getInstance().getWinSize();
    cc.AudioEngine.getInstance().stopMusic(true);
    if( win == 1 )
    {//win
        effect.attachEffect(theLayer, cc.p(winSize.width/2, winSize.height/2), 11, effect.EFFECTMODE_STAY);
        cc.AudioEngine.getInstance().playEffect("win.mp3");

        var actDelay = cc.DelayTime.create(4);
        var actFunc = cc.CallFunc.create(theLayer.onGameOver, theLayer);
        var actSeq = cc.Sequence.create(actDelay, actFunc);
        theLayer.runAction(actSeq);
    }
    else if( win == 0 )
    {//lose
        effect.attachEffect(theLayer, cc.p(winSize.width/2, winSize.height/2), 12, effect.EFFECTMODE_STAY);
        cc.AudioEngine.getInstance().playEffect("lose.mp3");

        var actDelay = cc.DelayTime.create(4);
        var actFunc = cc.CallFunc.create(theLayer.onGameOver, theLayer);
        var actSeq = cc.Sequence.create(actDelay, actFunc);
        theLayer.runAction(actSeq);
    }
    else{
        var actDelay = cc.DelayTime.create(3);
        var actFunc = cc.CallFunc.create(theLayer.onGameOver, theLayer);
        var actSeq = cc.Sequence.create(actDelay, actFunc);
        theLayer.runAction(actSeq);
        theFadeInFlag = true;
        theLayer.mask.stopAllActions();
        //theLayer.mask.runAction(cc.FadeIn.create(3));//fade handly
    }

    if( theDungeon.TutorialFlag ){
        engine.event.sendNTFEvent(Request_ReportState, {
            key: "intro",
            val: "finish tutorial stage"
        });
    }

    if( FLAG_BLACKBOX ){
        var log = engine.box.record();
        //先存档，以免服务器断开连接后，存档丢失
        engine.user.setData("ddump", engine.box.save());
        engine.user.saveProfile();
        engine.event.sendRPCEvent(Request_CommitDungeon, log, function(rsp){

            engine.user.unsetData("ddump");
            engine.user.saveProfile();

            if( rsp.RET != RET_OK ){
                resultFlag = true;
            }
            else{
                if( win == 1 ){
                    //统计
                    tdga.questComplete("D"+engine.user.dungeon.stage);
                }
                else if( win == 0 ){
                    //统计
                    tdga.questFailed("D"+engine.user.dungeon.stage, FailReason+"@"+(theDungeon.Level+1));
                }
                else{
                    //统计
                    tdga.questComplete("D"+engine.user.dungeon.stage);
                }
            }
        }, theLayer);
    }
    else{
        if( win == 1 ){
            //统计
            tdga.questComplete("D"+engine.user.dungeon.stage);
        }
        else if( win == 0 ){
            //统计
            tdga.questFailed("D"+engine.user.dungeon.stage, FailReason+"@"+(theDungeon.Level+1));
        }
        else{
            //统计
            tdga.questComplete("D"+engine.user.dungeon.stage);
        }
    }
}

function onGameOver()
{
    gameOverFlag = true;
}

function onEnter()
{
    theLayer = this;
    theFadeInFlag = false;

    cc.AudioEngine.getInstance().playMusic("battle.mp3", true);

    //-----------------
    theLayer.actions = new action.Actions();
    theLayer.EffectList = {};

    theLayer.onEvent = onEvent;
    theLayer.update = update;
    theLayer.resetBlocks = resetBlocks;
    theLayer.updateBlock = updateBlock;
    theLayer.syncAccess = syncAccess;
    theLayer.setLevel = setLevel;
    theLayer.addActor = addActor;
    theLayer.removeActor = removeActor;
    theLayer.removeAllActors = removeAllActors;
    theLayer.getActor = getActor;
    theLayer.addEffect = addEffect;
    theLayer.removeEffect = removeEffect;
    theLayer.setTeamFace = setTeamFace;
    theLayer.baseZOrder = baseZOrder;
    theLayer.approachGrid = approachGrid;
    theLayer.moveGrid = moveGrid;
    theLayer.updateMode = updateMode;
    theLayer.makeCard = makeCard;
    theLayer.selectCard = selectCard;
    theLayer.updateCardDesc = updateCardDesc;
    theLayer.synCard = synCard;
    theLayer.setCardCount = setCardCount;
    theLayer.fadeCardPop = fadeCardPop;
    theLayer.fadeCardUse = fadeCardUse;
    theLayer.setCardCd = setCardCd;
    theLayer.onGameOver = onGameOver;
    theLayer.onPauseExit = onPauseExit;
    theLayer.onPauseHint = onPauseHint;
    theLayer.onPauseCancel = onPauseCancel;
    theLayer.doDungeonResult = doDungeonResult;
    theLayer.showRevive = showRevive;
    theLayer.showBossHp = showBossHP;
    theLayer.hideBossHp = hideBossHP;

    theLayer.onTouchBegan = onTouchBegan;
    theLayer.onTouchMoved = onTouchMoved;
    theLayer.onTouchEnded = onTouchEnded;
    theLayer.onTouchCancelled = onTouchCancelled;

    //init layer mode
    theLayer.waitAction = false;
    theLayer.waitResponse = false;
    theLayer.updateMode();
    //-----------------

    theLayer.setTouchPriority(1);
    theLayer.setTouchMode(cc.TOUCHES_ONE_BY_ONE);
    theLayer.setTouchEnabled(true);
    engine.ui.regMenu(theLayer);

    //setup action environmenta
    theDungeon = new dungeon.Dungeon();
    theLayer.actions.setEnvironment(theDungeon, theLayer);
    theLayer.scheduleUpdate();
    theLayer.avatars = {};

    theLayer.mode = MODE_PLAY;

    var spritecache = cc.SpriteFrameCache.getInstance();
    spritecache.addSpriteFrames("battle.plist");
    spritecache.addSpriteFrames("character.plist");
    spritecache.addSpriteFrames("effect.plist");
    spritecache.addSpriteFrames("effect2.plist");
    spritecache.addSpriteFrames("cards.plist");

    var director = cc.Director.getInstance();
    var screenSize = director.getWinSize();

    theLayer.owner = {};
    theLayer.owner.onPause = onPause;
    theLayer.owner.onQuest = onQuest;

    var node = cc.BuilderReader.load("sceneDungeon.ccbi", theLayer.owner);
    theLayer.addChild(node);
    engine.ui.regMenu(theLayer.owner.menuRoot);

    //link variables
    theLayer.blocks = cc.SpriteBatchNode.create("battle.png");
    theLayer.owner.nodeBlock.addChild(theLayer.blocks);
    theLayer.leveldisplay = theLayer.owner.labLevel;

    theLayer.ground = cc.Node.create();
    theLayer.owner.nodeBlock.addChild(theLayer.ground);

    theLayer.actors = cc.Node.create();
    theLayer.owner.nodeBlock.addChild(theLayer.actors);

    theLayer.effects = cc.Node.create();
    theLayer.owner.nodeBlock.addChild(theLayer.effects);

    //*** CARDS ***
    theLayer.card = {};
    theLayer.card.nodeDesc = cc.Node.create();
    theLayer.addChild(theLayer.card.nodeDesc);

    theLayer.card.nodeList = cc.Node.create();
    theLayer.card.nodePop = cc.Node.create();
    theLayer.owner.nodeCard.addChild(theLayer.card.nodeList);
    theLayer.owner.nodeCard.addChild(theLayer.card.nodePop);

    var leftdown = theLayer.owner.nodeCard.getPosition();
    leftdown.x -= CARD_WIDTH/2;
    leftdown.y -= CARD_HEIGHT/2 + 50;
    theLayer.card.rect = cc.rect(leftdown.x, leftdown.y, 5*CARD_SPACE+CARD_WIDTH, CARD_HEIGHT+50);

    theLayer.card.select = -1;
    theLayer.card.timer = 0;
    theLayer.card.hover = false;
    theLayer.card.showDesc = false;

    resultFlag = false;
    gameOverFlag = false;

    //*** MASK AND FADEIN ***
    theLayer.greymask = blackMask();
    theLayer.addChild(theLayer.greymask);
    theLayer.greymask.setVisible(false);

    theLayer.mask = cc.LayerColor.create(cc.c4b(0, 0, 0, 255), screenSize.width, screenSize.height);
    theLayer.addChild(theLayer.mask);
    //theLayer.mask.runAction(cc.FadeOut.create(2));

    thePopMsg = PopMsg.simpleInit(theLayer);

    theLayer.resetBlocks();

    //GRID DEBUG
//    {
//        var debugnode = cc.Node.create();
//        debugnode.setZOrder(1000);
//        debugnode.setPosition(theLayer.owner.nodeBlock.getPosition());
//        theLayer.addChild(debugnode);
//        for(var i=0; i<DG_BLOCKCOUNT; ++i)
//        {
//            var label = cc.LabelTTF.create(i, UI_FONT, UI_SIZE_XL);
//            label.setAnchorPoint(cc.p(0.5, 0.5));
//            label.setPosition(calcPosInGrid(i));
//            debugnode.addChild(label);
//        }
//        debug("GRID DEBUG - ON");
//    }
    //----------

    //prepare card
    //set skill data
    var theSkill = engine.user.dungeon.party[0].querySkill(0);
    if( theSkill != null )
    {
        var SkClass = table.queryTable(TABLE_SKILL, theSkill.ClassId);

        var node = cc.Sprite.createWithSpriteFrameName("cardbg1.png");
        node.setTag(0);
        node.face = cc.Sprite.create(SkClass.icon);
        node.face.setScale(UI_SKILL_SCALE);
        node.face.setPosition(cc.p(node.getContentSize().width/2, node.getContentSize().height/2));
        node.addChild(node.face);
        theLayer.card.nodeList.addChild(node);

        theSkillCdEffect = effect.attachEffectCCBI(node, node.face.getPosition(), "effect-selected.ccbi", effect.EFFECTMODE_LOOP);
    }
    else{
        debug("*** NO SKILL ***");
    }

    FailReason = "玩家被击败";

    //register broadcast
    loadModule("broadcast.js").instance.simpleInit(this);
    
    
}

function onExit()
{
    cc.AudioEngine.getInstance().stopMusic(true);
    //register broadcast
    loadModule("broadcast.js").instance.close();
}

function onActivate(){
    //schedule pop
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("dungeon");
}

function applyParty()
{
    var party = engine.user.dungeon.party;
    theDungeon.Heroes = [];
    for(var i=0; i<party.length; ++i)
    {
        var unit = {};
        unit.ref = HERO_TAG+i;
        unit.pos = 0;
        unit.health = party[i].Health;
        unit.attack = party[i].Attack;
        unit.type = 0;
        unit.uuid = party[i].ClassId;
        unit.order = i;

        //status color
        unit.ds = 0;
        unit.hs = 0;
        unit.rs = 0;

        theDungeon.Heroes[unit.ref-HERO_TAG] = unit;
    }
}

function update(delta)
{
    if( theFadeInFlag ){
        var step = Math.floor((255*delta)/3);
        var curAlpha = theLayer.mask.getOpacity();
        curAlpha += step;
        if( curAlpha > 255 ) curAlpha = 255;
        theLayer.mask.setOpacity(curAlpha);
    }
    theLayer.actions.updateActions(delta);
    if( theLayer.actions.isAllActionDone() )
    {
        theLayer.waitAction = false;
        if( theDungeon.UpdateAccessFlag )
        {
            theDungeon.updateAccess();
            this.syncAccess();
            theDungeon.UpdateAccessFlag = false;
        }
    }
    else
    {
        theLayer.waitAction = true;
    }
    theLayer.updateMode();
    if( theLayer.canControl && engine.event.isHoldingNotifications() )
    {
        engine.event.releaseNotifications();
    }

    if( theLayer.card.hover )
    {
        theLayer.card.timer += delta;
        if( theLayer.card.timer > 0.7 )
        {
            theLayer.card.showDesc = true;
            theLayer.card.timer = 0;
            theLayer.card.hover = false;
            theLayer.updateCardDesc();
        }
    }

    if( resultFlag && gameOverFlag ){
        //game really over
        if( hasResult ){
            engine.ui.newScene(loadModule("sceneResult.js").scene());
        }
        else{
            engine.ui.newScene(loadModule("sceneMain.js").scene());
        }
    }
}

function updateMode()
{
    var before = theLayer.canControl;

    if( theLayer.waitAction || theLayer.waitResponse )
    {
        theLayer.canControl = false;
    }
    else
    {
        theLayer.canControl = true;
    }

//    if( theLayer.canControl != before )
//    {
//        debug("canControl = "+theLayer.canControl);
//        debug("waitAction = "+theLayer.waitAction);
//        debug("waitResponse = "+theLayer.waitResponse);
//    }
}

function resetBlocks()
{
    var screenSize = cc.Director.getInstance().getWinSize();
    theLayer.actors.removeAllChildren();
    theLayer.blocks.removeAllChildren();
    theLayer.ground.removeAllChildren();

    //set card mask
    theLayer.card.layerMask = blackMask();
    theLayer.card.layerMask.setPosition(cc.p(0, -screenSize.height));
    theLayer.card.layerMask.setVisible(false);
    theLayer.card.layerMask.setZOrder(999);
    theLayer.actors.addChild(theLayer.card.layerMask);

    //init maze
    //pave floor=200+pos box=pos
    for(var i=0; i<DG_BLOCKCOUNT; ++i)
    {
        var x = Math.floor(i%5);
        var y = Math.floor(i/5);
        var pos = cc.p(x*LO_GRID,-y*LO_GRID);
        var floor = null;
        switch ( Math.floor(Math.random()*9 ) ) {
            case 0:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor1.png");
                break;
            case 1:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor2.png");
                break;
            case 2:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor3.png");
                break;
            case 3:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor4.png");
                break;
            case 4:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor5.png");
                break;
            case 5:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor6.png");
                break;
            case 6:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor7.png");
                break;
            case 7:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor8.png");
                break;
            case 8:
                floor = cc.Sprite.createWithSpriteFrameName("battle-floor9.png");
                break;
        }
        floor.setAnchorPoint(cc.p(0, 1));
        floor.setPosition(pos);
        theLayer.blocks.addChild(floor, 10, 200+i);

        var box = null;
        if( Math.floor(Math.random()*5) == 0 )
        {
            box = cc.Sprite.createWithSpriteFrameName("battle-box2.png");
        }
        else
        {
            box = cc.Sprite.createWithSpriteFrameName("battle-box1.png");
        }

        box.setAnchorPoint(cc.p(0, 1));
        box.setPosition(cc.p(x*LO_GRID,-y*LO_GRID));
        theLayer.blocks.addChild(box, 20, i);

        var mask = cc.Sprite.createWithSpriteFrameName("battle-boxshadow.png");
        mask.setAnchorPoint(cc.p(0,1));
        mask.setPosition(cc.p(x*LO_GRID,-y*LO_GRID));
        theLayer.blocks.addChild(mask, 30, 300+i);

        /*
        var shadow = null;
        for(var k=0; k<8; ++k){
            var rpos;
            switch(k){
                case 0:{
                    shadow = cc.Sprite.createWithSpriteFrameName("battle-shadowd3.png");
                    shadow.setAnchorPoint(cc.p(0, 1));
                    rpos = cc.p(0, 0);
                }break;
                case 1:{
                    shadow = cc.Sprite.createWithSpriteFrameName("battle-shadowc1.png");
                    shadow.setAnchorPoint(cc.p(0, 1));
                    rpos = cc.p(LO_CORNER, 0);
                }break;
                case 2:{
                    shadow = cc.Sprite.createWithSpriteFrameName("battle-shadowd4.png");
                    shadow.setAnchorPoint(cc.p(1, 1));
                    rpos = cc.p(LO_GRID, 0);
                }break;
                case 3:{
                    shadow = cc.Sprite.createWithSpriteFrameName("battle-shadowc2.png");
                    shadow.setAnchorPoint(cc.p(1, 1));
                    rpos = cc.p(LO_GRID, -LO_CORNER);
                }break;
                case 4:{
                    shadow = cc.Sprite.createWithSpriteFrameName("battle-shadowd1.png");
                    shadow.setAnchorPoint(cc.p(1, 0));
                    rpos = cc.p(LO_GRID, -LO_GRID);
                }break;
                case 5:{
                    shadow = cc.Sprite.createWithSpriteFrameName("battle-shadowc3.png");
                    shadow.setAnchorPoint(cc.p(0, 0));
                    rpos = cc.p(LO_CORNER, -LO_GRID);
                }break;
                case 6:{
                    shadow = cc.Sprite.createWithSpriteFrameName("battle-shadowd2.png");
                    shadow.setAnchorPoint(cc.p(0, 0));
                    rpos = cc.p(0, -LO_GRID);
                }break;
                case 7:{
                    shadow = cc.Sprite.createWithSpriteFrameName("battle-shadowc4.png");
                    shadow.setAnchorPoint(cc.p(0, 1));
                    rpos = cc.p(0, -LO_CORNER);
                }break;
            }
            shadow.getTexture().setAliasTexParameters();
            shadow.setPosition(cc.pAdd(rpos, pos));
            var stag = 500+i*8+k;
            theLayer.blocks.addChild(shadow, 12, stag);
        }
        */
    }

    //create walls=100+pos
    for(var j=0; j<49; ++j)
    {
        var yy = Math.floor(j/9);
        var xx = Math.floor(j%9);

        var wall = null;

        if( xx < 4 )
        {//|
            wall = cc.Sprite.createWithSpriteFrameName("game-wall2.png");
            wall.setAnchorPoint(cc.p(0.5, MAGIC_WALL));
            wall.setPosition(cc.p(LO_GRID*(xx+1) ,-LO_GRID*(yy+1)));
        }
        else
        {//--
            wall = cc.Sprite.createWithSpriteFrameName("game-wall1.png");
            wall.setAnchorPoint(cc.p(MAGIC_WALL, 0.5));
            wall.setPosition(cc.p(LO_GRID*(xx-4), -LO_GRID*(yy+1)));
        }

        theLayer.blocks.addChild(wall, 15, 100+j);
    }
}

function updateBlock(pos)
{
    var block = theDungeon.Blocks[pos];
    var spritecache = cc.SpriteFrameCache.getInstance();

    {//mark enter and exit
        if( block.type == BLOCK_EXIT )
        {
            var floor = theLayer.blocks.getChildByTag(200+pos);
            theLayer.door = cc.BuilderReader.load("effect-door.ccbi");
            theLayer.door.setPosition(cc.pAdd(cc.p(LO_GRID/2, -LO_GRID/2), floor.getPosition()));
            theLayer.ground.addChild(theLayer.door);
            theLayer.door.animationManager.runAnimationsForSequenceNamed("open-unlocked");
        }
        else if( block.type == BLOCK_LOCKEDEXIT )
        {
            if( theDungeon.KeyFound )
            {
                var floor = theLayer.blocks.getChildByTag(200+pos);
                theLayer.door = cc.BuilderReader.load("effect-door.ccbi");
                theLayer.door.setPosition(cc.pAdd(cc.p(LO_GRID/2, -LO_GRID/2), floor.getPosition()));
                theLayer.ground.addChild(theLayer.door);
                theLayer.door.animationManager.runAnimationsForSequenceNamed("open-locked");
            }
            else
            {
                var floor = theLayer.blocks.getChildByTag(200+pos);
                theLayer.door = cc.BuilderReader.load("effect-door.ccbi");
                theLayer.door.setPosition(cc.pAdd(cc.p(LO_GRID/2, -LO_GRID/2), floor.getPosition()));
                theLayer.ground.addChild(theLayer.door);
                theLayer.door.animationManager.runAnimationsForSequenceNamed("closed-locked");
            }

        }
    }

    {//show wall
        var x = Math.floor(pos%DG_LEVELWIDTH);
        var y = Math.floor(pos/DG_LEVELWIDTH);
        var wallbase = y*9;
        for(var i=0; i<4; ++i)
        {
            if( block.pass[i])
            {
                var wall = 100 + wallbase;
                var nx = x;
                var ny = y;
                switch (i) {
                    case 0:
                    {
                        ny--;
                        wall += 4 + x - 9;
                    }
                        break;
                    case 1:
                    {
                        nx++;
                        wall += x;
                    }
                        break;
                    case 2:
                    {
                        ny++;
                        wall += 4 + x;
                    }
                        break;
                    case 3:
                    {
                        nx--;
                        wall += x - 1;
                    }
                        break;
                }
                var spwall = theLayer.blocks.getChildByTag(wall);
                if( spwall != null ){
                    spwall.setVisible(false);
                }
            }
        }
    }

    var box = theLayer.blocks.getChildByTag(pos);
    box.setVisible(false);
}

function syncAccess()
{
    for(var i=0; i<DG_BLOCKCOUNT; ++i)
    {
        var pos = i;
        var flag = theDungeon.Blocks[pos].access;

        var mask = theLayer.blocks.getChildByTag(300+pos);
        if( flag )
        {
            if( mask.numberOfRunningActions() == 0
                && mask.getOpacity() > 0 )
            {
                mask.runAction(cc.FadeOut.create(0.6));
            }
        }
        else
        {
            if( mask.numberOfRunningActions() == 0
                && mask.getOpacity() < 255 )
            {
                mask.runAction(cc.FadeIn.create(0.6));
            }

        }
    }
}

function addActor(unit, boss)
{
    //debug("ADD ACTOR = \n"+JSON.stringify(unit));
    var actor = null;
    var z = theLayer.baseZOrder(unit.pos);
    if( boss ){
        z += 100;
    }
    if( isHero(unit.ref) )
    {//for heroes
        var index = unit.ref-HERO_TAG;
        unit.order = index;//init hero order
        //debug("ADD ROLE = \n"+JSON.stringify(engine.user.dungeon.party[index]));//debug
        actor = new avatar.Avatar(engine.user.dungeon.party[index]);
        z += DG_PARTYCOUNT - unit.order;
    }
    else
    {
        var ro = new role.Role();
        ro.ClassId = unit.uuid;
        if( unit.role != null ){
            ro.parse(unit.role);
        }
        ro.fix();
        actor = new avatar.Avatar(ro);
    }
    actor.setTag(unit.ref);
    actor.setPositionGrid(unit.pos);
    actor.setZOrder(z);
    actor.setHealth(unit.health, unit.hs);
    actor.setAttack(unit.attack, unit.ds);

    theLayer.actors.addChild(actor.getNode());
    actor.playAnimation("stand", true);
    theLayer.avatars[unit.ref] = actor;

    //sync colors
    if( unit.rs == 1 )
    {
        actor.setBlinkColor(COLOR_DEBUFF);
    }

    return actor;
}

function removeActor(ref)
{
    debug("REMOVE ACTOR = "+ref);
    var avatar = theLayer.getActor(ref);
    if( avatar != null ){
        if( avatar.BOSSHP != null ){
            theLayer.hideBossHp();
        }
        theLayer.actors.removeChildByTag(ref);
        delete theLayer.avatars[ref];
    }
}

function removeAllActors()
{
    for(var k in theLayer.avatars){
        theLayer.removeActor(k);
    }
}

function getActor(ref)
{
    if( theLayer.avatars[ref] != null )
    {
        return theLayer.avatars[ref];
    }
    else
    {
        error("getActor: No such Actor ("+ref+")");
        return null;
    }
}

function addEffect(param){
    var effectData = table.queryTable(TABLE_EFFECT, param.effectId);
    if( effectData == null ){
        error("addEffect: No such effect data("+param.effectId+")");
        return;
    }
    if( param.target != null ){//add to role
        var actor = theLayer.getActor(param.target);
        if( actor != null ){
            param.node = actor.addEffect(param);
        }
        else{
            error("addEffect: Actor not found.");
        }
    }
    else{//add to pos
        if( param.grid != null ){
            pos = calcPosInGrid(param.grid);
            var parent = theLayer.effects;
            var mode = effect.EFFECTMODE_AUTO;
            if( param.serverId != null ){
                mode = effect.EFFECTMODE_LOOP;
            }
            if( effectData.onGround === true ){
                parent = theLayer.ground;
            }
            param.node = effect.attachEffect(parent, pos, param.effectId, mode);
        }
        else{
            error("addEffect: Grid not found.");
        }
    }
    //include to management
    if( param.serverId != null ){
        if( theLayer.EffectList[param.serverId] != null ){
            removeEffect(param.serverId);
        }
        theLayer.EffectList[param.serverId] = param;
    }

    return param.node;
}

function removeEffect(sid){
    if( theLayer.EffectList[sid] != null ){
        var data = theLayer.EffectList[sid];
        if( data.target != null ){//remove from role
            var actor = theLayer.getActor(data.target);
            if( actor != null ){
                actor.removeEffect(sid);
                delete theLayer.EffectList[sid];
            }
            else{
                error("removeEffect: Actor not found.");
            }
        }
        else{//remove from pos
            data.node.removeFromParent();
            delete theLayer.EffectList[sid];
        }
    }
}

function setTeamFace(face)
{
    for(var k in theDungeon.Heroes)
    {
        var hero = theDungeon.Heroes[k];
        var actor = theLayer.getActor(hero.ref);
        actor.setFlipX(face);
    }
}

function baseZOrder(pos)
{
    var y = Math.floor(pos/DG_LEVELWIDTH);
    return y*10;
}

function approachGrid(pos)
{
    var from = theDungeon.getHero(0).pos;
    var path = theDungeon.route(from, pos);
    if( path != null )
    {
        //fix: precalc final dest
        {
            var dst = [];
            for(var k in path)
            {
                dst.push(path[k]);
            }
            dst.reverse();
            dst.splice(dst.length-1, 1);//remove last element
            for(var k=0; k<theDungeon.HeroCount; ++k)
            {
                var ero = theDungeon.getHero(k);
                dst.push(ero.pos);
                ero.rpos = dst[k];
            }
        }

        if( path.length > 1 )
        {
            var arg = {};
            arg.path = path;
            arg.target = pos;
            theLayer.actions.pushAction(actions.make(0, 0, arg));
        }
        else
        {//set face
            var hero = theDungeon.getHero(0);
            var actor = theLayer.getActor(hero.ref);
            var face = actor.getFlipX();
            var targetx = Math.floor(pos%DG_LEVELWIDTH);
            var currentx = Math.floor(hero.pos%DG_LEVELWIDTH);
            if( targetx < currentx )
            {
                face = false;
            }
            else if(targetx > currentx )
            {
                face = true;
            }
            theLayer.setTeamFace(face);
        }
        return true;
    }
    error("FAILED TO APPROACH GRID ("+pos+")");//debug
    return false;
}

function moveGrid(pos)
{
    var from = theDungeon.getHero(0).pos;
    var path = theDungeon.route2(from, pos);
    if( path != null )
    {
        //fix: precalc final dest
        {
            var dst = [];
            for(var k in path)
            {
                dst.push(path[k]);
            }
            dst.reverse();
            dst.splice(dst.length-1, 1);//remove last element
            for(var k=0; k<theDungeon.HeroCount; ++k)
            {
                var ero = theDungeon.getHero(k);
                dst.push(ero.pos);
                ero.rpos = dst[k];
            }
        }

        var arg = {};
        arg.path = path;
        theLayer.actions.pushAction(actions.make(0, 4, arg));
        return true;
    }
    error("FAILED TO MOVE GRID ("+pos+")");//debug
    return false;
}

function makeCard(card)
{
    debug("CARD="+JSON.stringify(card));
    var cardClass = table.queryTable(TABLE_CARD, card.Type);
    if( cardClass != null )
    {
        var node = cc.Sprite.createWithSpriteFrameName("cardbg2.png");
        var size = node.getContentSize();
        node.face = cc.Sprite.createWithSpriteFrameName(cardClass.image);
        node.face.setPosition(cc.p(size.width/2, size.height/2));
        node.addChild(node.face);
        if( card.Count > 1 )
        {
            node.dot = cc.Sprite.create("cardnummask.png");
            node.dot.setAnchorPoint(cc.p(1, 0));
            node.dot.setPosition(cc.p(node.getContentSize().width, 0));
            node.num = cc.Sprite.createWithSpriteFrameName(card.Count+".png");
            size = node.dot.getContentSize();
            node.num.setPosition(cc.p(size.width/2, size.height/2));
            node.dot.addChild(node.num);
            node.addChild(node.dot);
        }
        return node;
    }
    error("makeCard: No such card type ("+card.Type+")");
    return null;
}

function selectCard(pos)
{
    var disx = pos.x - theLayer.card.rect.x;
    var ret = Math.floor(disx/CARD_SPACE);
    if( ret < 0 )
    {
        ret = 0;
    }
    if( ret > 5 )
    {
        ret = 5;
    }
    if( theLayer.card.nodeList.getChildByTag(ret) == null )
    {
        ret = -1;
    }
    return ret;
}

function updateCardDesc()
{
    if( theLayer.card.select >= 0 )
    {//show
        if( theLayer.card.layerMask.isVisible() )
        {//replace
            //fade the old one
            var scale1 = cc.ScaleTo.create(0.05, 0.9);
            var scale2 = cc.ScaleTo.create(0.05, 1.2);
            var scales = cc.Sequence.create(scale1, scale2);

            var fade = cc.FadeOut.create(0.2);
            var del = cc.CallFunc.create(function(){
                this.removeFromParent();
            }, theLayer.card.desc);
            var act = cc.Sequence.create(fade, del);

            theLayer.card.desc.runAction(scales);
            theLayer.card.desc.runAction(act);
        }
        else
        {//new
            theLayer.card.layerMask.setVisible(true);
        }

        var screen = cc.Director.getInstance().getWinSize();
        var start = theLayer.owner.nodeCard.getPosition();
        start.x += theLayer.card.select*CARD_SPACE;

        //create desc node
        var sfc = cc.SpriteFrameCache.getInstance();
        theLayer.card.descowner = {};
        theLayer.card.desc = cc.BuilderReader.load("ui-skill.ccbi", theLayer.card.descowner);

        if( theLayer.card.select > 0 ){
            //card
            var chCard = table.queryTable(TABLE_CARD, theDungeon.Cards[theLayer.card.select-1].Type);
            theLayer.card.descowner.spriteIcon.setDisplayFrame(sfc.getSpriteFrame(chCard.image));
            theLayer.card.descowner.labelName.setString(chCard.name);
            theLayer.card.descowner.labelDesc.setString(chCard.desc);
        }
        else{
            //skill
            var theSkill = engine.user.dungeon.party[0].querySkill(0);
            var SkClass = table.queryTable(TABLE_SKILL, theSkill.ClassId);
            var sp = cc.Sprite.create(SkClass.icon);
            theLayer.card.descowner.spriteIcon.setVisible(false);
            sp.setPosition(theLayer.card.descowner.spriteIcon.getPosition());
            sp.setScale(UI_SKILL_SCALE);
            theLayer.card.desc.addChild(sp);
            theLayer.card.descowner.labelName.setString(SkClass.label);
            theLayer.card.descowner.labelDesc.setString(SkClass.desc);
        }


        theLayer.card.desc.setPosition(start);
        //theLayer.card.desc.setOpacity(0);// TODO: not enabled for a node
        theLayer.card.desc.setScale(0);

        theLayer.card.nodeDesc.addChild(theLayer.card.desc);

        //set actions
        var scale1 = cc.ScaleTo.create(0.2, 1.2);
        var scale2 = cc.ScaleTo.create(0.1, 0.9);
        var scale3 = cc.ScaleTo.create(0.1, 1);
        //var scale4 = cc.ScaleTo.create(0.2, 1);
        var scales = cc.Sequence.create(scale1, scale2, scale3);

        var pos = cc.p(screen.width/2, screen.height/2+100);
        var move1 = cc.MoveTo.create(0.2, cc.p(pos.x, pos.y+10));
        var move2 = cc.MoveTo.create(0.2, pos);
        var moves = cc.Sequence.create(move1, move2);

        //var fade = cc.FadeIn.create(0.3);// TODO: not enabled for a node

        theLayer.card.desc.runAction(scales);
        theLayer.card.desc.runAction(moves);
        //theLayer.card.desc.runAction(fade);// TODO: not enabled for a node
    }
    else
    {//hide
        theLayer.card.layerMask.setVisible(false);
        theLayer.card.nodeDesc.removeAllChildren();
    }
}

function synCard(index)
{
    debug("synCard("+index+")");
    var card = theDungeon.Cards[index];
    var node = theLayer.card.nodeList.getChildByTag(index+1);
    if( node != null )
    {
        theLayer.card.nodeList.removeChild(node);
    }
    if( card != null )
    {
        node = theLayer.makeCard(card);
        node.setTag(index+1);
        node.setPosition(cc.p((index+1)*CARD_SPACE, 0));
        theLayer.card.nodeList.addChild(node);
        //add animation
        node.setScale(0);
        var sc1 = cc.ScaleTo.create(0.1, 1.5);
        var sc2 = cc.ScaleTo.create(0.3, 0.8);
        var sc3 = cc.ScaleTo.create(0.2, 1);
        var seq = cc.Sequence.create(sc1, sc2, sc3);
        node.runAction(seq);
    }
}

function fadeCardPop()
{
    if( theLayer.card.pop != null )
    {
        debug("fadeCardPop");
        var xpos = cc.p(theLayer.card.select*CARD_SPACE, 0);
        var move = cc.MoveTo.create(0.2, xpos);
        var cscale = cc.ScaleTo.create(0.2, 1);
        var call = cc.CallFunc.create(function(){
            debug("* FADE CARD TRIGGERED");
            var tag = this.getTag();
            if( tag > 0 )
            {//for card, update count
                theLayer.setCardCount(tag, theDungeon.Cards[tag-1].Count);
            }
            var node = theLayer.card.nodeList.getChildByTag(tag);
            node.setColor(cc.c3b(255, 255, 255));
            this.removeFromParent();
        }, theLayer.card.pop);
        var seq = cc.Sequence.create(move, call);
        theLayer.card.pop.runAction(cscale);
        theLayer.card.pop.runAction(seq);
        theLayer.card.pop = null;
    }
}

function fadeCardUse()
{
    if( theLayer.card.pop != null )
    {
        //fade pop use
        var scale = cc.ScaleTo.create(0.2, 1.2);
        var fade = cc.FadeOut.create(0.2);
        var call = cc.CallFunc.create(function(){
            this.removeFromParent();
        }, theLayer.card.pop);
        var seq = cc.Sequence.create(fade, call);
        theLayer.card.pop.runAction(scale);
        theLayer.card.pop.runAction(seq);

        var node = theLayer.card.nodeList.getChildByTag(theLayer.card.select);
        if( node != null )
        {
            node.setColor(cc.c3b(255, 255, 255));
        }

        effect.attachEffectCCBI(theLayer.card.nodePop,
            theLayer.card.pop.getPosition(),
            "effect-cardskill.ccbi");

        theLayer.card.pop = null;
    }
}

function setCardCount(index, count)
{
    debug("setCardCount("+index+", "+count+")");
    var node = theLayer.card.nodeList.getChildByTag(index);
    if( node != null )
    {
        if( count > 1 )
        {//gain
            if( node.dot == null )
            {
                node.dot = cc.Sprite.create("cardnummask.png");
                node.dot.setAnchorPoint(cc.p(1, 0));
                node.dot.setPosition(cc.p(node.getContentSize().width, 0));
                node.addChild(node.dot);
            }
            else
            {
                node.dot.removeAllChildren();
            }
            node.num = cc.Sprite.createWithSpriteFrameName(count+".png");
            node.num.setPosition(cc.p(node.dot.getContentSize().width/2, node.dot.getContentSize().height/2));
            node.dot.addChild(node.num);

            var scale1 = cc.ScaleTo.create(0.1, 1.2);
            var scale2 = cc.ScaleTo.create(0.1, 0.9);
            var scale3 = cc.ScaleTo.create(0.1, 1);
            var scales = cc.Sequence.create(scale1, scale2, scale3);
            node.dot.stopAllActions();
            node.dot.runAction(scales);

            node.setVisible(true);
        }
        else if( count == 1 )
        {//loss
            if( node.dot != null )
            {
                node.dot.removeFromParent();
                delete node.dot;
            }

            node.setVisible(true);
        }
        else
        {//hide card
            node.setVisible(false);
        }
    }
}

function setCardCd(index, cd)
{
    var node = theLayer.card.nodeList.getChildByTag(index);
    if( node.cd != null )
    {
        node.removeChild(node.cd, true);
        delete node.cd;
    }
    if( cd == 0 ){
        node.face.setColor(cc.c3b(255, 255, 255));
        if( theSkillCdEffect != null ){
            theSkillCdEffect.setVisible(true);
        }
    }
    else if( cd > 0 ){
        var size = node.getContentSize();
        node.face.setColor(cc.c3b(128, 128, 128));
        node.cd = cc.LabelTTF.create(cd, UI_FONT, UI_SIZE_XL);
        node.cd.setAnchorPoint(cc.p(0.5, 0.5));
        node.cd.setPosition(cc.p(size.width/2, size.height/2));
        node.addChild(node.cd);

        if( theSkillCdEffect != null ){
            theSkillCdEffect.setVisible(false);
        }
    }
    else{
        node.face.setColor(cc.c3b(128, 128, 128));
    }
}

function onTouchBegan(touch, event)
{
    if( !theLayer.canControl ){
        return false;//block illegal control
    }

    theLayer.touchBegin = touch.getLocation();
    if( cc.rectContainsPoint(theLayer.card.rect, theLayer.touchBegin) )
    {//trigger card
        var slot = theLayer.selectCard(theLayer.touchBegin);
        if( slot >= 0 )
        {
            theLayer.card.y = theLayer.touchBegin.y;

            var event = {};
            event.NTF = Message_OnCardSelect;
            event.arg = {};
            event.arg.slot = slot;
            engine.event.processNotification(event);
        }
        theLayer.touchMode = TOUCH_CARD;
    }
    else
    {
        theLayer.touchMode = TOUCH_GRID;
    }

    return true;
}

function onTouchMoved(touch, event)
{
    if( theLayer.touchMode == TOUCH_CARD )
    {
        var pos = touch.getLocation();
        if( cc.rectContainsPoint(theLayer.card.rect, pos) )
        {
            var newselect = theLayer.selectCard(pos);
            if( newselect != theLayer.card.select )
            {
                if( theLayer.card.select >= 0 )
                {//need fade
                    theLayer.fadeCardPop();
                }

                if( newselect >= 0 )
                {//need select
                    theLayer.card.y = pos.y;

                    var event = {};
                    event.NTF = Message_OnCardSelect;
                    event.arg = {};
                    event.arg.slot = newselect;
                    engine.event.processNotification(event);
                }
                else
                {
                    theLayer.card.select = -1;
                    if( theLayer.card.showDesc )
                    {
                        theLayer.updateCardDesc();
                    }
                }
            }
        }
        else
        {
            theLayer.card.hover = false;
            theLayer.card.timer = 0;
        }
        if( theLayer.card.select >= 0 )
        {
            var disy = pos.y - theLayer.card.y;
            if( disy < 0 )
            {
                disy = 0;
            }
            if( disy > CARD_SPACE*2 )
            {
                disy = CARD_SPACE*2;
            }
            var npos = cc.p(theLayer.card.select*CARD_SPACE, 0);
            npos.y += disy;
            theLayer.card.pop.setPosition(npos);
        }
    }
}

function onTouchEnded(touch, event)
{
    var pos = touch.getLocation();

    if( theLayer.touchMode == TOUCH_GRID )
    {
        if( theLayer.canControl )
        {
            var dis = cc.pDistance(theLayer.touchBegin, pos);
            if( Math.abs(dis) < CLICK_RANGE )
            {
                pos = theLayer.touchBegin;//使用之前的触点做判断
                var rp = cc.pSub( pos, theLayer.owner.nodeBlock.getPosition() );
                rp.y *= -1;
                var gx = Math.floor(rp.x / LO_GRID);
                var gy = Math.floor(rp.y / LO_GRID);
                if( gx < 0 || gx >= DG_LEVELWIDTH || gy < 0 || gy >= DG_LEVELHEIGHT )
                {
                    return;
                }
                var g = gx + gy*DG_LEVELWIDTH;

                var event = {};
                event.NTF = Message_TouchGrid;
                event.arg = {};
                event.arg.pos = g;
                engine.event.processNotification(event);
            }
        }
    }
    else if( theLayer.touchMode == TOUCH_CARD )
    {
        if( theLayer.card.select >= 0 )
        {
            if( !cc.rectContainsPoint(theLayer.card.rect, pos)
                && pos.y >= theLayer.card.rect.y + theLayer.card.rect.height)
            {
                var event = {};
                event.NTF = Message_OnCardUse;
                engine.event.processNotification(event);
            }
            else
            {
                //fade pop
                theLayer.fadeCardPop();

                var event = {};
                event.NTF = Message_OnCardDismiss;
                engine.event.processNotification(event);
            }

            theLayer.card.hover = false;
            theLayer.card.timer = 0;
            theLayer.card.showDesc = false;
        }
    }
}

function onTouchCancelled(touch, event)
{
    theLayer.onTouchEnded(touch, event);
}

function setLevel(level)
{
    theLayer.leveldisplay.setString(level.toString());
}

function showBossHP(max)
{
    if( this.BOSSHP != null ){
        this.removeChild(this.BOSSHP);
        this.BOSSHP = null;
    }
    this.BOSSHP = libGadgets.BossHP.create(max);
    var winSize = cc.Director.getInstance().getWinSize();
    this.BOSSHP.setPosition(cc.p(winSize.width/2, winSize.height));
    this.addChild(this.BOSSHP);
    return this.BOSSHP;
}

function hideBossHP()
{
    if( this.BOSSHP != null ){
        this.BOSSHP.NODE.animationManager.runAnimationsForSequenceNamed("close");
        this.BOSSHP = null;//hide it, will cause lose of reference. but wont appear to much
    }
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

exports.scene = scene;