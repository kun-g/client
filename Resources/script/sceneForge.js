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
var EnhanceStoneLevel = 0;//type 1,2,3,4,5
var EnhanceStoneCost = 0;//quantity
var EnhanceStoneCid = [5];//cid array
var EnhanceStoneSid = 0;//sid
var EnhanceMaxLv = 40;

var MODE_UPGRADE = 0;
var MODE_ENHANCE = 1;
var MODE_FORGE = 2;
var MODE_SYNTHESIZE = 3;
//var MODE_EXTRACT = 3;
var MODE_EXIT = 4;
var theMode = MODE_UPGRADE;

var ENHANCE_ITEM_GAP = UI_ITEM_GAP;

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

function getStoneCid(stoneLv){
    for( var cid=0; ; cid++){
        var item = libTable.queryTable(TABLE_ITEM, cid);
        if( item != null ){
            if( item.stoneLv != null && item.stoneLv == stoneLv){
                return item.classId;
            }
        }
        else return null;
    }
}


//--- 升级 ---
function onStartUpgrade(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( UpgradeArgs != null ){
        libUIKit.waitRPC(Request_InventoryUseItem, UpgradeArgs, function(rsp){
            if( rsp.RET == RET_OK ){
                pushForgeAnimation("effect-forge.ccbi", {nodeItem:theForgeItem}, function(){
                    libUIKit.showAlert("装备升级成功", function(){
                        theContentNode.removeAllChildren();
                        onUpgrade();
                    }, theLayer);

                    //execute result
                    if( rsp.RES != null ){
                        engine.event.processResponses(rsp.RES);
                    }
                }, theLayer);
            }
            else{
                libUIKit.showErrorMessage(rsp);
            }
        }, theLayer);
    }
}

