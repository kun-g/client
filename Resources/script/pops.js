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
    var sfc = cc.SpriteFrameCache.getInstance();
    cacheSprite("levelup-skill.png");
    cacheSprite("levelup-sj.png");
    var layer = engine.ui.newLayer();
    var mask = blackMask();
    layer.addChild(mask);

    layer.owner = {};
    configParticle(layer.owner);
    layer.node = loadModule("UIComposer.js").loadUI(layer, "ui-levelup.ccbi", {
        sk1: {
            id: "skill1",
            ui: "UISkill"
        },
        sk2: {
            id: "skill2",
            ui: "UISkill"
        },
        sk3: {
            id: "skill3",
            ui: "UISkill"
        },
        sk4: {
            id: "skill4",
            ui: "UISkill"
        },
        nodeRole: {
            id: "avatar",
            ui: "UIAvatar",
            scale: 1.2
        }
    });

    layer.node.animationManager.runAnimationsForSequenceNamed("effect");
    var winSize = cc.Director.getInstance().getWinSize();
    layer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    layer.addChild(layer.node);
    //set all invisible
    var nodeName = ["nodeMj","nodeJsj","nodeJjs","nodeSj","labLev"];
    for (var k in nodeName){
        for (var i = 1;i <= 4;i++){
            debug(nodeName[k]+i+" set invisible");
            layer.owner[nodeName[k]+i].setVisible(false);
        }
    }
    //set level
    var level = engine.user.actor.calcExp().level;
    layer.owner.labLevel.setString("LV."+level);
    //set skill
    var role = engine.user.actor;
    layer.ui.skill1.setSkill(getSkillLev(0));
    layer.ui.skill2.setSkill(getSkillLev(1));
    layer.ui.skill3.setSkill(getSkillLev(2));
    layer.ui.skill4.setSkill(getSkillLev(3));
    //set role
    layer.ui.avatar.setRole(role);
    //set property
    var roleData = libTable.queryTable(TABLE_ROLE, engine.user.actor.ClassId);
    var levelData = libTable.queryTable(TABLE_LEVEL, roleData.levelId);
    var property = levelData.levelData[level-1].property;
    var proTableList = ["health","attack","speed","critical","strong","accuracy","reactivity"];
    var proRoleList = ["Health","Attack","Speed","Critical","Strong","Accuracy","Reactivity"];
    var proLabList = ["labHealth","labAttack","labSpeed","labCritical","labStrong","labAccuracy","labReactivity"];
    for (var k in proLabList){
        var originPro = +role[proRoleList[k]] - property[proTableList[k]];
        debug(originPro + "+" + property[proTableList[k]]);
        if (property[proTableList[k]] > 0){
            layer.owner[proLabList[k]].setString(originPro + "+" + property[proTableList[k]]);
        }
        else{
            layer.owner[proLabList[k]].setString(originPro);
        }

    }
    //set skill state
    var skill = levelData.levelData[level-1].skill[0];
    var newSkill = false;
    if( skill.level == 1 ){
        newSkill = true;
    }
    for (var j = 1;j <= 4;j++){
        if (role.querySkill(j - 1) == null){//jjs
            layer.owner[nodeName[4]+j].setVisible(true);
            layer.owner[nodeName[4]+j].setString(getNewSkillLev(level,j - 1));
            layer.owner[nodeName[2]+j].setVisible(true);
        }
        else if (skill.id == role.querySkill(j - 1).ClassId){
            if (newSkill){//get new skill
                layer.owner[nodeName[3]+j].setDisplayFrame(sfc.getSpriteFrame("levelup-skill.png"));
            }
            else{//sj
                layer.owner[nodeName[3]+j].setDisplayFrame(sfc.getSpriteFrame("levelup-sj.png"));
            }
            layer.owner[nodeName[3]+j].setVisible(true);
        }
        else if (role.querySkill(j - 1).Level >= getMaxSkillLev(role.querySkill(j - 1).ClassId)){//mj
            layer.owner[nodeName[0]+j].setVisible(true);
        }
        else{//jsj
            layer.owner[nodeName[4]+j].setVisible(true);
            layer.owner[nodeName[4]+j].setString(getNextSkillLev(level,role.querySkill(j - 1).ClassId));
            layer.owner[nodeName[1]+j].setVisible(true);
        }
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

function getSkillLev(slotId){
    var ret = {};
    if (engine.user.actor.querySkill(slotId) == null){
        var roleSkill = [];
        var roleData = libTable.queryTable(TABLE_ROLE, engine.user.actor.ClassId);
        var levelData = libTable.queryTable(TABLE_LEVEL, roleData.levelId);
        for (var k in levelData.levelData){
            if (levelData.levelData[k].skill[0].level == 1){
                roleSkill.push(levelData.levelData[k].skill[0].id);
            }
        }
        ret.ClassId = roleSkill[slotId];
        ret.Level = 1;
    }
    else{
        ret = engine.user.actor.querySkill(slotId);
    }

    return ret;
}

function getNewSkillLev(level,slotId){
    var ret = 0;
    var roleSkill = [];
    var roleData = libTable.queryTable(TABLE_ROLE, engine.user.actor.ClassId);
    var levelData = libTable.queryTable(TABLE_LEVEL, roleData.levelId);
    for (var k in levelData.levelData){
        if (levelData.levelData[k].skill[0].level == 1){
            roleSkill.push(levelData.levelData[k].skill[0].id);
        }
    }
    ret = getNextSkillLev(level,roleSkill[slotId]);
    return ret;
}

function getNextSkillLev(level,skillCld){
    var ret = 0;
    var roleData = libTable.queryTable(TABLE_ROLE, engine.user.actor.ClassId);
    var levelData = libTable.queryTable(TABLE_LEVEL, roleData.levelId);
    for (var k = level;k < levelData.levelData.length;k++){
        if (levelData.levelData[k].skill[0].id == skillCld){
            ret = k + 1;
            break;
        }
    }
    return ret;
}

function getMaxSkillLev(skillCld){
    var ret = 0;
    var roleData = libTable.queryTable(TABLE_ROLE, engine.user.actor.ClassId);
    var levelData = libTable.queryTable(TABLE_LEVEL, roleData.levelId);
    for (var k = levelData.levelData.length - 1;k >= 0;k--){
        if (levelData.levelData[k].skill[0].id == skillCld){
            ret = levelData.levelData[k].skill[0].level;
            break;
        }
    }
    return ret;
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

    var winSize = cc.Director.getInstance().getWinSize();

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

    var winSize = cc.Director.getInstance().getWinSize();
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