/**
 * User: hammer
 * Date: 13-8-29
 * Time: 下午5:43
 */

var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libItem = loadModule("xitem.js");
var libUIKit = loadModule("uiKit.js");
var libEffect = loadModule("effect.js");
var libGadget = loadModule("gadgets.js");

var theLayer = null;

var theContentNode;
var theContentNodeL;
var theContentNodeR;

var isFlying = false;
var theContent = null;
var theTransitionContent = null;

var UpgradeArgs = null;
var EnhanceArgs = null;
var EnhanceStoneLevel = -1;//0,1,2,3,4
var EnhanceStoneCost = 0;//quantity
var EnhanceStoneCid = [5];//cid array
var EnhanceStoneSid = 0;//sid
var EnhanceMaxLv = 39;

var MODE_UPGRADE = 0;
var MODE_ENHANCE = 1;
var MODE_FORGE = 2;
var MODE_SYNTHESIZE = 3;
var MODE_EXIT = 4;
var theMode = MODE_UPGRADE;
var goldCost = 0;

//equipment variables
var chosenItem = null;

//forge variables
var ForgeArgs = null;
var ForgeCost = 0;

//synthesize variables
var SynthesizeArgs = null;
var SynthesizeStoneFrom = 1;
var SynthesizeSlider;

var theForgeItem;
var theForgeAnimationNode;
var TouchId;
var EnoughMtrls = false;

var Delta = [];

var ITEM_POSITION = cc.p(45,45);

function onFinishForgeAnimation(func, obj){
    theForgeAnimationNode.runAction(actionPopOut(function(){
        engine.ui.popLayer();
        func.apply(obj);
    }, theLayer));
}

function pushForgeAnimation(file, args, func, obj){
    var layer = engine.ui.newLayer();
    var mask = blackMask();
    layer.addChild(mask);
    var winSize = cc.Director.getInstance().getWinSize();
    theForgeAnimationNode = libEffect.attachEffectCCBI(layer, cc.p(winSize.width/2, winSize.height/2), file, libEffect.EFFECTMODE_STAY);
    for(var k in args){
        var icon = libItem.UIItem.create(args[k]);
        theForgeAnimationNode.owner[k].addChild(icon);
    }
    theForgeAnimationNode.setCompleteCallback(onFinishForgeAnimation, theForgeAnimationNode, [
        func, obj
    ]);
}

//export for dissolve
exports.pushForgeAnimation = pushForgeAnimation;

