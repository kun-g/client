/**
 * Created by jovidu on 14-6-17.
 */

var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libItem = loadModule("xitem.js");
var libUIKit = loadModule("uiKit.js");
var libRole = loadModule("role.js");

var theLayer = null;
var isFlying = false;
var TouchId = -1;

var theMode;
var MODE_EXIT = 0;
var MODE_PVP = 1;

var DAILY_TIMES_NEED = 5;
var DAILY_SETTLE_TIME_MIN = 1200;  // 0~1439min, 1200 = 20:00
var PVP_STAGEID = 124;

var theRivalsList;
var myPkInfo;

function getPkRivals() {
    libUIKit.waitRPC(Request_GetPkInfo, {}, function(rsp) {
        if( rsp.RET == RET_OK ){
            theRivalsList = rsp.lst;
            loadPkRivals();
            engine.session.cacheRoleInfo(rsp.lst);
        }
        else{
            libUIKit.showErrorMessage(rsp);
        }
    }, theLayer)
}

function loadPkRivals() {
    if( theRivalsList != null ){
        for( var i=1; i<4; i++ ){
            if( theRivalsList[i] != null ){
                var role = new libRole.Role(theRivalsList[i]);
                role.fix();
                theLayer.ui["avatar"+i].setRole(role);
                theLayer.owner["labName"+i].setString(role.Name);
                theLayer.owner["labBonusCup"+i].setString(role.CupBonus);
                theLayer.owner["labBonusGold"+i].setString(role.GoldBonus);
            }
        }
    }
}

function loadMyInfo() {
    if( myPkInfo != null ){
        theLayer.owner.labMyCup.setString(myPkInfo.cup);
        theLayer.owner.labMyRank.setString(myPkInfo.rnk);
        theLayer.owner.labTimes.setString(myPkInfo.cpl+"/"+myPkInfo.ttl);
        setBottomContent();
    }
}

function setBottomContent() {
    if( myPkInfo.bnp > 0 ){
        theLayer.owner.nodeBotCnt1.setVisible(false);
        theLayer.owner.nodeBotCnt2.setVisible(false);
        theLayer.owner.nodeBotCnt3.setVisible(true);
    }else{
        if( myPkInfo.cpl >= DAILY_TIMES_NEED ){
            theLayer.owner.nodeBotCnt1.setVisible(false);
            theLayer.owner.nodeBotCnt2.setVisible(true);
            theLayer.owner.nodeBotCnt3.setVisible(false);
            var leftMinutes = calcLeftTimeMin(DAILY_SETTLE_TIME_MIN);
            theLayer.owner.labLeftTime.setString(Math.floor(leftMinutes/60)+":"+leftMinutes%60);
        }else{
            theLayer.owner.nodeBotCnt1.setVisible(true);
            theLayer.owner.nodeBotCnt2.setVisible(false);
            theLayer.owner.nodeBotCnt3.setVisible(false);
            var timesNeed = DAILY_TIMES_NEED - myPkInfo.cpl;
            if( timesNeed < 0 ) timesNeed = 0;
            theLayer.owner.labTimesNeed.setString(timesNeed);
        }
    }
}

function calcLeftTimeMin(endTime) {
    var currentTimeStamp = engine.game.getServerTime();
    var curTime = new Date(parseInt(currentTimeStamp));
    var curTimeMin = curTime.getMinutes() + (curTime.getHours() * 60);
    return (endTime - curTimeMin);
}

function onRival(sender) {
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( sender.getTag() == TouchId ){
        TouchId = -1;
    }else{
        TouchId = sender.getTag();
    }
    for( var i=1; i<4; i++){
        theLayer.owner["btnStartPK"+i].setVisible(i == TouchId);
        theLayer.owner["nodeBonus"+i].setVisible(!(i == TouchId));
    }

}

function onRoleInfo(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libUIKit.showRoleInfo(theRivalsList[sender.getTag()-1].nam);
}

function onStartPK() {
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var alert = libUIKit.alert();
    alert.setContent("确定开始挑战对手吗？");
    alert.setButton([
        {
            label: "buttontext-qx.png",
            func: onClose,
            obj: alert
        },
        {
            label: "buttontext-confirm.png",
            func: function() {
                var libStage = loadModule("sceneStage.js");
                var stageDate = queryStage(PVP_STAGEID);
                libStage.startStage(PVP_STAGEID, stageDate.team, stageDate.cost);
            },
            obj: alert,
            type: BUTTONTYPE_DEFAULT
        }
    ]);
}

function onReceivePrize() {
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libUIKit.waitRPC(Request_ReceivePrize, {typ: ReceivePkPrize}, function (rsp) {
        if( rsp.RET == RET_OK ){
            libUIKit.showAlert("奖金领取成功！");
            if (rsp.RES != null) {
                engine.event.processResponses(rsp.RES);
            }
        }
        else{
            libUIKit.showErrorMessage(rsp);
        }
    }, theLayer);
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theMode = MODE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function onUIAnimationCompleted(name){
    isFlying = false;
    if( theMode == MODE_EXIT ){
        var main = loadModule("sceneMain.js");
        engine.ui.newScene(main.scene());
    }
    if( theMode == MODE_PVP ){
        getPkRivals();
    }
}

function onEnter() {
    TouchId = -1;
    theRivalsList = {};
    theLayer = this;
    this.owner = {};
    this.owner.onRival = onRival;
    this.owner.onStartPK = onStartPK;
    this.owner.onRoleInfo = onRoleInfo;
    this.owner.onReceivePrize = onReceivePrize;
    this.owner.onClose = onClose;
    var node = libUIC.loadUI(this, "scenePVP.ccbi", {
        nodeRole1:{
            ui: "UIAvatar",
            id: "avatar1"
        },
        nodeRole2:{
            ui: "UIAvatar",
            id: "avatar2"
        },
        nodeRole3:{
            ui: "UIAvatar",
            id: "avatar3"
        }
    });
    theLayer.node = node;
    this.addChild(node);
    theMode = MODE_PVP;
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");
    engine.ui.regMenu(this.owner.menuRoot);
    myPkInfo = engine.user.player.PkInfo;
    loadMyInfo();
    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);
}

function onExit() {
    loadModule("broadcastx.js").instance.close();
}

function onNotify(ntf){
//    switch(ntf.NTF){
//    }
    return false;
}

function scene(){
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onNotify
//        onActivate: onActivate
    };
}

exports.scene = scene;