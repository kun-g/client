/**
 * Created by tringame on 14-6-6.
 */
var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");

var theLayer;
var payStr = [
    {str:"25元", cost:25, dm:2500 }
];

function purchaseMonthCard(){
    this.owner.btnBack.setVisible(true);
    this.owner.btnBack1.setVisible(false);
    this.owner.btnPurchase.setVisible(true);
}

function hasMonthCard(){
    this.owner.btnBack.setVisible(false);
    this.owner.btnBack1.setVisible(false);
    this.owner.btnPurchase.setVisible(false);
    this.owner.labLv.setString(engine.session.monthCardDay);
}

function onBack(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theLayer.node.runAction(actionPopOut(function(){
        engine.ui.popLayer();
    }, theLayer));
}

function onPurchase(sender){
//    //向服务器发送购买月卡的消息
    var actorName = engine.user.actor.Name;
    var zoneId = engine.session.zoneId;
    var billNo = genBillNo(9);
    iap.makePayment(billNo, 9, 1, actorName, zoneId);
    tdga.paymentRequest(billNo, payStr[0].str, payStr[0].cost, "CNY", payStr[0].dm, iap.getStoreName() );

    //保持连接
    engine.event.sendNTFEvent(103, {sign:-1});
}

function fixNumber(num, len){
    var str = ""+num;
    if( str.length > len ){
        str = str.substr(0, len);
    }
    while(str.length < len){
        str = "0" + str;
    }
    return str;
}

function genBillNo(pid){
    var actorName = fixNumber(engine.user.player.AID, 8);
    var productId = fixNumber(pid, 2);
    var zoneId = fixNumber(engine.session.zoneId, 2);
    var time = fixNumber(Math.floor(engine.game.getServerTime()/1000), 10);
    return actorName+productId+zoneId+time+engine.game.getConfig().binary_channel;
}

function onEnter(){
    theLayer = this;

    var mask = blackMask();
    this.addChild(mask);

    this.owner = {};
    this.owner.onBack = onBack;
    this.owner.onPurchase = onPurchase;
//    this.update = update;
//    this.scheduleUpdate();

    this.node = libUIC.loadUI(this, "ui-yk.ccbi", {
//        layerList: {
//            ui: "UIScrollView",
//            id: "scrollList",
//            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
//        },
//        layerDesc: {
//            ui: "UIScrollView",
//            id: "scrollDesc",
//            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
//        },
//        layerDesc2: {
//            ui: "UIScrollView",
//            id: "scrollDesc2",
//            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
//        }
    });
    this.addChild(this.node);

    this.owner.btnBack.setVisible(false);
    this.owner.btnBack1.setVisible(false);
    this.owner.btnPurchase.setVisible(false);

    if (engine.session.monthCardDay > 0){
        purchaseMonthCard();
    }
    else{
        hasMonthCard();
    }

    this.node.runAction(actionPopIn());

    engine.ui.regMenu(this.owner.menuRoot);
}

function show(){
    engine.ui.newLayer({
        onNotify: onNotify,
        onEnter: onEnter,
        onActivate: onActivate
    });
}

exports.show = show;