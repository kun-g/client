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
var PVP_STAGEID = 124;

var theRivalsList;
var theRival;
var myPkInfo;
var PKINFO_UPDATE_PERIOD = 3; // unit: s

function getPkRivals() {
    libUIKit.waitRPC(Request_GetPkRivals, {}, function(rsp) {
        if( rsp.RET == RET_OK ){
            theRivalsList = rsp.arg;
            loadPkRivals();
            engine.session.cacheRoleInfo(rsp.arg);
        }
        else{
            libUIKit.showErrorMessage(rsp);
        }
    }, theLayer)
}

function loadPkRivals() {
    if( theRivalsList != null ){
        for( var i=1; i<4; i++ ){
            if( theRivalsList[i-1] != null ){
                var role = new libRole.Role(theRivalsList[i-1]);
                role.fix();
                theLayer.ui["avatar"+i].setRole(role);
                theLayer.owner["labName"+i].setString(role.Name);
                theLayer.owner["labPower"+i].setString(role.getPower());
                theLayer.owner["labRank"+i].setString(role.rnk);
            }
        }
    }
}

function loadMyInfo() {
//    engine.session.updatePVPInfo();
//    myPkInfo = engine.session.PkInfo;

    //test code
    myPkInfo = {
        rnk: 333,
        cpl: 2,
        ttl: 10,
        bng: 3000,
        rcv: false
    };

    if( myPkInfo != null ){
        theLayer.owner.labMyRank.setString(myPkInfo.rnk);
        theLayer.owner.labTimes.setString(myPkInfo.cpl+"/"+myPkInfo.ttl);
        setBottomContent();
    }
}

function setBottomContent() {
    if( myPkInfo.cpl >= DAILY_TIMES_NEED ){
        //can receive
        if(myPkInfo.rcv != null && myPkInfo.rcv){
            //received
            theLayer.owner.nodeBotCnt1.setVisible(false);
            theLayer.owner.nodeBotCnt2.setVisible(false);
            theLayer.owner.nodeBotCnt3.setVisible(true);
        }else{
            //not received
            theLayer.owner.nodeBotCnt1.setVisible(false);
            theLayer.owner.nodeBotCnt2.setVisible(true);
            theLayer.owner.nodeBotCnt3.setVisible(false);
            theLayer.owner.labBonusGold.setString(myPkInfo.bng);
        }
    }else{
        //cannot receive
        theLayer.owner.nodeBotCnt1.setVisible(true);
        theLayer.owner.nodeBotCnt2.setVisible(false);
        theLayer.owner.nodeBotCnt3.setVisible(false);
        var timesNeed = DAILY_TIMES_NEED - myPkInfo.cpl;
        if( timesNeed < 0 ) timesNeed = 0;
        theLayer.owner.labTimesNeed.setString(timesNeed);
    }
}

//function calcLeftTimeMin(endTime) {
//    var currentTimeStamp = engine.game.getServerTime();
//    var curTime = new Date(parseInt(currentTimeStamp));
//    var curTimeMin = curTime.getMinutes() + (curTime.getHours() * 60);
//    return (endTime - curTimeMin);
//}

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
        theLayer.owner["layerOnBtn"+i].setEnabled(!(i == TouchId));
    }

}

function onRoleInfo(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libUIKit.showRoleInfo(theRivalsList[sender.getTag()-1].nam);
}

function onStartPK() {
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var libStage = loadModule("sceneStage.js");
    var stageDate = queryStage(PVP_STAGEID);
    libStage.startStage(PVP_STAGEID, stageDate.team, stageDate.cost, theRivalsList[TouchId-1].nam);
//    var alert = libUIKit.alert();
//    alert.setContent("确定开始挑战对手吗？");
//    alert.setButton([
//        {
//            label: "buttontext-qx.png",
//            func: onClose,
//            obj: alert
//        },
//        {
//            label: "buttontext-confirm.png",
//            func: function() {
//                var libStage = loadModule("sceneStage.js");
//                var stageDate = queryStage(PVP_STAGEID);
//                libStage.startStage(PVP_STAGEID, stageDate.team, stageDate.cost, TouchId-1);
//            },
//            obj: alert,
//            type: BUTTONTYPE_DEFAULT
//        }
//    ]);
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

        //test code
//        return;

        getPkRivals();
    }
}

function onEnter() {
    TouchId = -1;
    theRivalsList = {};
    theLayer = this;
    myPkInfo = {};
    this.owner = {};
    this.owner.onRival = onRival;
    this.owner.onStartPK = onStartPK;
    this.owner.onRoleInfo = onRoleInfo;
    this.owner.onReceivePrize = onReceivePrize;
    this.owner.onClose = onClose;
    var node = libUIC.loadUI(this, "sceneJjc.ccbi", {
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
    loadMyInfo();
    this.schedule(loadMyInfo, PKINFO_UPDATE_PERIOD);
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