function setModeTag(mode){
    var sfc = cc.SpriteFrameCache.getInstance();
    if( mode == MODE_UPGRADE ){
        theLayer.owner.btnUpgrade.setNormalSpriteFrame(sfc.getSpriteFrame("forge1-common-tabsj1.png"));
        theLayer.owner.btnUpgrade.setSelectedSpriteFrame(sfc.getSpriteFrame("forge1-common-tabsj2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("forge1-common-title.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("forge1-common-title.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("forge1-common-title.png"));
        theLayer.owner.btnUpgrade.setEnabled(false);
    }
    else{
        theLayer.owner.btnUpgrade.setNormalSpriteFrame(sfc.getSpriteFrame("forge1-common-tabsj2.png"));
        theLayer.owner.btnUpgrade.setSelectedSpriteFrame(sfc.getSpriteFrame("forge1-common-tabsj1.png"));
        theLayer.owner.btnUpgrade.setEnabled(true);
    }
    if( mode == MODE_ENHANCE ){
        theLayer.owner.btnEnhance.setNormalSpriteFrame(sfc.getSpriteFrame("forge2-common-tabqh1.png"));
        theLayer.owner.btnEnhance.setSelectedSpriteFrame(sfc.getSpriteFrame("forge2-common-tabqh2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("forge2-common-title.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("forge2-common-title.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("forge2-common-title.png"));
        theLayer.owner.btnEnhance.setEnabled(false);
    }
    else{
        theLayer.owner.btnEnhance.setNormalSpriteFrame(sfc.getSpriteFrame("forge2-common-tabqh2.png"));
        theLayer.owner.btnEnhance.setSelectedSpriteFrame(sfc.getSpriteFrame("forge2-common-tabqh1.png"));
        theLayer.owner.btnEnhance.setEnabled(true);
    }
    if( mode == MODE_FORGE ){
        theLayer.owner.btnForge.setNormalSpriteFrame(sfc.getSpriteFrame("forge3-common-tabdz1.png"));
        theLayer.owner.btnForge.setSelectedSpriteFrame(sfc.getSpriteFrame("forge3-common-tabdz2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("forge3-common-title.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("forge3-common-title.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("forge3-common-title.png"));
        theLayer.owner.btnForge.setEnabled(false);
    }
    else{
        theLayer.owner.btnForge.setNormalSpriteFrame(sfc.getSpriteFrame("forge3-common-tabdz2.png"));
        theLayer.owner.btnForge.setSelectedSpriteFrame(sfc.getSpriteFrame("forge3-common-tabdz1.png"));
        theLayer.owner.btnForge.setEnabled(true);
    }
    if( mode == MODE_SYNTHESIZE ){
        theLayer.owner.btnSynthesize.setNormalSpriteFrame(sfc.getSpriteFrame("forge4-common-tabtl1.png"));
        theLayer.owner.btnSynthesize.setSelectedSpriteFrame(sfc.getSpriteFrame("forge4-common-tabtl2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("forge4-common-title.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("forge4-common-title.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("forge4-common-title.png"));
        theLayer.owner.btnSynthesize.setEnabled(false);
    }
    else{
        theLayer.owner.btnSynthesize.setNormalSpriteFrame(sfc.getSpriteFrame("forge4-common-tabtl2.png"));
        theLayer.owner.btnSynthesize.setSelectedSpriteFrame(sfc.getSpriteFrame("forge4-common-tabtl1.png"));
        theLayer.owner.btnSynthesize.setEnabled(true);
    }
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theMode = MODE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function upItem(senderTag){
    var CHILDTAG_FRAME = 10;
    var frameSelected = cc.Sprite.create("skillbg.png");
    frameSelected.setScale(0.8);
    frameSelected.setPosition(ITEM_POSITION);
    var choosingItem = theContent.owner["item"+senderTag];
    if( chosenItem != null ){
        if( choosingItem != chosenItem){
            chosenItem.runAction(cc.MoveBy.create(0.1, cc.p(0, -7)));
            chosenItem.removeChildByTag(CHILDTAG_FRAME);
        }
        else{ return; }
    }
    chosenItem = choosingItem;
    chosenItem.addChild(frameSelected, 51, CHILDTAG_FRAME);
    chosenItem.runAction(cc.MoveBy.create(0.1, cc.p(0, 7)));
}

function getEnhanceStoneCid(stoneLv){
    for( var cid=0; ; cid++){
        var item = libTable.queryTable(TABLE_ITEM, cid);
        if( item != null ){
            if( item.category == 2 && item.subcategory == 1 && item.quality == stoneLv){
                return item.classId;
            }
        }
        else return null;
    }
}
exports.getEnhanceStoneCid = getEnhanceStoneCid;

function checkGold(gold){
    if (engine.user.inventory.Gold < gold){
        var needgold = gold - engine.user.inventory.Gold;
        var needdia = Math.ceil(needgold / 10);
        var str1 = "金币不足\n还需要"+needgold+"金币\n需要使用"+needdia+"宝石来兑换吗?";
        var str2 = "宝石不足，无法兑换\n需要充值吗?";
        debug("宝石 = "+needdia);
        libUIKit.confirmPurchase(Request_BuyFeature, {
            typ: 3,
            tar: needdia
        }, str1, str2, needdia, function(rsp){
            if( rsp.RET == RET_OK ){
                //统计
                tdga.itemPurchase("兑金币", needgold, 0.1);
            }
        });
        return false;
    }
    else{
        return true;
    }
}

//--- 升级 ---
function onStartUpgrade(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( EnoughMtrls ){
        if( UpgradeArgs != null ) {
            debug("金币 = " + goldCost);
            if (checkGold(goldCost)) {
                libUIKit.waitRPC(Request_InventoryUseItem, UpgradeArgs, function (rsp) {
                    if (rsp.RET == RET_OK) {
                        pushForgeAnimation("effect-forge.ccbi", {nodeItem: theForgeItem}, function () {
                            libUIKit.showAlert("装备升级成功", function () {
                            }, theLayer);
                            //execute result
                            if (rsp.RES != null) {
                                engine.event.processResponses(rsp.RES);
                                var slot = EquipSlot_MainHand;
                                switch (TouchId) {
                                    case 1: slot = EquipSlot_MainHand; break;
                                    case 2: slot = EquipSlot_SecondHand; break;
                                    case 3: slot = EquipSlot_Chest; break;
                                    case 4: slot = EquipSlot_Legs; break;
                                    case 5: slot = EquipSlot_Finger; break;
                                    case 6: slot = EquipSlot_Neck; break;
                                }
                                var newItem = engine.user.actor.queryArmor(slot);
                                if (newItem != null) {
                                    theContent.ui["equip" + TouchId].setItemSmall(newItem);
                                    setUpgradeItem(newItem);
                                }
                            }
                        }, theLayer);
                    }
                    else {
                        libUIKit.showErrorMessage(rsp);
                    }
                }, theLayer);
            }
        }
    }
    else{
        libUIKit.showAlert("条件不足无法升级");
    }
}

function setUpgradeItem(item){
    if( item != null ){
        item = syncItemData(item);
        var itemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
    }
    if( item != null && itemClass.label != null )
    {//set value
        if( itemClass.upgradeTarget != null )
        {//can upgrade
            theContent.owner.content1.setVisible(true);
            theContent.owner.content2.setVisible(false);
            theContent.owner.btnStartUpgrade.setEnabled(true);
            theContent.ui.oldItem.setItem(item);
            theForgeItem = item;
            theContent.owner.oldName.setString(itemClass.label);
            theContent.owner.labLvOld.setString(itemClass.rank);
            theContent.ui.properties1.setProperties(item);
            var upgradeXp = itemClass.upgradeXp;
            var upgradeCost = itemClass.upgradeCost;
            if( upgradeXp == null ){
                upgradeXp = libTable.queryTable(TABLE_UPGRADE, itemClass.rank).xp;
            }
            if( upgradeCost == null ){
                upgradeCost = libTable.queryTable(TABLE_UPGRADE, itemClass.rank).cost;
            }
            var targetClass = libTable.queryTable(TABLE_ITEM, itemClass.upgradeTarget);
            var dummyTarget = new libItem.Item({cid:itemClass.upgradeTarget, eh:item.Enhance});
            theContent.ui.newItem.setItem(dummyTarget);
            theContent.owner.newName.setString(targetClass.label);
            theContent.owner.labLvNew.setString(targetClass.rank);
            theContent.ui.properties2.setProperties(dummyTarget, "upgrade");
            theContent.ui.cost.setPrice({
                gold: upgradeCost
            });

            goldCost = upgradeCost;

            var xp = item.Xp;
            if( xp >= upgradeXp ){
                xp = upgradeXp;
                EnoughMtrls = true;
            }else{
                EnoughMtrls = false;
            }

            if( itemClass.rank != null && itemClass.rank < engine.user.actor.Level ){
                theContent.owner.labXp.setString("熟练度 "+xp+"/"+upgradeXp);
                theContent.ui.xp.setProgress(xp/upgradeXp);

                UpgradeArgs = {
                    sid: item.ServerId,
                    opn: ITMOP_UPGRADE
                };
            }
            else{
                theContent.owner.labXp.setString("玩家等级不足，无法升级装备");
                theContent.ui.xp.setProgress(xp/upgradeXp);

                UpgradeArgs = null;
            }
        }
        else
        {//can't upgrade
            theContent.owner.content1.setVisible(false);
            theContent.owner.content2.setVisible(true);
            theContent.owner.btnStartUpgrade.setEnabled(false);
            theContent.owner.labLv.setString(itemClass.rank);
            theContent.owner.theName.setString(itemClass.label);
            theContent.ui.theItem.setItem(item);
            theContent.ui.properties3.setProperties(item);
            if( itemClass.rank == 10 ){
                theContent.owner.tipLvMax.setVisible(true);
                theContent.owner.tipToForge.setVisible(false);
            }else{
                theContent.owner.tipLvMax.setVisible(false);
                theContent.owner.tipToForge.setVisible(true);
            }
            EnoughMtrls = false;
            UpgradeArgs = null;
        }
    }
    else
    {//set null
        theContent.ui.oldItem.setItem(null);
        theContent.owner.oldName.setString("");
        theContent.owner.labOldProperty.setString("");
        theContent.ui.newItem.setItem(null);
        theContent.owner.newName.setString("");
        theContent.owner.labNewProperty.setString("");
        theContent.ui.cost.setPrice(null);
        theContent.owner.labXp.setString("");
        theContent.ui.xp.setProgress(0);
        EnoughMtrls = false;
    }
}

function onUpgradeEquip(sender){
    if( isFlying ) return;
    TouchId = sender.getTag();
    var slot = EquipSlot_MainHand;
    switch(TouchId){
        case 1: slot = EquipSlot_MainHand; break;
        case 2: slot = EquipSlot_SecondHand; break;
        case 3: slot = EquipSlot_Chest; break;
        case 4: slot = EquipSlot_Legs; break;
        case 5: slot = EquipSlot_Finger; break;
        case 6: slot = EquipSlot_Neck; break;
    }
    var oldItem = engine.user.actor.queryArmor(slot);
    if( oldItem != null){
        cc.AudioEngine.getInstance().playEffect("card2.mp3");
        upItem(TouchId);
        setUpgradeItem(oldItem);
    }
}

function loadUpgrade(){
    var ret = {};
    ret.owner = {};
    ret.owner.onStartUpgrade = onStartUpgrade;
    ret.owner.onUpgradeEquip = onUpgradeEquip;

    var bind = {
        item1: {
            ui: "UIItem",
            id: "equip1",
            def: "equipmentbg1.png"
        },
        item2: {
            ui: "UIItem",
            id: "equip2",
            def: "equipmentbg2.png"
        },
        item3: {
            ui: "UIItem",
            id: "equip3",
            def: "equipmentbg3.png"
        },
        item4: {
            ui: "UIItem",
            id: "equip4",
            def: "equipmentbg4.png"
        },
        item5: {
            ui: "UIItem",
            id: "equip5",
            def: "equipmentbg5.png"
        },
        item6: {
            ui: "UIItem",
            id: "equip6",
            def: "equipmentbg6.png"
        },
        itemOld: {
            ui: "UIItem",
            id: "oldItem",
            def: "wenhao.png"
        },
        itemNew: {
            ui: "UIItem",
            id: "newItem",
            def: "wenhao.png"
        },
        nodeCost: {
            ui: "UIPrice",
            id: "cost"
        },
        nodeExp: {
            ui: "UIProgress",
            id: "xp",
            length: 475,
            begin: "index-jy1.png",
            middle: "index-jy2.png",
            end: "index-jy3.png"
        },
        nodeProperties1: {
            ui: "UIProperties",
            id: "properties1"
        },
        nodeProperties2: {
            ui: "UIProperties",
            id: "properties2"
        },
        theItem: {
            ui: "UIItem",
            id: "theItem",
            def: "wenhao.png"
        },
        nodeProperties3: {
            ui: "UIProperties",
            id: "properties3"
        }
    };
    var node = libUIC.loadUI(ret, "ui-forge.ccbi", bind);
    ret.node = node;
    engine.ui.regMenu(ret.owner.menuRoot);

    //set values
    ret.ui.equip1.setItemSmall(engine.user.actor.queryArmor(EquipSlot_MainHand));
    ret.ui.equip2.setItemSmall(engine.user.actor.queryArmor(EquipSlot_SecondHand));
    ret.ui.equip3.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Chest));
    ret.ui.equip4.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Legs));
    ret.ui.equip5.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Finger));
    ret.ui.equip6.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Neck));
    ret.ui.xp.setProgress(0);

    return ret;
}

function onUpgrade(sender){
    chosenItem = null;
    if( isFlying ) return;

    //clean transitionContent
    if( theTransitionContent != null ){
        theTransitionContent.removeFromParent();
        theTransitionContent = null;
    }

    if( theMode < MODE_UPGRADE ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionContent = loadUpgrade();
        theContentNodeR.addChild(theTransitionContent.node);
        isFlying = true;
    }
    else if( theMode > MODE_UPGRADE ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionContent = loadUpgrade();
        theContentNodeL.addChild(theTransitionContent.node);
        isFlying = true;
    }
    else{
        //just load
        theTransitionContent = null;
        theContent = loadUpgrade();
        theContentNode.addChild(theContent.node);
        isFlying = false;
    }
    theMode = MODE_UPGRADE;
    setModeTag(theMode);

    UpgradeArgs = null;
}

//--- 强化 ---

function onStartEnhance(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( EnoughMtrls ){
        if( EnhanceArgs != null){
            if( checkGold(goldCost)){
                libUIKit.waitRPC(Request_InventoryUseItem, EnhanceArgs, function(rsp){
                    if( rsp.RET == RET_OK || rsp.RET == RET_EnhanceFailed ){
                        if( rsp.RET == RET_OK) {
                            libEffect.attachEffectCCBI(theContent.owner.itemEquip, cc.p(0,0), "effect-forgeqh.ccbi");
                            EnoughMtrls = false;
                        }
                        else{
                            libUIKit.showErrorMessage(rsp);
                        }
                        //execute result
                        if( rsp.RES != null ){
                            engine.event.processResponses(rsp.RES);
                            theContent.ui["equip"+TouchId].setItemSmall(theForgeItem);
                            setEnhanceEquip(theForgeItem);
                        }
                    }
                    else{
                        libUIKit.showErrorMessage(rsp);
                    }
                }, theLayer);
            }
        }
        else{
            libUIKit.showAlert("该装备无法再强化");
        }
    }
    else{
        libUIKit.showAlert("强化宝石的数量不足");
    }

}

function setEnhanceEquip(item){
    theContent.ui.properties.setProperties(null);
    if( item != null ){
        item = syncItemData(item);
        var itemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
    }
    if( item != null && itemClass.label != null ){
        theContent.ui.equip.setItem(item);
        theForgeItem = item;
        theContent.owner.labEquipName.setString(itemClass.label);

        //load equip enhance state
        var enhance = -1;
        if( item.Enhance[0] != null && item.Enhance[0].lv != null ){
            enhance = item.Enhance[0].lv;
        }else{
            item.Enhance[0] = {id:null, lv:-1};
            enhance = item.Enhance[0].lv;
        }
        var starLv = Math.floor((enhance+1) / 8);
        var barLv = ((enhance == EnhanceMaxLv)? 8:Math.floor(((enhance+1)%8)));
        for(var i=1; i<6; ++i){
            var starName = "ehStar"+i;
            if( i <= starLv){
                theContent.owner[starName].runAction(cc.FadeIn.create(0.3));
            }
            else {
                theContent.owner[starName].stopAllActions();
                theContent.owner[starName].setOpacity(0);
            }
        }
        for(var i=1; i<9; ++i){
            var barName = "ehBar"+i;
            if( i <= barLv){
                theContent.owner[barName].runAction(cc.FadeIn.create(0.3));
            }
            else {
                theContent.owner[barName].stopAllActions();
                theContent.owner[barName].setOpacity(0);
            }
        }

        theContent.ui.properties.setProperties(item, "enhance");
        theContent.owner.labLv.setString(itemClass.rank);
        
        if( EnhanceArgs == null ){
            EnhanceArgs = {};
        }
        EnhanceArgs.sid = item.ServerId;
        EnhanceArgs.opn = ITMOP_ENHANCE;

        EnoughMtrls = true;
        setEnhanceStone(itemClass);

    }
    else{
        theContent.ui.equip.setItem(null);
        theContent.owner.labEquipName.setString("请选择装备");
        theContent.ui.properties.setProperties(null);
        theContent.owner.labLv.setString("0");
        //load equip enhance state
        for(var i=0; i<5; ++i){
            var starName = "ehStar"+(i+1);
            theContent.owner[starName].setOpacity(0);
        }
        for(var i=0; i<8; ++i){
            var barName = "ehBar"+(i+1);
            theContent.owner[barName].setOpacity(0);
        }
        if( EnhanceArgs != null ){
            EnhanceArgs = null;
        }
        setEnhanceStone(null);

    }
}

function setEnhanceStone(itemClass){
    theContent.owner.btnPlus.setVisible(false);
    if( itemClass != null ){
        var enhance = (theForgeItem.Enhance[0] != null)? theForgeItem.Enhance[0].lv : -1;
        var enhanceInfo = libTable.queryTable(TABLE_ENHANCE, itemClass.enhanceID);
        if( enhanceInfo != null ){
            if( enhance < 8*(itemClass.quality+1)-1 ) {
                theContent.owner.btnStartEnhance.setEnabled(true);
                theContent.owner.tipLvMax.setVisible(false);
                theContent.owner.tipToForge.setVisible(false);
                var enhanceCost = libTable.queryTable(TABLE_COST, enhanceInfo.costList[enhance+1]);
                if( enhanceCost != null ){
                    for( var k in enhanceCost.material){
                        switch(enhanceCost.material[k].type){
                            case 0: {
                                EnhanceStoneLevel = libTable.queryTable(TABLE_ITEM, enhanceCost.material[k].value).quality;
                                EnhanceStoneCost = enhanceCost.material[k].count;
                                for(var i=1; i<6; i++){
                                    theContent.owner["stone"+i].setVisible( (EnhanceStoneLevel+1) == i );
                                }
                                EnhanceStoneSid = engine.user.inventory.getServerId(EnhanceStoneCid[EnhanceStoneLevel]);
                                var stoneCount = engine.user.inventory.countItem(EnhanceStoneCid[EnhanceStoneLevel]);
                                theContent.owner.labStoneCost.setString(EnhanceStoneCost);
                                if (stoneCount < EnhanceStoneCost){
                                    Delta[0] = EnhanceStoneCost - stoneCount;
                                    theContent.owner.labStoneCost.setColor(cc.c3b(255,0,0));
                                    theContent.owner.btnPlus.setVisible(true);
                                    EnhanceArgs = null;
                                    EnoughMtrls = false;
                                }
                                else {
                                    Delta[0] = 0;
                                    theContent.owner.labStoneCost.setColor(cc.c3b(0,255,0));
                                    theContent.owner.btnPlus.setVisible(false);
                                    EnoughMtrls = true;
                                }
                            }break;
                            case 1: {
                                var moneyCost = enhanceCost.material[k].count;
                                theContent.owner.labGoldCost.setString(moneyCost);
                                goldCost = moneyCost;
                            }break;
                            default: break;
                        }
                    }
                    return;
                }
            }
            else{
                theContent.owner.btnStartEnhance.setEnabled(false);
                if( enhance == EnhanceMaxLv ){
                    theContent.owner.tipLvMax.setVisible(true);
                    theContent.owner.tipToForge.setVisible(false);
                }else{
                    theContent.owner.tipLvMax.setVisible(false);
                    theContent.owner.tipToForge.setVisible(true);
                }
            }
        }
        theContent.owner.labStoneCost.setString("0");
        theContent.owner.labStoneCost.setColor(cc.c3b(33,22,13));
        theContent.owner.labGoldCost.setString("0");
        for(var i=1; i<6; i++){
            theContent.owner["stone"+i].setVisible( i==1 );
        }
        EnhanceStoneCost = 0;
        EnhanceStoneLevel = -1;
        EnhanceArgs = null;
        EnoughMtrls = true;
    }
    else{
        theContent.owner.labStoneCost.setString("0");
        theContent.owner.labStoneCost.setColor(cc.c3b(33,22,13));
        for(var i=1; i<6; i++){
            theContent.owner["stone"+i].setVisible( i==1 );
        }
        theContent.ui.properties.setProperties(null);
        theContent.owner.labGoldCost.setString("0");
        EnhanceStoneCost = 0;
        EnhanceStoneLevel = -1;
        EnoughMtrls = true;
    }
}

function onAddStone(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var shopItem = engine.session.queryStore(EnhanceStoneCid[EnhanceStoneLevel]);
    var cost = shopItem.cost["diamond"]*Delta[0];
    var str1 = "材料不足\n立即花费"+cost+"宝石买齐材料？";
    var str2 = "材料不足，且没有足够宝石来购买材料\n立即去充值页面？";
    var args = {
        sid: shopItem.sid,
        cnt: Delta[0],
        ver: engine.session.shop.version
    };
    libUIKit.confirmPurchase(Request_StoreBuyItem, args, str1, str2, cost, function(rsp){
        if( rsp.RET == RET_OK){
            cc.AudioEngine.getInstance().playEffect("buy.mp3");
        }
    });
}

function onEnhanceEquip(sender){
    if( isFlying ) return;
    TouchId = sender.getTag();
    var slot = EquipSlot_MainHand;
    switch(TouchId){
        case 1: slot = EquipSlot_MainHand; break;
        case 2: slot = EquipSlot_SecondHand; break;
        case 3: slot = EquipSlot_Chest; break;
        case 4: slot = EquipSlot_Legs; break;
        case 5: slot = EquipSlot_Finger; break;
        case 6: slot = EquipSlot_Neck; break;
    }
    var enhanceEquip = engine.user.actor.queryArmor(slot);
    if( enhanceEquip != null){
        cc.AudioEngine.getInstance().playEffect("card2.mp3");
        upItem(TouchId);
        setEnhanceEquip(enhanceEquip);
    }
}

function loadEnhance(){
    var ret = {};
    ret.owner = {};
    ret.owner.onStartEnhance = onStartEnhance;
    ret.owner.onEnhanceEquip = onEnhanceEquip;
    ret.owner.onAddStone = onAddStone;

    var bind = {
        item1: {
            ui: "UIItem",
            id: "equip1",
            def: "equipmentbg1.png"
        },
        item2: {
            ui: "UIItem",
            id: "equip2",
            def: "equipmentbg2.png"
        },
        item3: {
            ui: "UIItem",
            id: "equip3",
            def: "equipmentbg3.png"
        },
        item4: {
            ui: "UIItem",
            id: "equip4",
            def: "equipmentbg4.png"
        },
        item5: {
            ui: "UIItem",
            id: "equip5",
            def: "equipmentbg5.png"
        },
        item6: {
            ui: "UIItem",
            id: "equip6",
            def: "equipmentbg6.png"
        },
        itemEquip: {
            ui: "UIItem",
            id: "equip"
        },
        nodeProperties: {
            ui: "UIProperties",
            id: "properties"
        }
    };
    var node = libUIC.loadUI(ret, "ui-forge2.ccbi", bind);
    ret.node = node;
    engine.ui.regMenu(ret.owner.menuRoot);

    //set values
    ret.ui.equip1.setItemSmall(engine.user.actor.queryArmor(EquipSlot_MainHand));
    ret.ui.equip2.setItemSmall(engine.user.actor.queryArmor(EquipSlot_SecondHand));
    ret.ui.equip3.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Chest));
    ret.ui.equip4.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Legs));
    ret.ui.equip5.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Finger));
    ret.ui.equip6.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Neck));

    return ret;
}

