/**
 * Created by tringame on 14-5-6.
 */
var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");

var theLayer;
var animFlag = false;
var animItem = "";
var itemPart = EquipSlot_MainHand;
var itemarry = [];
var theRole;

var addExp = 100;
var EXP_SPEED = 75;

function onBack(){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    engine.ui.popLayer();
}

function onItem1(){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var itemequip = theLayer.ui["equip1"].getItem();

    var countk = 0;
    var inventoryData = engine.user.inventory.Items;
    debug("inventoryData = " + JSON.stringify(inventoryData));
    for(var k in inventoryData){
        var item = inventoryData[k];
        if( item.ClassId == 538 ){
            itemarry[countk] = item;
            countk++;
        }
    }
    seletMin();

    if (itemarry[0] != undefined &&
        itemarry[0] != null){
        libUIKit.waitRPC(Request_InventoryUseItem, {
            sid:itemarry[0].ServerId,
            opn:ITMOP_USE,
            opd:itemequip.ServerId
        }, function(rsp){
            if( rsp.RET == RET_OK ){
                animFlag = true;
                animItem = "progress1";
                itemPart = EquipSlot_MainHand;
            }
            else{
                animFlag = false;
                libUIKit.showErrorMessage(rsp);
            }
        }, theLayer);
    }

}

function onItem2(){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
}

function onItem3(){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
}

function onItem4(){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
}

function onItem5(){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
}

function onItem6(){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
}

function onNotify(event){
    return false;
}

function onActivate(){
}

function update(delta)
{
    //装备经验增长动画
    if (animFlag == true){
        var step = Math.ceil(delta*EXP_SPEED);
        var item = engine.user.actor.queryArmor(itemPart,true);
        var currXp = 0;
        var upgreadeXp = 1;
        if (item != null){
            if (item.Xp != null)
                currXp = item.Xp + step;
            upgreadeXp = item.equipUpgradeXp();
            if (currXp > upgreadeXp)
                currXp = upgreadeXp;
            addExp -= step;
        }
        else{
            animFlag = false;
            animItem = "";
            addExp = 100;
            itemPart = EquipSlot_MainHand;
        }
        theLayer.ui[animItem].setProgress(currXp/upgreadeXp);
        if (addExp <= 0){
            animFlag = false;
            animItem = "";
            addExp = 100;
            itemPart = EquipSlot_MainHand;
        }
    }
}

function seletMin(){
    if (itemarry.length > 0){
        var min = itemarry[0].StackCount;
        var minId = 0;
        for (var k in itemarry){
            if (itemarry[k].StackCount < min){
                min = itemarry[k].StackCount;
                minId = k;
            }
        }
        var item = itemarry[k];
        itemarry[k] = itemarry[0];
        itemarry[0] = item;
    }
}

function onEnter(){
    theLayer = this;
    theRole = engine.user.actor;
//    var mask = blackMask();
//    this.addChild(mask);
    this.owner = {};
    this.owner.onBack = onBack;
    this.owner.onItem1 = onItem1;
    this.owner.onItem2 = onItem2;
    this.owner.onItem3 = onItem3;
    this.owner.onItem4 = onItem4;
    this.owner.onItem5 = onItem5;
    this.owner.onItem6 = onItem6;
    this.update = update;
    this.scheduleUpdate();

    this.node = libUIC.loadUI(this, "ui-sld.ccbi", {
        nodeExp1:{
            ui: "UIProgress",
            id: "progress1",
            length: 105,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp2:{
            ui: "UIProgress",
            id: "progress2",
            length: 105,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp3:{
            ui: "UIProgress",
            id: "progress3",
            length: 105,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp4:{
            ui: "UIProgress",
            id: "progress4",
            length: 105,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp5:{
            ui: "UIProgress",
            id: "progress5",
            length: 105,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp6:{
            ui: "UIProgress",
            id: "progress6",
            length: 105,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        item1:{
            ui: "UIItem",
            id: "equip1",
            def: "equipmentbg1.png"
        },
        item2:{
            ui: "UIItem",
            id: "equip2",
            def: "equipmentbg2.png"
        },
        item3:{
            ui: "UIItem",
            id: "equip3",
            def: "equipmentbg3.png"
        },
        item4:{
            ui: "UIItem",
            id: "equip4",
            def: "equipmentbg4.png"
        },
        item5:{
            ui: "UIItem",
            id: "equip5",
            def: "equipmentbg5.png"
        },
        item6:{
            ui: "UIItem",
            id: "equip6",
            def: "equipmentbg6.png"
        }
    });
    engine.ui.regMenu(this.owner.menuRoot);
    //set default icon
    theLayer.ui.equip1.setDefaultIcon("equipmentbg1.png");
    theLayer.ui.equip2.setDefaultIcon("equipmentbg2.png");
    theLayer.ui.equip3.setDefaultIcon("equipmentbg3.png");
    theLayer.ui.equip4.setDefaultIcon("equipmentbg4.png");
    theLayer.ui.equip5.setDefaultIcon("equipmentbg5.png");
    theLayer.ui.equip6.setDefaultIcon("equipmentbg6.png");
    //set equipments
    theLayer.ui.equip1.setItem(theRole.queryArmor(EquipSlot_MainHand), theRole);
    theLayer.ui.equip2.setItem(theRole.queryArmor(EquipSlot_SecondHand), theRole);
    theLayer.ui.equip3.setItem(theRole.queryArmor(EquipSlot_Chest), theRole);
    theLayer.ui.equip4.setItem(theRole.queryArmor(EquipSlot_Legs), theRole);
    theLayer.ui.equip5.setItem(theRole.queryArmor(EquipSlot_Finger), theRole);
    theLayer.ui.equip6.setItem(theRole.queryArmor(EquipSlot_Neck), theRole);
    var winSize = cc.Director.getInstance().getWinSize();
    this.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    this.addChild(this.node);
}

function show(){
    engine.ui.newLayer({
        onNotify: onNotify,
        onEnter: onEnter,
        onActivate: onActivate
    });
}

exports.show = show;