/**
 * User: hammer
 * Date: 13-12-24
 * Time: 下午1:13
 */

var libTable = loadModule("table.js");
var libSkill = loadModule("skill.js");
var libUIC = loadModule("UIComposer.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");

//--------- POP MANAGER 防止弹窗一起弹出来 ----------
function PopMgr(){
    this.REG = {};
}

PopMgr.prototype.registerPop = function(key, func){
    this.REG[key] = {};
    this.REG[key].FLAG = false;
    this.REG[key].FUNC = func;
    this.UI = "";
}

PopMgr.prototype.resetAllFlags = function(){
    for(var k in this.REG){
        this.REG[k].FLAG = false;
    }
}

PopMgr.prototype.setFlag = function(key){
    this.REG[key].FLAG = true;
}

PopMgr.prototype.invokePop = function(ui){
    if( ui != null ) this.UI = ui;
    var uival = this.UI;
    var cb = cc.CallFunc.create(function(){
        for(var k in singleton.REG){
            if( singleton.REG[k].FLAG ){
                if( singleton.REG[k].FUNC(uival) ){
                    return;
                }
            }
        }
    }, engine.ui.curScene);
    engine.ui.curScene.runAction(cb);
}

PopMgr.prototype.setAllAndInvoke = function(ui){
    for(var k in this.REG){
        this.REG[k].FLAG = true;
    }
    this.invokePop(ui);
}

var singleton = new PopMgr();

exports.instance = singleton;
//-------------------------------------------------

var levelUpFlag = false;

function onClose(sender){
    this.node.stopAllActions();
    this.node.runAction(actionPopOut(function(){
        engine.ui.popLayer();
    }));
}

function onTouchBegan(touch, event){
    this.node.runAction(actionBounce());
    return true;
}

function onTouchMoved(touch, event){}

function onTouchEnded(touch, event){
    this.onClose();
}

function onTouchCancelled(touch, event){
    this.onTouchEnded(touch, event);
}

function popLevelUp(){
    var layer = engine.ui.newLayer();
    var mask = blackMask();
    layer.addChild(mask);

    layer.owner = {};
    configParticle(layer.owner);
    layer.node = cc.BuilderReader.load("ui-levelup.ccbi", layer.owner);

    layer.node.animationManager.runAnimationsForSequenceNamed("effect");
    var winSize = engine.game.viewSize;
    layer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    layer.addChild(layer.node);

    //set values
    var roleData = libTable.queryTable(TABLE_ROLE, engine.user.actor.ClassId);
    var level = engine.user.actor.calcExp().level;
    layer.owner.labLevel.setString("LV."+level);
    var spEmblem = cc.Sprite.create(roleData.emblem[0]);
    layer.owner.nodeEmblem.addChild(spEmblem);
    var levelData = libTable.queryTable(TABLE_LEVEL, roleData.levelId);
    var skill = levelData.levelData[level-1].skill[0];
    var uiSkill = libSkill.UISkill.create({
        ClassId: skill.id,
        Level: skill.level
    });
    layer.owner.nodeSkill.addChild(uiSkill);
    var skillData = libTable.queryTable(TABLE_SKILL, skill.id);
    if( skill.level == 1 ){
        layer.owner.labelDesc.setString("获得了新技能【"+skillData.label+"】");
    }
    else{
        layer.owner.labelDesc.setString("【"+skillData.label+"】等级提升到"+skill.level);
    }

    engine.ui.regMenu(layer);

    layer.onClose = onClose;
    layer.onTouchBegan = onTouchBegan;
    layer.onTouchMoved = onTouchMoved;
    layer.onTouchEnded = onTouchEnded;
    layer.onTouchCancelled = onTouchCancelled;
    layer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    layer.setTouchPriority(-1);

    layer.node.setScale(0);
    layer.node.runAction(actionPopIn(function(){
        layer.setTouchEnabled(true);
    }));
}

function invokePopLevelUp(){
    if( levelUpFlag ){
        popLevelUp();
        levelUpFlag = false;
        return true;
    }
    return false;
}

function setLevelUp(){
    levelUpFlag = true;
    //统计等级信息
    tdga.setLevel(engine.user.actor.calcExp().level);
}

exports.setLevelUpAnimation = setLevelUp;
exports.invokePopLevelUp = invokePopLevelUp;

//--------------------------------------------

var theAnnouncement;
var theAnnounceMode;

var ANNOUNCE_NORMAL = 0;
var ANNOUNCE_EXIT = 1;

function closeAnnouncement(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theAnnounceMode = ANNOUNCE_EXIT;
    theAnnouncement.node.animationManager.runAnimationsForSequenceNamed("close");
}

function onAnnounceAnimationCompleted(name){
    if( theAnnounceMode == ANNOUNCE_EXIT ){
        engine.ui.popLayer();
        engine.pop.invokePop();
    }
}