function onEnhance(sender){
    if( !engine.user.player.checkUnlock("enhance") ){
        return;
    }
    chosenItem = null;

    if( isFlying ) return;

    //clean transitionContent
    if( theTransitionContent != null ){
        theTransitionContent.removeFromParent();
        theTransitionContent = null;
    }

    if( theMode < MODE_ENHANCE ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionContent = loadEnhance();
        theContentNodeR.addChild(theTransitionContent.node);
        isFlying = true;
    }
    else if( theMode > MODE_ENHANCE ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionContent = loadEnhance();
        theContentNodeL.addChild(theTransitionContent.node);
        isFlying = true;
    }
    else{
        //just load
        theTransitionContent = null;
        theContent = loadEnhance();
        theContentNode.addChild(theContent.node);
        isFlying = false;
    }

    theMode = MODE_ENHANCE;
    setModeTag(theMode);

    EnhanceArgs = null;
}

//--- 锻造(升阶) ---
function loadForge(){
    var ret = {};
    ret.owner = {};
    ret.owner.onForgeEquip = onForgeEquip;
    ret.owner.onStartForge = onStartForge;
    ret.owner.onAddMaterials = onAddMaterials;
    var bind = {
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
        },
        itemMtrl1:{
            ui: "UIItem",
            id: "mtrl1"
        },
        itemMtrl2:{
            ui: "UIItem",
            id: "mtrl2"
        },
        itemMtrl3:{
            ui: "UIItem",
            id: "mtrl3"
        },
        itemMtrl4:{
            ui: "UIItem",
            id: "mtrl4"
        },
        itemMtrl5:{
            ui: "UIItem",
            id: "mtrl5"
        },
        itemMtrl6:{
            ui: "UIItem",
            id: "mtrl6"
        },
        itemTarget: {
            ui: "UIItem",
            id: "equipTarget",
            def: "wenhao.png"
        },
        nodeProperties: {
            ui: "UIProperties",
            id: "properties"
        },
        nodeCost: {
            ui: "UIPrice",
            id: "cost"
        }
    };
    var node = libUIC.loadUI(ret, "ui-forge3.ccbi", bind);
    ret.node = node;
    engine.ui.regMenu(ret.owner.menuRoot);

    //set values
    ret.ui.equip1.setItemSmall(engine.user.actor.queryArmor(EquipSlot_MainHand));
    ret.ui.equip2.setItemSmall(engine.user.actor.queryArmor(EquipSlot_SecondHand));
    ret.ui.equip3.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Chest));
    ret.ui.equip4.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Legs));
    ret.ui.equip5.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Finger));
    ret.ui.equip6.setItemSmall(engine.user.actor.queryArmor(EquipSlot_Neck));
    var dummyMtrl = new libItem.Item();
    for( var i=1; i<7; ++i){
        ret.ui["mtrl"+i].setItemSmall(dummyMtrl);
        ret.owner["btnAdd" + i].setVisible(false);
        ret.owner["itemMtrl" + i].setEnabled(false);
    }
    return ret;
}