function setUpgradeItem(item){

    if( item != null ){
        item = syncItemData(item);
        var ItemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
    }

    if( item != null && ItemClass.label != null )
    {//set value
        theContent.ui.oldItem.setItem(item);
        theForgeItem = item;

        theContent.owner.oldName.setString(ItemClass.label);
        var srcProperties = {};
        mergeRoleProperties(srcProperties, ItemClass.basic_properties);
        theContent.owner.labOldProperty.setString(propertyString(srcProperties));

        if( ItemClass.upgradeTarget != null )
        {//can upgrade
            var upgradeXp = ItemClass.upgradeXp;
            var upgradeCost = ItemClass.upgradeCost;
            if( upgradeXp == null ){
                upgradeXp = libTable.queryTable(TABLE_UPGRADE, ItemClass.rank).xp;
            }
            if( upgradeCost == null ){
                upgradeCost = libTable.queryTable(TABLE_UPGRADE, ItemClass.rank).cost;
            }
            var targetClass = libTable.queryTable(TABLE_ITEM, ItemClass.upgradeTarget);
            var dummyTarget = new libItem.Item({cid:ItemClass.upgradeTarget});
            theContent.ui.newItem.setItem(dummyTarget);
            theContent.owner.newName.setString(targetClass.label);

            var dstProperties = {};
            mergeRoleProperties(dstProperties, targetClass.basic_properties);
            theContent.owner.labNewProperty.setString(propertyString(dstProperties));
            theContent.ui.cost.setPrice({
                gold: upgradeCost
            });

            var xp = item.Xp;
            if( xp > upgradeXp )
            {
                xp = upgradeXp;
            }

            if( ItemClass.rank != null && ItemClass.rank < engine.user.actor.Level ){
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
            theContent.ui.newItem.setItem(null);
            theContent.owner.newName.setString("");
            theContent.owner.labNewProperty.setString("");
            theContent.ui.cost.setPrice(null);
            theContent.owner.labXp.setString("该装备无法升级");
            theContent.ui.xp.setProgress(0);

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
    }
}

function onUpgradeEquip(sender){
    if( isFlying ) return;
    var id = sender.getTag();
    var slot = EquipSlot_MainHand;
    switch(id){
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
        upItem(id);
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
            id: "oldItem"
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
    var enhance = theForgeItem.Enhance[0].lv;
    if( enhance != null && enhance <= EnhanceMaxLv){
        if( EnhanceArgs != null){
            libUIKit.waitRPC(Request_InventoryUseItem, EnhanceArgs, function(rsp){
                if( rsp.RET == RET_OK || rsp.RET == RET_EnhanceFailed ){
                    if( rsp.RET == RET_OK) {
                        libEffect.attachEffectCCBI(theContent.ui.equip, cc.p(0, 0),
                            "effect-forgeEh.ccbi", libEffect.EFFECTMODE_AUTO);
                    }
                    else{
                        libUIKit.showErrorMessage(rsp);
                    }
                    setEnhanceEquip(theForgeItem);

                    //execute result
                    if( rsp.RES != null ){
                        engine.event.processResponses(rsp.RES);
                    }
                }
                else{
                    libUIKit.showErrorMessage(rsp);
                }
            }, theLayer);
        }
        else{
            libUIKit.showAlert("强化宝石的数量不足");
        }
    }
    else{
        libUIKit.showAlert("该装备无法再强化");
    }

}

function setEnhanceEquip(item){
    if( item != null ){
        item = syncItemData(item);
        var itemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
    }
    if( item != null && itemClass.label != null ){
        theContent.ui.equip.setItem(item);
        theForgeItem = item;
        theContent.owner.labEquipName.setString(itemClass.label);

        //load equip enhance state
        var enhance = 0;
        if( item.Enhance[0] != null && item.Enhance[0].lv != null ){
            enhance = item.Enhance[0].lv;
        }else{
            item.Enhance[0] = {id:null, lv:0};
            enhance = 0;
        }
        var starLv = enhance / 8;
        var barLv = ((enhance == 40)? 8:(enhance%8));
        for(var i=1; i<6; ++i){
            var starName = "ehStar"+i;
            if( i <= starLv){
                theContent.owner[starName].runAction(cc.FadeIn.create(0.3));
            }
            else {
                theContent.owner[starName].setOpacity(0);
            }
        }
        for(var i=1; i<9; ++i){
            var barName = "ehBar"+i;
            if( i <= barLv){
                theContent.owner[barName].runAction(cc.FadeIn.create(0.3));
            }
            else {
                theContent.owner[barName].setOpacity(0);
            }
        }

        //show property
        var properties = {};
        mergeRoleProperties(properties, itemClass.basic_properties);
        theContent.owner.labProperty.setString(propertyString(properties));

        if( EnhanceArgs == null ){
            EnhanceArgs = {};
        }
        EnhanceArgs.sid = item.ServerId;
        EnhanceArgs.opn = ITMOP_ENHANCE;

        setEnhanceStone(itemClass);

    }
    else{
        theContent.ui.equip.setItem(null);
        theContent.owner.labEquipName.setString("请选择装备");
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
    if( itemClass != null ){
        var enhance = (theForgeItem.Enhance[0] != null)? theForgeItem.Enhance[0].lv : 0;
        var enhanceInfo = libTable.queryTable(TABLE_ENHANCE, itemClass.enhanceID);
        if( enhanceInfo != null ){
            var enhanceCost = libTable.queryTable(TABLE_COST, enhanceInfo.costList[enhance]);
            if( enhanceCost != null ){
                for( var k in enhanceCost.material){
                    switch(enhanceCost.material[k].type){
                        case 0: {
                            EnhanceStoneLevel = libTable.queryTable(TABLE_ITEM, enhanceCost.material[k].value).stoneLv;
                            EnhanceStoneCost = enhanceCost.material[k].count;
                            theContent.ui.stone.removeAllChildren();
                            var iconStone = cc.Sprite.create("stone"+EnhanceStoneLevel+".png");
                            theContent.ui.stone.addChild(iconStone);

                            EnhanceStoneSid = engine.user.inventory.getServerId(EnhanceStoneCid[EnhanceStoneLevel-1]);
                            var stoneCount = engine.user.inventory.countItem(EnhanceStoneCid[EnhanceStoneLevel-1]);
                            theContent.owner.labCount.setString(stoneCount+"/"+EnhanceStoneCost);
                            if (stoneCount < EnhanceStoneCost){
                                theContent.owner.labCount.setColor(cc.c3b(255,0,0));
                                theContent.owner.btnPlus.setVisible(true);
                                EnhanceArgs = null;
                            }
                            else {
                                theContent.owner.labCount.setColor(cc.c3b(0,150,0));
                                theContent.owner.btnPlus.setVisible(false);
                            }
                        }break;
                        case 1: {
                            theContent.ui.cost.setPrice({
                                gold: enhanceCost.material[k].count
                            });
                        }break;
                        default: break;
                    }

                }
                return;
            }

        }
        theContent.ui.stone.removeAllChildren();
        theContent.owner.labCount.setString("0/0");
        theContent.owner.labCount.setColor(cc.c3b(33,22,13));
        EnhanceStoneCost = 0;
        EnhanceStoneLevel = 0;
    }
    else{
        theContent.ui.stone.setItem(null);
        theContent.owner.labCount.setString("0/0");
        theContent.owner.labCount.setColor(cc.c3b(33,22,13));
        EnhanceStoneCost = 0;
        EnhanceStoneLevel = 0;
    }
}

function onAddStone(){
    onSynthesize();
}

function onEnhanceEquip(sender){
    if( isFlying ) return;
    var id = sender.getTag();
    var slot = EquipSlot_MainHand;
    switch(id){
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
        upItem(id);
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
        itemStone: {
            ui: "UIItem",
            id: "stone",
            def: "stonebg.png"
        },
        nodeCost: {
            ui: "UIPrice",
            id: "cost"
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
    }

    return ret;
}

function onAddMaterials(sender){

}

function onForgeEquip(sender){
    if( isFlying ) return;
    var id = sender.getTag();
    var slot = EquipSlot_MainHand;
    switch(id){
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
        upItem(id);
        setForgeEquip(forgeEquip);
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
        theForgeItem = item;

        if( ForgeArgs == null ){
            ForgeArgs = {};
        }
        ForgeArgs.sid = item.ServerId;
        ForgeArgs.opn = ITMOP_FORGE;

        loadForgeMaterial(itemClass);
    }
    else {
        theContent.ui.equipTarget.setItem(null);
        theContent.owner.labName.setString("请选择装备");
        if( ForgeArgs != null ){
            delete ForgeArgs.sid;
        }
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
                                theContent.owner["labCount" + i].setColor(cc.c3b(0, 255, 0));
                                theContent.owner["btnAdd" + i].setVisible(false);
                            }
                            else {
                                theContent.owner["labCount" + i].setColor(cc.c3b(255, 0, 0));
                                theContent.owner["btnAdd" + i].setVisible(true);
                            }
                            i++;
                        }
                    }break;
                    case 1:{
                        theContent.ui.cost.setPrice({gold: forgeCost.material[k].count});
                    }break;
                    default: break;
                }
            }
        }
        else{
            for( var i=1; i<7; ++i){
                theContent.ui["mtrl"+i].removeAllChildren();
                theContent.owner["labCount"+i].setString("0/0");
                theContent.owner["labCount"+i].setColor(cc.c3b(192,192,192));
                theContent.owner["btnAdd"+i].setVisible(false);
            }
        }
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
    if( ForgeArgs != null ){
        libUIKit.waitRPC(Request_InventoryUseItem, ForgeArgs, function(rsp){
            if( rsp.RET == RET_OK ){
                pushForgeAnimation("effect-forge3.ccbi", {nodeItem:theForgeItem}, function(){
                    libUIKit.showAlert("升阶成功", function(){
                        theContentNode.removeAllChildren();
                        onForge();
                    }, theLayer);
                    //execute result
                    if( rsp.RES != null ){
                        engine.event.processResponses(rsp.RES);
                    }
                }, theLayer);
            }
            else{
                libUIKit.showErrorMessage(rsp);
            }
        }, theLayer);
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
        var costInfo = libTable.queryTable(TABLE_COST, sto2Class.synthesizeId);
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
        SynthesizeArgs.sid = stone1Sid;
        if(SynthesizeSlider != null){
            theContent.owner.nodeX.removeChild(SynthesizeSlider);
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
        }
        else{
            SynthesizeSlider = libGadget.UISlider.create({
                start: theContent.owner.nodeStart.getPosition(),
                end: theContent.owner.nodeEnd.getPosition(),
                sthumb: "forge4-common-btn.png",
                min: stoneCost,
                max: parseInt(stone1Count/stoneCost),
                def: 1,
                callback: function(val){
                    var count = Math.floor(val);
                    theContent.owner.labelCount.setString(count);
                    theContent.owner.labCost.setString("需要"+(count*stoneCost)+"颗");
                    theContent.ui.cost.setPrice({
                        gold: moneyCost * count
                    });
                    SynthesizeArgs.opn = ITMOP_SYNTHESIZE;
                    SynthesizeArgs.opc = count;
                }
            });
        }
        theContent.owner.nodeX.addChild(SynthesizeSlider);
    }
}

