/**
 * Created by tringame on 14-5-6.
 */
var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");
var libEffect = loadModule("effect.js");

var theLayer;
var animFlag = false;
var animItem = 0;
var itemPart = EquipSlot_MainHand;
var itemarry = [];
var theRole;
var theWXPSound = -1;

var currExp = 0;
var addExp = 100;
var EXP_SPEED = 75;
var addExpConst = 100;

var theItem = null;
var theBtnId = -1;
var theRes = null;

var argItem = [EquipSlot_MainHand,EquipSlot_SecondHand,EquipSlot_Chest,EquipSlot_Legs,EquipSlot_Finger,EquipSlot_Neck];
var effectSj = "effect-forgesj.ccbi";

var btnItemList = ["btnItem1","btnItem2","btnItem3","btnItem4","btnItem5","btnItem6"];
var equipList = ["equip1","equip2","equip3","equip4","equip5","equip6"];

function onBack(){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    if (theWXPSound >= 0){
        cc.AudioEngine.getInstance().stopEffect(theWXPSound);
    }
    theLayer.node.runAction(actionPopOut(function(){
        engine.ui.popLayer();
    }, theLayer));

}

function onItem(sender){
    var index = sender.getTag();
    index--;

    theLayer.owner[btnItemList[index]].setEnabled(false);
    initExpAnim();
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var itemequip = theLayer.ui[equipList[index]].getItem();

    var countk = 0;
    var inventoryData = engine.user.inventory.Items;
    for(var k in inventoryData){
        var item = inventoryData[k];
        if( item.ClassId == theItem.classId ){
            itemarry[countk] = item;
            countk++;
        }
    }
    //不存在书则退出
    if (countk == 0){
        onBack();
        return;
    }

    seletMin();
    if (itemarry[0] != undefined &&
        itemarry[0] != null){
        //检查装备能否升级
        if (!bookUseFlag(argItem[index])){
            theLayer.owner[btnItemList[index]].setEnabled(true);
            return;
        }

        libUIKit.waitRPC(Request_InventoryUseItem, {
            sid:itemarry[0].ServerId,
            opn:ITMOP_USEEXPBOOK,
            opd:itemequip.ServerId
        }, function(rsp){
            if( rsp.RET == RET_OK ){
                animFlag = true;
                animItem = index + 1;
                itemPart = argItem[index];
                var item = engine.user.actor.queryArmor(itemPart,true);
                if (item != null)
                    currExp = item.Xp;
                if (theWXPSound < 0) {
                    theWXPSound = cc.AudioEngine.getInstance().playEffect("prize.mp3", true);
                }
                if (rsp.RES != null){
                    theRes = rsp.RES;
                    theBtnId = 0;
                }
                libEffect.attachEffectCCBI(theLayer.ui[equipList[index]],cc.p(0, 0), effectSj,libEffect.EFFECTMODE_AUTO);
            }
            else{
                animFlag = false;
                currExp = 0;
                libUIKit.showErrorMessage(rsp);
            }
            theLayer.owner[btnItemList[index]].setEnabled(true);
        }, theLayer);
    }
}

function update(delta)
{
    //装备经验增长动画
    if (animFlag == true){
        var step = Math.ceil(delta*EXP_SPEED);
        var item = engine.user.actor.queryArmor(itemPart,true);
        var upgreadeXp = 1;
        var curXp = 0;
        if (item != null){
            curXp = item.Xp;
            currExp += step;
            upgreadeXp = item.equipUpgradeXp();
            if (curXp > upgreadeXp){
                curXp = upgreadeXp;
            }
            addExp -= step;
        }
        else{
            animFlag = false;
            animItem = 0;
            addExp = theItem.wxp;
            addExpConst = theItem.wxp;
            itemPart = EquipSlot_MainHand;
            if (theWXPSound >= 0) {
                cc.AudioEngine.getInstance().stopEffect(theWXPSound);
            }

            theWXPSound = -1;
        }
        if (currExp >= upgreadeXp){
            currExp = upgreadeXp;
            addExp = 0;
        }
        if (theLayer.ui["progress" + animItem] != undefined){
            theLayer.ui["progress" + animItem].setProgress(currExp/upgreadeXp);

            var sub = Math.ceil(currExp - curXp);
            if (sub > addExpConst){
                sub = addExpConst;
            }
            if (sub > 0){
                theLayer.owner["labExp" + animItem].setVisible(true);
                theLayer.owner["labExp" + animItem].setString("+" + sub);
            }
        }
        if (addExp <= 0){
            animFlag = false;
            animItem = 0;
            addExp = theItem.wxp;
            addExpConst = theItem.wxp;
            itemPart = EquipSlot_MainHand;
            if (theWXPSound >= 0) {
                cc.AudioEngine.getInstance().stopEffect(theWXPSound);
            }
            //debug("373 stopEffect:theWXPSound = " + theWXPSound);
            theWXPSound = -1;
        }
    }
    else if (theBtnId >= 0 && theRes != null){
        engine.event.processResponses(theRes);
        initOneProgress(theBtnId);
        theBtnId = -1;
        theRes = null;
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
        if (minId != 0){
            var item = itemarry[minId];
            itemarry[minId] = itemarry[0];
            itemarry[0] = item;
        }
    }
}