function onAddMaterials(sender) {
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var id = sender.getTag();
    var itemCid = theContent.ui["mtrl" + id].getItem().ClassId;
    var shopItem = engine.session.queryStore(itemCid);
    var cost = shopItem.cost["diamond"] * Delta[id];
    var str1 = "材料不足\n立即花费" + cost + "宝石买齐材料？";
    var str2 = "材料不足，且没有足够宝石来购买材料\n立即去充值页面？";
    var args = {
        sid: shopItem.sid,
        cnt: Delta[id],
        ver: engine.session.shop.version
    };
    libUIKit.confirmPurchase(Request_StoreBuyItem, args, str1, str2, cost, function (rsp) {
        if (rsp.RET == RET_OK) {
            cc.AudioEngine.getInstance().playEffect("buy.mp3");
        }
    });
}

function onForgeEquip(sender){
    if( isFlying ) return;
    TouchId  = sender.getTag();
    var slot = EquipSlot_MainHand;
    switch(TouchId){
        case 1: slot = EquipSlot_MainHand; break;
        case 2: slot = EquipSlot_SecondHand; break;
        case 3: slot = EquipSlot_Chest; break;
        case 4: slot = EquipSlot_Legs; break;
        case 5: slot = EquipSlot_Finger; break;
        case 6: slot = EquipSlot_Neck; break;
    }
    var forgeEquip = engine.user.actor.queryArmor(slot);
    if( forgeEquip != null){
        cc.AudioEngine.getInstance().playEffect("card2.mp3");
        upItem(TouchId);
        setForgeEquip(forgeEquip);
    }
}