function onSynthesizeStone(sender){
    if( isFlying ) return;
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var id = sender.getTag();
    upItem(id);
    SynthesizeStoneFrom = ( (id == 1)? 1:(id - 1) );
    var sto1Class = libTable.queryTable(TABLE_ITEM, EnhanceStoneCid[SynthesizeStoneFrom-1]);
    var sto2Class = libTable.queryTable(TABLE_ITEM, EnhanceStoneCid[SynthesizeStoneFrom]);
    setSynthesizeStone(sto1Class, sto2Class);
}

function loadSynthesize(){
    var ret = {};
    ret.owner = {};
    ret.owner.onSynthesizeStone = onSynthesizeStone;
    ret.owner.onStartSynthesize = onStartSynthesize;

    var bind = {
        item1: {
            ui: "UIItem",
            id: "stone1",
            def: "stonebg.png"
        },
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

    for( var i=1; i<6; i++){
        var dummyStone = new libItem.Item({
            cid: EnhanceStoneCid[i-1]
        });
        ret.ui["stone"+i].setItemSmall(dummyStone);
    }

    SynthesizeSlider = libGadget.UISlider.create({
        start: ret.owner.nodeStart.getPosition(),
        end: ret.owner.nodeEnd.getPosition(),
        sthumb: "forge4-common-btn.png",
        min: 0,
        max: 0,
        def: 0
    });
    ret.owner.nodeX.addChild(SynthesizeSlider);
    return ret;
}

function onSynthesize(sender){
    if( !engine.user.player.checkUnlock("synthesize") ){
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
    if (SynthesizeArgs != null){
        libUIKit.waitRPC(Request_InventoryUseItem, SynthesizeArgs, function(rsp){
            if ( rsp.RET == RET_OK ){
                pushForgeAnimation("effect-forge.ccbi", {nodeItem:theForgeItem}, function(){
                    libUIKit.showAlert("合成成功", function(){
                        onSynthesize();
                    }, theLayer);
                    if ( rsp.RES != null){
                        engine.event.processResponses(rsp.RES);
                    }
                }, theLayer);
            }
            else{
                libUIKit.showErrorMessage(rsp);
            }
        }, theLayer);
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
                    loadEnhance(theContent);
                    setEnhanceEquip(theContent.ui.equip.getItem());
                }break;
                case MODE_SYNTHESIZE:{
                    // TODO: ?
                }break;
                case MODE_FORGE:{
                    // TODO: ?
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
        EnhanceStoneCid[i] = getStoneCid(i+1);
    }

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