function initExpAnim(){
    if (animFlag == true){
        var item = engine.user.actor.queryArmor(itemPart,true);
        var upgreadeXp = 1;
        var curXp = 0;
        if (item != null){
            curXp = item.Xp;
            currExp += addExp;
            upgreadeXp = item.equipUpgradeXp();
            if (curXp >= upgreadeXp){
                curXp = upgreadeXp;
            }
            addExp = 0;
        }
        else{
            animFlag = false;
            animItem = 0;
            addExp = theItem.wxp;
            addExpConst = theItem.wxp;
            itemPart = EquipSlot_MainHand;
            if (theWXPSound >= 0) {
                cc.AudioEngine.getInstance().stopEffect(theWXPSound);
            }
            theWXPSound = -1;
        }
        if (currExp >= upgreadeXp){
            currExp = upgreadeXp;
            addExp = 0;
        }
        if (theLayer.ui["progress" + animItem] != undefined){
            theLayer.ui["progress" + animItem].setProgress(currExp/upgreadeXp);
            var sub = Math.ceil(currExp - curXp);
            if (sub > addExpConst){
                sub = addExpConst;
            }
            if (sub > 0){
                theLayer.owner["labExp" + animItem].setVisible(true);
                theLayer.owner["labExp" + animItem].setString("+" + sub);
            }
        }
        if (addExp <= 0){
            animFlag = false;
            animItem = 0;
            addExp = theItem.wxp;
            addExpConst = theItem.wxp;
            itemPart = EquipSlot_MainHand;
            if (theWXPSound >= 0) {
                cc.AudioEngine.getInstance().stopEffect(theWXPSound);
            }

            theWXPSound = -1;
        }
    }
}

function bookUseFlag(itempart){
    var ret = true;
    //检查装备能否升级
    var item = engine.user.actor.queryArmor(itempart,true);
    if (item != null) {
        var upgreadeXp = item.equipUpgradeXp();
        if (upgreadeXp <= 0) {
            engine.msg.pop(translate(engine.game.language, "expBookCannotUpgrade"), POPTYPE_ERROR);
            ret = false;
        }
        else if (item.Xp >= upgreadeXp){
            engine.msg.pop(translate(engine.game.language, "expBookEnoughExp"), POPTYPE_INFO);
            ret = false;
        }
    }
    else{
        engine.msg.pop(translate(engine.game.language, "expBookNoItem"), POPTYPE_ERROR);
        ret = false;
    }
    return ret;
}

function initProgress(){
    for (var k in argItem){
        var item = engine.user.actor.queryArmor(argItem[k],true);
        var curXp = 0;
        var upgreadeXp = 1;

        if (item != null){
            curXp = item.Xp;
            upgreadeXp = item.equipUpgradeXp();
            if (upgreadeXp <= 0){
                curXp = 0;
                upgreadeXp = 1;
            }
            if (curXp >= upgreadeXp){
                curXp = upgreadeXp;
            }
        }

        var proId = +k+1;
        theLayer.ui["progress" + proId].setProgress(curXp/upgreadeXp);
    }
}

function initOneProgress(id){
    engine.user.inventory.syncArmors();
    var item = engine.user.actor.queryArmor(argItem[id],true);
    var curXp = 0;
    var upgreadeXp = 1;

    if (item != null){
        curXp = item.Xp;
        upgreadeXp = item.equipUpgradeXp();
        if (upgreadeXp <= 0){
            curXp = 0;
            upgreadeXp = 1;
        }
        if (curXp >= upgreadeXp){
            curXp = upgreadeXp;
        }
    }

    var proId = +id+1;
    theLayer.ui["progress" + proId].setProgress(curXp/upgreadeXp);
}

function onEnter(){
    theLayer = this;
    theRole = engine.user.actor;
//    var mask = blackMask();
//    this.addChild(mask);
    this.owner = {};
    this.owner.onBack = onBack;
    this.owner.onItem = onItem;
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
    //set label
    theLayer.owner.labExp1.setVisible(false);
    theLayer.owner.labExp2.setVisible(false);
    theLayer.owner.labExp3.setVisible(false);
    theLayer.owner.labExp4.setVisible(false);
    theLayer.owner.labExp5.setVisible(false);
    theLayer.owner.labExp6.setVisible(false);
    //set progress
    initProgress();
    var mask = blackMask();
    this.addChild(mask);

    var winSize = engine.game.viewSize;
    this.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    this.addChild(this.node);

    this.node.setScale(0);
    this.node.runAction(actionPopIn());

}

function show(item){
    theItem = item;
    addExp = theItem.wxp;
    addExpConst = theItem.wxp;
    EXP_SPEED = theItem.wxp / 2;
    engine.ui.newLayer({
        onEnter: onEnter
    });
}

exports.show = show;