var ableToForge = -1; // 0:可升阶 1:顶级 2:装备等级不足
function checkForgeTarget(itemClass){
    var target = itemClass.forgeTarget;
    var quality = itemClass.quality;
    if ( target != null ){
        ableToForge = 0;
        return true;
    }else{
        if( quality == 4){
            ableToForge = 1;
        }else{
            ableToForge = 2;
        }
        return false;
    }
}

function setForgeEquip(item){
    if( item != null ){
        item = syncItemData(item);
        var itemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
    }
    if( item != null && itemClass.label != null ) {
        //set value
        theContent.ui.equipTarget.setItem(item);
        theContent.owner.labName.setString(itemClass.label);
        theContent.owner.labLv.setString(itemClass.rank);
        theForgeItem = item;
        theContent.ui.properties.setProperties(item, "forge");
        if( ForgeArgs == null ){
            ForgeArgs = {};
        }
        ForgeArgs.sid = item.ServerId;
        ForgeArgs.opn = ITMOP_FORGE;

        if( checkForgeTarget(itemClass)){
            EnoughMtrls = true;
            loadForgeMaterial(itemClass);
//            theContent.owner.tipLvMax.setVisible(flase);
//            theContent.owner.tipToForge.setVisible(false);

        }else{
            loadForgeMaterial(null);
            if( ableToForge == 1 ){
//                theContent.owner.tipLvMax.setVisible(true);
//                theContent.owner.tipToForge.setVisible(false);
            }else if( ableToForge == 2 ){
//                theContent.owner.tipLvMax.setVisible(false);
//                theContent.owner.tipToForge.setVisible(true);
            }
        }

    }
    else {
        theContent.ui.equipTarget.setItem(null);
        theContent.owner.labName.setString("请选择装备");
        theContent.ui.properties.setProperties(null);
        if( ForgeArgs != null ){
            delete ForgeArgs.sid;
        }
        EnoughMtrls = false;
        loadForgeMaterial(null);
    }
}