function popAnnouncement(){
    var strAnnounce = file.read("announce.txt");
    if( strAnnounce == null ) {
        engine.pop.invokePop();
        return;
    };

    var layer = engine.ui.newLayer();
    theAnnouncement = layer;
    var mask = blackMask();
    layer.addChild(mask);

    layer.owner = {};
    layer.owner.onClose = closeAnnouncement;

    layer.node = libUIC.loadUI(layer, "sceneNotice.ccbi", {
        layerList: {
            ui: "UIScrollView",
            id: "scrollDesc",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        }
    });
    layer.addChild(layer.node);
    theAnnounceMode = ANNOUNCE_NORMAL;
    layer.node.animationManager.setCompletedAnimationCallback(layer, onAnnounceAnimationCompleted);
    layer.node.animationManager.runAnimationsForSequenceNamed("open");

    var dimension = cc.size(layer.owner.layerList.getContentSize().width, 0);
    var text = DCTextArea.create();
    text.setDimension(dimension);
    text.pushMarkdown(strAnnounce);
    text.setPosition(cc.p(0, 0));
    layer.ui.scrollDesc.addChild(text);
    layer.ui.scrollDesc.setContentSize(text.getContentSize());

    var curroffset = layer.ui.scrollDesc.getContentOffset();
    curroffset.y = layer.ui.scrollDesc.minContainerOffset().y;
    layer.ui.scrollDesc.setContentOffset(curroffset);
}

var announcementFlag = false;
function setAnnouncement(){
    announcementFlag = true;
}

function invokeAnnouncement(){
    if( announcementFlag ){
        popAnnouncement();
        announcementFlag = false;
        return true;
    }
    else{
        return false;
    }
}

exports.setAnnouncement = setAnnouncement;
exports.invokeAnnouncement = invokeAnnouncement;

//--------------------------------------------------

function popInvalidDungeon(){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var layer = engine.ui.newLayer();
    var mask = blackMask();
    layer.addChild(mask);

    var winSize = engine.game.viewSize;

    layer.owner = {};
    layer.node = libUIC.loadUI(layer, "ui-tcfb.ccbi", {
        btnOk: {
            ui: "UIButtonL",
            id: "buttonOK",
            menu: "menuRoot",
            label: "buttontext-confirm.png",
            func: function(sender){
                layer.runAction(actionPopOut(function(){
                    engine.ui.removeLayer(layer);
                }));
            }
        }
    });
    layer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    layer.addChild(layer.node);

    layer.setScale(0);
    layer.runAction(actionPopIn());
}

exports.popInvalidDungeon = popInvalidDungeon;

//--------------------------------------------------
var theMonthLayer = null;

function popMonthCard(){
    theMonthLayer = engine.ui.newLayer();

    var filename = "ui-questdone2.ccbi";
    var submit = {
        ui: "UIButtonL",
        id: "btnSubmit",
        menu: "menuRoot",
        label: "buttontext-confirm.png",
        func: function(sender){
            engine.session.MonthCardAvaiable = false;
            cc.AudioEngine.getInstance().playEffect("card2.mp3");
            theMonthLayer.node.runAction(actionPopOut(function(){
                engine.ui.removeLayer(theMonthLayer);
                theMonthLayer = null;

                libUIKit.waitRPC(Request_SubmitBounty, {bid: -1}, function(rsp){
                    if( rsp.RET != RET_OK ){
                        libUIKit.showErrorMessage(rsp);
                    }
                });
            }));
        },
        type: BUTTONTYPE_DEFAULT
    };
    var pdata = [{
        type:2,
        count: 80
    }];

    var mask = blackMask();
    theMonthLayer.addChild(mask);
    theMonthLayer.owner = {};
    theMonthLayer.node = libUIC.loadUI(theMonthLayer, filename, {
        nodeSubmit:submit
    });

    var winSize = engine.game.viewSize;
    theMonthLayer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    theMonthLayer.addChild(theMonthLayer.node);
    engine.ui.regMenu(theMonthLayer.owner.menuRoot);

    //set panel data
    theMonthLayer.owner.labelTitle.setString("月卡奖励");
    var prize = libItem.ItemPreview.create(pdata);
    var size = prize.getContentSize();
    prize.setPosition(cc.p(-size.width/2, -size.height/2));
    theMonthLayer.owner.nodePrize.addChild(prize);

    theMonthLayer.node.setScale(0);
    theMonthLayer.node.runAction(actionPopIn());
}

function invokeMonthCardPop(){
    debug("invokeMonthCardPop");
    if( engine.session.MonthCardAvaiable && theMonthLayer == null ){
        popMonthCard();
        return true;
    }
    else{
        return false;
    }
}

exports.invokeMonthCardPop = invokeMonthCardPop;