function loadForgeMaterial(equipClass){
    if( equipClass != null) {
        var forgeCost = libTable.queryTable(TABLE_COST, equipClass.forgeID);
        if (forgeCost != null) {
            var i = 1;
            for (var k in forgeCost.material) {
                switch (forgeCost.material[k].type) {
                    case 0:{
                        if (i < 7) {
                            var mtrlClass = libTable.queryTable(TABLE_ITEM, forgeCost.material[k].value);
                            var mtrlCount = engine.user.inventory.countItem(mtrlClass.classId);
                            var mtrlCost = forgeCost.material[k].count;
                            var dummyMtrl = new libItem.Item({cid: mtrlClass.classId});
                            theContent.ui["mtrl" + i].removeAllChildren();
                            theContent.ui["mtrl" + i].setItemSmall(dummyMtrl);
                            theContent.owner["labCount" + i].setString(mtrlCount + "/" + mtrlCost);
                            if (mtrlCount >= mtrlCost) {
                                Delta[i] = 0;
                                theContent.owner["labCount" + i].setColor(cc.c3b(0, 255, 0));
                                theContent.owner["btnAdd" + i].setVisible(false);
                                theContent.owner["itemMtrl" + i].setEnabled(false);
                            }
                            else {
                                Delta[i] = mtrlCost - mtrlCount;
                                theContent.owner["labCount" + i].setColor(cc.c3b(255, 0, 0));
                                theContent.owner["btnAdd" + i].setVisible(true);
                                theContent.owner["itemMtrl" + i].setEnabled(true);
                                EnoughMtrls = false;
                            }
                            i++;
                        }
                    }break;
                    case 1:{
                        var moneyCost = forgeCost.material[k].count;
                        theContent.owner.labGoldCost.setString(moneyCost);
                        goldCost = moneyCost;
                    }break;
                    default: break;
                }
            }
        }
        else{
            for( var i=1; i<7; ++i){
                theContent.ui["mtrl"+i].setItemSmall(null);
                theContent.owner["labCount"+i].setString("0/0");
                theContent.owner["labCount"+i].setColor(cc.c3b(192,192,192));
                theContent.owner["btnAdd"+i].setVisible(false);
                theContent.owner["itemMtrl" + i].setEnabled(false);
            }
            theContent.owner.labGoldCost.setString("0");
            EnoughMtrls = false;
        }
    }
    else{
        for( var i=1; i<7; ++i){
            theContent.ui["mtrl"+i].setItemSmall(null);
            theContent.owner["labCount"+i].setString("0/0");
            theContent.owner["labCount"+i].setColor(cc.c3b(192,192,192));
            theContent.owner["btnAdd"+i].setVisible(false);
            theContent.owner["itemMtrl" + i].setEnabled(false);
        }
        theContent.owner.labGoldCost.setString("0");
        EnoughMtrls = false;
    }
}

function onForge(sender){
    if( !engine.user.player.checkUnlock("forge") ){
        return;
    }
    chosenItem = null;
    if( isFlying ) return;

    //clean transitionContent
    if( theTransitionContent != null ){
        theTransitionContent.removeFromParent();
        theTransitionContent = null;
    }

    if( theMode < MODE_FORGE ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionContent = loadForge();
        theContentNodeR.addChild(theTransitionContent.node);
        isFlying = true;
    }
    else if( theMode > MODE_FORGE ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionContent = loadForge();
        theContentNodeL.addChild(theTransitionContent.node);
        isFlying = true;
    }
    else{
        //just load
        theTransitionContent = null;
        theContent = loadForge();
        theContentNode.addChild(theContent.node);
        isFlying = false;
    }

    theMode = MODE_FORGE;
    setModeTag(theMode);

    ForgeArgs = null;
}

function onStartForge(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    switch(ableToForge){
        case -1: libUIKit.showAlert("请选择装备"); break;
        case 0:{
            if( EnoughMtrls ){
                if( ForgeArgs != null ){
                    if( checkGold(goldCost) ){
                        libUIKit.waitRPC(Request_InventoryUseItem, ForgeArgs, function(rsp){
                            if( rsp.RET == RET_OK ){
                                pushForgeAnimation("effect-forge3.ccbi", {nodeItem:theForgeItem}, function(){
                                    libUIKit.showAlert("升阶成功！", function(){
                                        EnoughMtrls = false;
                                    }, theLayer);
                                    //execute result
                                    if( rsp.RES != null ){
                                        engine.event.processResponses(rsp.RES);
                                        var slot = EquipSlot_MainHand;
                                        switch(TouchId){
                                            case 1: slot = EquipSlot_MainHand; break;
                                            case 2: slot = EquipSlot_SecondHand; break;
                                            case 3: slot = EquipSlot_Chest; break;
                                            case 4: slot = EquipSlot_Legs; break;
                                            case 5: slot = EquipSlot_Finger; break;
                                            case 6: slot = EquipSlot_Neck; break;
                                        }
                                        var newItem = engine.user.actor.queryArmor(slot);
                                        if( newItem != null){
                                            theContent.ui["equip"+TouchId].setItemSmall(newItem);
                                            setForgeEquip(newItem);
                                        }
                                    }
                                }, theLayer);
                            }
                            else{
                                libUIKit.showErrorMessage(rsp);
                            }
                        }, theLayer);
                    }
                }
            }else{
                libUIKit.showAlert("材料不足！");
            }
        }break;
        case 1:{
            libUIKit.showAlert("装备已是最高品质！");
        }break;
        case 2:{
            libUIKit.showAlert("装备等级不足\n无法升阶！");
        }break;
    }

}

//--- 合成 ---

function setSynthesizeStone(sto1Class, sto2Class){
    theContent.owner.nodeFrom.removeAllChildren();
    theContent.owner.nodeTo.removeAllChildren();
    theContent.owner.labCost.setString("");
    if( sto1Class != null && sto2Class != null){
        var stone1Count = engine.user.inventory.countItem(sto1Class.classId);
        var stone1Sid = engine.user.inventory.getServerId(sto1Class.classId);
        var costInfo = libTable.queryTable(TABLE_COST, sto2Class.synthesizeID);
        var stoneCost, moneyCost;
        theForgeItem = engine.user.inventory.getItem(stone1Sid);
        for( var k in costInfo.material){
            switch (costInfo.material[k].type) {
                case 0:{
                    stoneCost = costInfo.material[k].count;
                }break;
                case 1:{
                    moneyCost = costInfo.material[k].count;
                }break;
                default: break;
            }
        }
        theContent.owner.nodeFrom.addChild(cc.Sprite.create("stone"+SynthesizeStoneFrom+".png"));
        theContent.owner.nodeTo.addChild(cc.Sprite.create("stone"+(SynthesizeStoneFrom+1)+".png"));
        theContent.owner.nameFrom.setString(sto1Class.label);
        theContent.owner.nameTo.setString(sto2Class.label);
        SynthesizeArgs = {};
        SynthesizeArgs.cid = sto2Class.classId;
        if(SynthesizeSlider != null){
            theContent.owner.nodeX.removeChildByTag(10);
        }
        if( stone1Count < stoneCost){
            SynthesizeSlider = libGadget.UISlider.create({
                start: theContent.owner.nodeStart.getPosition(),
                end: theContent.owner.nodeEnd.getPosition(),
                sthumb: "forge4-common-btn.png",
                min: 0,
                max: 0,
                def: 0,
                callback: function(val){
                    var count = Math.floor(val);
                    theContent.owner.labelCount.setString(count);
                    theContent.owner.labCost.setString("数量不足");
                    theContent.ui.cost.setPrice({
                        gold: 0
                    })
                }
            });
            EnoughMtrls = false;
        }
        else{
            SynthesizeSlider = libGadget.UISlider.create({
                start: theContent.owner.nodeStart.getPosition(),
                end: theContent.owner.nodeEnd.getPosition(),
                sthumb: "forge4-common-btn.png",
                min: 1,
                max: Math.floor(stone1Count/stoneCost),
                def: 1,
                callback: function(val){
                    var count = Math.floor(val);
                    theContent.owner.labelCount.setString(count);
                    theContent.owner.labCost.setString("需要"+(count*stoneCost)+"颗");
                    theContent.ui.cost.setPrice({
                        gold: moneyCost * count
                    });
                    goldCost = moneyCost * count;
                    SynthesizeArgs.opn = ITMOP_SYNTHESIZE;
                    SynthesizeArgs.opc = count;
                }
            });
            EnoughMtrls = true;
        }
        theContent.owner.nodeX.addChild(SynthesizeSlider, null, 10);
    }
}

function onSynthesizeStone(sender){
    if( isFlying ) return;
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    TouchId = sender.getTag();
    upItem(TouchId);
    SynthesizeStoneFrom = TouchId - 1;
    if( SynthesizeStoneFrom > 0){
        var sto1Class = libTable.queryTable(TABLE_ITEM, EnhanceStoneCid[SynthesizeStoneFrom-1]);
        var sto2Class = libTable.queryTable(TABLE_ITEM, EnhanceStoneCid[SynthesizeStoneFrom]);
        setSynthesizeStone(sto1Class, sto2Class);
    }
//    else{
//        if(SynthesizeSlider != null){
//            theContent.owner.nodeX.removeChildByTag(10);
//        }
//        theContent.owner.nodeFrom.addChild(cc.Sprite.create("wenhao.png"));
//        theContent.owner.nodeTo.addChild(cc.Sprite.create("stone1.png"));
//        theContent.owner.nameFrom.setString("初级强化石");
//        theContent.owner.labCost.setString("不需要合成");
//        theContent.owner.nameTo.setString(libTable.queryTable(TABLE_ITEM, EnhanceStoneCid[0]).label);
//        EnoughMtrls = false;
//    }
}

function loadSynthesize(){
    var ret = {};
    ret.owner = {};
    ret.owner.onSynthesizeStone = onSynthesizeStone;
    ret.owner.onStartSynthesize = onStartSynthesize;

    var bind = {
//        item1: {
//            ui: "UIItem",
//            id: "stone1",
//            def: "stonebg.png"
//        },
        item2: {
            ui: "UIItem",
            id: "stone2",
            def: "stonebg.png"
        },
        item3: {
            ui: "UIItem",
            id: "stone3",
            def: "stonebg.png"
        },
        item4: {
            ui: "UIItem",
            id: "stone4",
            def: "stonebg.png"
        },
        item5: {
            ui: "UIItem",
            id: "stone5",
            def: "stonebg.png"
        },
        nodeFrom: {
            ui: "UIItem",
            id: "stoFrom",
            def: "wenhao.png"
        },
        nodeTo: {
            ui: "UIItem",
            id: "stoTo",
            def: "wenhao.png"
        },
        nodeCost: {
            ui: "UIPrice",
            id: "cost"
        }
    };
    var node = libUIC.loadUI(ret, "ui-forge4x.ccbi", bind);
    ret.node = node;
    engine.ui.regMenu(ret.owner.menuRoot);

    for( var i=2; i<6; i++){
        var dummyStone = new libItem.Item({
            cid: EnhanceStoneCid[i-1]
        });
        ret.ui["stone"+i].setItemSmall(dummyStone);
    }
    return ret;
}

function onSynthesize(sender){
    if( !engine.user.player.checkUnlock("extract") ){
        return;
    }

    chosenItem = null;
    if( isFlying ) return;

    //clean transitionContent
    if( theTransitionContent != null ){
        theTransitionContent.removeFromParent();
        theTransitionContent = null;
    }

    if( theMode < MODE_SYNTHESIZE ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionContent = loadSynthesize();
        theContentNodeR.addChild(theTransitionContent.node);
        isFlying = true;
    }
    else if( theMode > MODE_SYNTHESIZE ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionContent = loadSynthesize();
        theContentNodeL.addChild(theTransitionContent.node);
        isFlying = true;
    }
    else{
        //just load
        theTransitionContent = null;
        theContent = loadSynthesize();
        theContentNode.addChild(theContent.node);
        isFlying = false;
    }

    theMode = MODE_SYNTHESIZE;
    setModeTag(theMode);

    SynthesizeArgs = null;
}

function onStartSynthesize(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( EnoughMtrls ){
        if (SynthesizeArgs != null){
            if ( checkGold(goldCost) ){
                libUIKit.waitRPC(Request_InventoryUseItem, SynthesizeArgs, function(rsp){
                    if ( rsp.RET == RET_OK ){
                        var dummyStone = new libItem.Item({cid: EnhanceStoneCid[SynthesizeStoneFrom-1]});
                        pushForgeAnimation("effect-forge.ccbi", {nodeItem:dummyStone}, function(){
                            libUIKit.showAlert("合成成功", function(){
                                EnoughMtrls = false;
                            }, theLayer);
                            if ( rsp.RES != null){
                                engine.event.processResponses(rsp.RES);
                                var sto1Class = libTable.queryTable(TABLE_ITEM, EnhanceStoneCid[SynthesizeStoneFrom-1]);
                                var sto2Class = libTable.queryTable(TABLE_ITEM, EnhanceStoneCid[SynthesizeStoneFrom]);
                                setSynthesizeStone(sto1Class, sto2Class);
                            }
                        }, theLayer);
                    }
                    else{
                        libUIKit.showErrorMessage(rsp);
                    }
                }, theLayer);
            }
        }else{
            libUIKit.showAlert("无法合成强化石");
        }
    }else{
        libUIKit.showAlert("无法合成强化石");
    }
}

//-------------------------------------------//
function onUIAnimationCompleted(name){
    isFlying = false;
    switch(theMode){
        case MODE_EXIT:{
            var main = loadModule("sceneMain.js");
            engine.ui.newScene(main.scene());
        }break;
        case MODE_UPGRADE:
        case MODE_ENHANCE:
        case MODE_FORGE:
        case MODE_SYNTHESIZE:
        {
            if( theTransitionContent != null ){
                //move transition to normal
                if( theContent.owner.menuRoot != null ){
                    engine.ui.unregMenu(theContent.owner.menuRoot);
                }
                theContentNode.removeAllChildren();
                theTransitionContent.node.retain();
                theTransitionContent.node.removeFromParent();
                theContentNode.addChild(theTransitionContent.node);
                theTransitionContent.node.release();
                theContent = theTransitionContent;
                theTransitionContent = null;
            }
        }break;
    }
}

function onNotify(ntf){
    switch(ntf.NTF){
        case Message_UpdateTreasure:
        {
            theLayer.ui.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            theLayer.ui.treasureDisplayL.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            theLayer.ui.treasureDisplayR.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            return false;
        }
        case Message_UpdateItem:
        {
            switch(theMode){
                case MODE_ENHANCE:{
                    setEnhanceEquip(theForgeItem);
                }break;
                case MODE_SYNTHESIZE:{
                    // TODO: ?
                }break;
                case MODE_FORGE:{
                    setForgeEquip(theForgeItem);
                }break;
            }
            return false;
        }
    }
    return false;
}

function onEnter(){
    theLayer = this;
    engine.user.inventory.syncArmors();
    theMode = MODE_UPGRADE;

    this.owner = {};
    this.owner.onClose = onClose;
    this.owner.onUpgrade = onUpgrade;
    this.owner.onEnhance = onEnhance;
    this.owner.onForge = onForge;
    this.owner.onSynthesize = onSynthesize;

    var node = libUIC.loadUI(this, "sceneForge.ccbi", {
        nodeTreasure: {
            ui: "UITreasure",
            id: "treasureDisplay"
        },
        nodeTreasureL: {
            ui: "UITreasure",
            id: "treasureDisplayL"
        },
        nodeTreasureR: {
            ui: "UITreasure",
            id: "treasureDisplayR"
        }
    });
    this.addChild(node);
    engine.ui.regMenu(this.owner.menuRoot);
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");
    theLayer.node = node;

    //assign values
    theContentNode = this.owner.nodeContent;
    theContentNodeL = this.owner.nodeContentL;
    theContentNodeR = this.owner.nodeContentR;
    theTransitionContent = null;
    //set values
    this.ui.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    this.ui.treasureDisplayL.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    this.ui.treasureDisplayR.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);

    for( var i=0; i<5; i++){
        EnhanceStoneCid[i] = getEnhanceStoneCid(i);
    }
    EnoughMtrls = false;
    onUpgrade();

    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);


}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("forge");
}

function onExit(){
    loadModule("broadcastx.js").instance.close();
}

function scene(){
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onNotify,
        onActivate: onActivate
    };
}

exports.scene = scene;