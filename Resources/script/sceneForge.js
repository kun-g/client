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
var EnhanceStoneCost = 0;

var MODE_UPGRADE = 0;
var MODE_ENHANCE = 1;
var MODE_FORGE = 2;
var MODE_EXTRACT = 3;
var MODE_EXIT = 4;
var theMode = MODE_UPGRADE;

var ENHANCE_ITEM_GAP = UI_ITEM_GAP;

//enhance variables
var EnhanceEquipList;
var EnhanceEquipLayer;
var EnhanceEquipTouch;

var theSSLayer;
var theSSList;
var theSSTouch;

//forge variables
var ForgeArgs = null;
var ForgeCost = 0;
var theRecipeLabel;

//extract variables
var ExtractArgs = null;
var ExtractSlider;

var theForgeItem;
var theForgeAnimationNode;

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
    if( mode == MODE_EXTRACT ){
        theLayer.owner.btnExtract.setNormalSpriteFrame(sfc.getSpriteFrame("forge4-common-tabtl1.png"));
        theLayer.owner.btnExtract.setSelectedSpriteFrame(sfc.getSpriteFrame("forge4-common-tabtl2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("forge4-common-title.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("forge4-common-title.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("forge4-common-title.png"));
        theLayer.owner.btnExtract.setEnabled(false);
    }
    else{
        theLayer.owner.btnExtract.setNormalSpriteFrame(sfc.getSpriteFrame("forge4-common-tabtl2.png"));
        theLayer.owner.btnExtract.setSelectedSpriteFrame(sfc.getSpriteFrame("forge4-common-tabtl1.png"));
        theLayer.owner.btnExtract.setEnabled(true);
    }
}

function onStartUpgrade(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( UpgradeArgs != null ){
        libUIKit.waitRPC(Request_InventoryUseItem, UpgradeArgs, function(rsp){
            if( rsp.RET == RET_OK ){
                pushForgeAnimation("effect-forge.ccbi", {nodeItem:theForgeItem}, function(){
                    libUIKit.showAlert("装备升级成功", function(){
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

function onStartEnhance(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( EnhanceArgs != null
        && EnhanceArgs.sid != null
        && EnhanceArgs.sto != null ){
        //decide which sto should be used
        var enoughStone = false;
        var stoneId = -1;
        for(var k in EnhanceArgs.sto.Items){
            var item = EnhanceArgs.sto.Items[k];
            if( item.StackCount >= EnhanceStoneCost ){
                EnhanceArgs.sto = item.ServerId;
                stoneId = item.ClassId;
                enoughStone = true;
                break;
            }
        }
        //send RPC request
        if( enoughStone ){
            var theEnhanceStone = new libItem.Item({
                cid: stoneId,
                stc: EnhanceStoneCost
            });
            libUIKit.waitRPC(Request_InventoryUseItem, EnhanceArgs, function(rsp){
                if( rsp.RET == RET_OK || rsp.RET == RET_EnhanceFailed ){

                    pushForgeAnimation("effect-forge2.ccbi", {
                        nodeItem:theForgeItem,
                        nodeItem2: theEnhanceStone,
                        nodeItem3: theEnhanceStone
                    }, function(){
                        if( rsp.RET == RET_OK ){
                            libUIKit.showAlert("装备强化成功", function(){
                            }, theLayer);

                            //统计
                            tdga.itemUse(theContent.owner.labStoneName.getString(), EnhanceStoneCost);
                        }
                        else{
                            libUIKit.showErrorMessage(rsp);
                        }

                        setEnhanceStone(null);
                        loadEnhanceItems(theContent);

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
        else{
            libUIKit.showAlert("强化宝石的数量不足");
        }
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
    cc.AudioEngine.getInstance().playEffect("card2.mp3");

    var id = sender.getTag();
    var slot = EquipSlot_MainHand;
    switch(id)
    {
        case 1: slot = EquipSlot_MainHand; break;
        case 2: slot = EquipSlot_SecondHand; break;
        case 3: slot = EquipSlot_Chest; break;
        case 4: slot = EquipSlot_Legs; break;
    }
    var oldItem = engine.user.actor.queryArmor(slot);
    setUpgradeItem(oldItem);
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theMode = MODE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function loadUpgrade(){
    var ret = {};
    ret.owner = {};
    ret.owner.onUpgradeEquip = onUpgradeEquip;
    ret.owner.onStartUpgrade = onStartUpgrade;

    var node = libUIC.loadUI(ret, "ui-forge.ccbi", {
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
    });
    ret.node = node;
    engine.ui.regMenu(ret.owner.menuRoot);

    //set values
    ret.ui.equip1.setItem(engine.user.actor.queryArmor(EquipSlot_MainHand));
    ret.ui.equip2.setItem(engine.user.actor.queryArmor(EquipSlot_SecondHand));
    ret.ui.equip3.setItem(engine.user.actor.queryArmor(EquipSlot_Chest));
    ret.ui.equip4.setItem(engine.user.actor.queryArmor(EquipSlot_Legs));
    ret.ui.xp.setProgress(0);

    return ret;
}

function onUpgrade(sender){
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
}

function calcPosId(lpos)
{
    if( lpos.y < 0 || lpos.y > UI_ITEM_FRAME || lpos.x < 0 ){
        return -1;
    }
    var PX = Math.floor(lpos.x/(UI_ITEM_FRAME+ENHANCE_ITEM_GAP));
    var off = lpos.x - PX*(UI_ITEM_FRAME+ENHANCE_ITEM_GAP);
    if( off < ENHANCE_ITEM_GAP ){
        return -1;
    }
    else{
        return PX;
    }
}

function onEquipTouchBegan(touch, event){
    EnhanceEquipTouch = touch.getLocation();
    var lpos = EnhanceEquipLayer.convertToNodeSpace(EnhanceEquipTouch);
    var grid = calcPosId(lpos);
    if( grid >= 0 && grid < EnhanceEquipList.length ){
        return true;
    }
    else{
        return false;
    }
}

function onEquipTouchMoved(touch, event){}

function onEquipTouchEnded(touch, event){
    var pos = touch.getLocation();
    var dis = cc.pSub(pos, EnhanceEquipTouch);
    if( cc.pLengthSQ(dis) < CLICK_RANGESQ ){
        var lpos = EnhanceEquipLayer.convertToNodeSpace(EnhanceEquipTouch);
        var grid = calcPosId(lpos);
        if( grid >= 0 ){
            if( grid < EnhanceEquipList.length ){
                cc.AudioEngine.getInstance().playEffect("card2.mp3");
                setEnhanceEquip(EnhanceEquipList[grid]);
            }
        }
    }
}

function onEquipTouchCancelled(touch, event){
    onEquipTouchEnded(touch, event);
}

function onSSTouchBegan(touch, event){
    theSSTouch = touch.getLocation();
    if( theSSLayer == null ) return false;
    var lpos = theSSLayer.convertToNodeSpace(theSSTouch);
    var grid = calcPosId(lpos);
    if( grid >= 0 && grid < theSSList.length ){
        return true;
    }
    else{
        return false;
    }
}

function onSSTouchMoved(touch, event){}

function onSSTouchEnded(touch, event){
    var pos = touch.getLocation();
    var dis = cc.pSub(pos, theSSTouch);
    if( cc.pLengthSQ(dis) < CLICK_RANGESQ ){
        var lpos = theSSLayer.convertToNodeSpace(theSSTouch);
        var grid = calcPosId(lpos);
        if( grid >= 0 ){
            if( grid < theSSList.length ){
                cc.AudioEngine.getInstance().playEffect("card2.mp3");
                if( theMode == MODE_ENHANCE ){
                    setEnhanceStone(theSSList[grid]);
                }
                else if( theMode == MODE_FORGE ){
                    setForgeRecipe(theSSList[grid]);
                }
            }
        }
    }
}

function onSSTouchCancelled(touch, event){
    onSSTouchEnded(touch, event);
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
        for(var i=0; i<4; ++i){
            var enhance = null;
            if( item.Enhance != null ){
                enhance = item.Enhance[i];
            }
            var keyName = "nodeQh"+(i+1);
            var keyLevel = "labEhValue"+(i+1);
            theContent.owner[keyName].removeAllChildren();
            if( enhance != null ){
                var EnhanceClass = libTable.queryTable(TABLE_ENHANCE, enhance.id);
                var icon = cc.Sprite.create(EnhanceClass.icon);
                theContent.owner[keyName].addChild(icon);
                theContent.owner[keyLevel].setString("Lv."+(enhance.lv+1));
            }
            else
            {
                theContent.owner[keyLevel].setString("");
            }
        }

        if( EnhanceArgs == null ){
            EnhanceArgs = {};
        }
        EnhanceArgs.sid = item.ServerId;
        EnhanceArgs.opn = ITMOP_ENHANCE;

        //calc EnhanceStoneCost
        var maxLevel = item.getMaxEnhanceLevel();
        EnhanceStoneCost = maxLevel*2;
        if( EnhanceStoneCost < 1 ){
            EnhanceStoneCost = 1;
        }

        //calc enhance cost
        theContent.ui.cost.setPrice({
            gold: 200*EnhanceStoneCost
        });

        //update stone cost
        if( EnhanceArgs.sto != null ){
            theContent.ui.stone.setStackCount(EnhanceStoneCost);
            if( EnhanceArgs.sto.StackCount >= EnhanceStoneCost ){
                theContent.ui.stone.setStackColor(cc.c3b(0, 255, 0));
            }
            else{
                theContent.ui.stone.setStackColor(cc.c3b(255, 0, 0));
            }
        }
        else{
            theContent.ui.stone.setStackColor(cc.c3b(255, 255, 255));
        }
    }
    else{
        theContent.ui.equip.setItem(null);
        theContent.owner.labEquipName.setString("");
        //load equip enhance state
        for(var i=0; i<4; ++i){
            var keyName = "nodeQh"+(i+1);
            var keyLevel = "labEhValue"+(i+1);
            theContent.owner[keyName].removeAllChildren();
            theContent.owner[keyLevel].setString("");
        }

        if( EnhanceArgs != null ){
            delete EnhanceArgs.sid;
        }

        EnhanceStoneCost = 0;
    }

    //update stone number
    if( EnhanceArgs != null
        && EnhanceArgs.sto != null ){
        setEnhanceStone(EnhanceArgs.sto);
    }
}

function setEnhanceStone(info){
    if( info != null ){
        var dummyItem =  new libItem.Item({
            cid: info.ClassId,
            stc: info.StackCount
        });
        debug("** info = "+JSON.stringify(info, null, "\t"));
        theContent.ui.stone.setItem(dummyItem);
        var StoneClass = libTable.queryTable(TABLE_ITEM, info.ClassId);
        theContent.owner.labStoneName.setString(StoneClass.label);
        theContent.owner.labStoneDesc.setString(StoneClass.description);

        if( EnhanceArgs == null ){
            EnhanceArgs = {};
        }
        EnhanceArgs.sto = info;

        //update stone cost
        if( EnhanceStoneCost > 0 ){
            theContent.ui.stone.setStackCount(EnhanceStoneCost);
            if( info.StackCount >= EnhanceStoneCost ){
                theContent.ui.stone.setStackColor(cc.c3b(0, 255, 0));
            }
            else{
                theContent.ui.stone.setStackColor(cc.c3b(255, 0, 0));
            }
        }
        else{
            theContent.ui.stone.setStackColor(cc.c3b(255, 255, 255));
        }
    }
    else{
        theContent.ui.stone.setItem(null);
        theContent.owner.labStoneName.setString("");
        theContent.owner.labStoneDesc.setString("");

        if( EnhanceArgs != null ){
            delete EnhanceArgs.sto;
        }
    }
}

function loadEnhanceItems(content){
    //load equip list
    content.ui.equipList.removeAllChildren();
    EnhanceEquipList = [];
    var theEquipLayer = cc.Layer.create();
    EnhanceEquipLayer = theEquipLayer;
    theEquipLayer.onTouchBegan = onEquipTouchBegan;
    theEquipLayer.onTouchMoved = onEquipTouchMoved;
    theEquipLayer.onTouchEnded = onEquipTouchEnded;
    theEquipLayer.onTouchCancelled = onEquipTouchCancelled;
    theEquipLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theEquipLayer.setTouchPriority(2);
    theEquipLayer.setTouchEnabled(true);
    var equipSize = cc.size(0, content.ui.equipList.getViewSize().height);
    //load all six items
    var ArmorList = [
        {
            slot: EquipSlot_MainHand,
            def: "equipmentbg1.png"
        },
        {
            slot: EquipSlot_SecondHand,
            def: "equipmentbg2.png"
        },
        {
            slot: EquipSlot_Chest,
            def: "equipmentbg3.png"
        },
        {
            slot: EquipSlot_Legs,
            def: "equipmentbg4.png"
        },
        {
            slot: EquipSlot_Finger,
            def: "equipmentbg5.png"
        },
        {
            slot: EquipSlot_Neck,
            def: "equipmentbg6.png"
        }
    ];
    for(var k in ArmorList){
        var NK = Number(k);
        var armor = ArmorList[k];
        var item = engine.user.actor.queryArmor(armor.slot);
        var icon = libItem.UIItem.create(item, false, armor.def);
        icon.showFrame();
        icon.setPosition(cc.p(UI_ITEM_FRAME/2+NK*(UI_ITEM_FRAME+ENHANCE_ITEM_GAP), UI_ITEM_FRAME/2));
        theEquipLayer.addChild(icon);
        equipSize.width += UI_ITEM_FRAME+ENHANCE_ITEM_GAP;
        EnhanceEquipList.push(item);
    }
    theEquipLayer.setContentSize(equipSize);
    content.ui.equipList.setContainer(theEquipLayer);

    //load stone list
    content.ui.stoneList.removeAllChildren();
    var theStoneLayer = cc.Layer.create();
    theSSLayer = theStoneLayer;
    theStoneLayer.onTouchBegan = onSSTouchBegan;
    theStoneLayer.onTouchMoved = onSSTouchMoved;
    theStoneLayer.onTouchEnded = onSSTouchEnded;
    theStoneLayer.onTouchCancelled = onSSTouchCancelled;
    theStoneLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theStoneLayer.setTouchPriority(1);
    theStoneLayer.setTouchEnabled(true);

    //load stone list
    theSSList = [];
    var inventory = engine.user.inventory.getItems();
    for(var k in inventory){
        var item = inventory[k];
        var itemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
        if( itemClass.category == ITEM_GEM ){
            var exist = false;
            for(var m in theSSList){
                var info = theSSList[m];
                if( info.ClassId == item.ClassId ){
                    info.StackCount += item.StackCount;
                    info.Items.push(item);
                    exist = true;
                    break;
                }
            }
            if( !exist ){
                theSSList.push({
                    ClassId: item.ClassId,
                    StackCount: item.StackCount,
                    Items: [item]
                });
            }
        }
    }
    //sort stone list
    for(var k in theSSList){
        var info = theSSList[k];
        info.Items = info.Items.sort(function(a, b){
            return a.StackCount - b.StackCount;
        });
    }
    //set stone list
    var stoneSize = cc.size(0, content.ui.stoneList.getViewSize().height);
    if( theSSList.length > 0 ){
        for(var k in theSSList){
            var NK = Number(k);
            var info = theSSList[k];
            var dummyItem = new libItem.Item({
                cid: info.ClassId,
                stc: info.StackCount
            });
            var icon = libItem.UIItem.create(dummyItem, false);
            icon.setPosition(cc.p(UI_ITEM_FRAME/2+NK*(UI_ITEM_FRAME+ENHANCE_ITEM_GAP), UI_ITEM_FRAME/2));
            icon.showFrame();
            theStoneLayer.addChild(icon);
            stoneSize.width += UI_ITEM_FRAME+ENHANCE_ITEM_GAP;
        }
    }
    else{
        var label = cc.LabelTTF.create("暂时没有可以用来强化的宝石", UI_FONT, UI_SIZE_XL);
        label.setAnchorPoint(cc.p(0.5 ,0.5));
        var viewSize = content.ui.stoneList.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, viewSize.height/2));
        theStoneLayer.addChild(label);
    }
    theStoneLayer.setContentSize(stoneSize);
    content.ui.stoneList.setContainer(theStoneLayer);

    EnhanceStoneCost = 0;
}

function loadEnhance(){
    ret = {};
    ret.owner = {};
    ret.owner.onStartEnhance = onStartEnhance;

    var node = libUIC.loadUI(ret, "ui-forge2.ccbi", {
        item1: {
            ui: "UIItem",
            id: "equip"
        },
        item2: {
            ui: "UIItem",
            id: "stone",
            def: "stonebg.png"
        },
        nodeCost: {
            ui: "UIPrice",
            id: "cost"
        },
        nodeItem1: {
            ui: "UIScrollView",
            id: "equipList",
            dir: cc.SCROLLVIEW_DIRECTION_HORIZONTAL
        },
        nodeItem2: {
            ui: "UIScrollView",
            id: "stoneList",
            dir: cc.SCROLLVIEW_DIRECTION_HORIZONTAL
        }
    });
    ret.node = node;
    engine.ui.regMenu(ret.owner.menuRoot);

    return ret;
}

function onEnhance(sender){
    if( !engine.user.player.checkUnlock("enhance") ){
        return;
    }

    if( isFlying ) return;
    theSSLayer = null;

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
        loadEnhanceItems(theTransitionContent);
        isFlying = true;
    }
    else if( theMode > MODE_ENHANCE ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionContent = loadEnhance();
        theContentNodeL.addChild(theTransitionContent.node);
        loadEnhanceItems(theTransitionContent);
        isFlying = true;
    }
    else{
        //just load
        theTransitionContent = null;
        theContent = loadEnhance();
        theContentNode.addChild(theContent.node);
        loadEnhanceItems(theContent);
        isFlying = false;
    }

    theMode = MODE_ENHANCE;
    setModeTag(theMode);

    EnhanceArgs = null;
}

//--- 锻造 ---
function loadForge(){
    var ret = {};
    ret.owner = {};
    ret.owner.onForgeIngredient = onForgeIngredient;
    ret.owner.onStartForge = onStartForge;

    var node = libUIC.loadUI(ret, "ui-forge3.ccbi", {
        itemTarget: {
            ui: "UIItem",
            id: "target",
            def: "wenhao.png"
        },
        item1: {
            ui: "UIItem",
            id: "ingredient1",
            def: "wenhao.png"
        },
        item2: {
            ui: "UIItem",
            id: "ingredient2",
            def: "wenhao.png"
        },
        item3: {
            ui: "UIItem",
            id: "ingredient3",
            def: "wenhao.png"
        },
        item4: {
            ui: "UIItem",
            id: "ingredient4",
            def: "wenhao.png"
        },
        nodeCost: {
            ui: "UIPrice",
            id: "cost"
        },
        nodeItem2: {
            ui: "UIScrollView",
            id: "recipeList",
            dir: cc.SCROLLVIEW_DIRECTION_HORIZONTAL
        }
    });
    ret.node = node;
    engine.ui.regMenu(ret.owner.menuRoot);

    return ret;
}

function onForge(sender){
    if( !engine.user.player.checkUnlock("forge") ){
        return;
    }

    if( isFlying ) return;
    theSSLayer = null;

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
        loadForgeItems(theTransitionContent);
        isFlying = true;
    }
    else if( theMode > MODE_FORGE ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionContent = loadForge();
        theContentNodeL.addChild(theTransitionContent.node);
        loadForgeItems(theTransitionContent);
        isFlying = true;
    }
    else{
        //just load
        theTransitionContent = null;
        theContent = loadForge();
        theContentNode.addChild(theContent.node);
        loadForgeItems(theContent);
        isFlying = false;
    }

    theMode = MODE_FORGE;
    setModeTag(theMode);

    ForgeArgs = null;
}

var INGREDIENTS = [558, 559, 560, 561];
var INGREDIENTICON = [
    "forge3-common-piece1.png",
    "forge3-common-piece2.png",
    "forge3-common-piece3.png",
    "forge3-common-piece4.png"
];

function loadForgeItems(content){
    //set ingredients
    for(var k in INGREDIENTS){
        var val = Number(k)+1;
        var ctr = "ingredient"+val;
        var cnt = engine.user.inventory.countItem(INGREDIENTS[k]);
        if( cnt > 0 ){
            var dummyItem = new libItem.Item({
                cid: INGREDIENTS[k],
                stc: cnt
            });
            content.ui[ctr].setItem(dummyItem);
        }
        else{
            content.ui[ctr].setItem(null);
        }
    }
    //clear ingredients
    //content.ui.recipeList.removeAllChildren();
    if( theSSLayer != null ){
        theSSLayer.removeAllChildren();
    }
}

function onForgeIngredient(sender){
    var id = sender.getTag();
    var cid = INGREDIENTS[id-1];
    //load recipes using this ingredient
    var ForgeRecipeList = {};
    for(var k in engine.user.inventory.Items ){
        var item = engine.user.inventory.Items[k];
        var itemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
        var ingredientCost = 0;
        if( itemClass.category == ITEM_RECIPE ){
            var match = false;
            for(var m in itemClass.recipeIngredient){
                var ing = itemClass.recipeIngredient[m];
                if( ing.item == cid ){
                    match = true;
                    ingredientCost = ing.count;
                    break;
                }
            }
            if( match ){
                if( ForgeRecipeList[item.ClassId] == null ){
                    ForgeRecipeList[item.ClassId] = {
                        ClassId: item.ClassId,
                        StackCount:item.StackCount,
                        ItemClass:itemClass,
                        IngredientIndex: id-1,
                        IngredientCost: ingredientCost,
                        Items:[item.ServerId]
                    };
                }
                else{
                    ForgeRecipeList[item.ClassId].StackCount += item.StackCount;
                    ForgeRecipeList[item.ClassId].Items.push(item.ServerId);
                }
            }
        }
    }
    //sort recipes
    var list = [];
    for(var k in ForgeRecipeList){
        list.push(ForgeRecipeList[k]);
    }
    theSSList = list.sort(function(a, b){
        var va = -a.ClassId;
        var ia = engine.user.inventory.getItem(a.Items[0]);
        if( !ia.isAvailable() ){
            va += 100000;
        }
        var vb = -b.ClassId;
        var ib = engine.user.inventory.getItem(b.Items[0]);
        if( !ib.isAvailable() ){
            vb += 100000;
        }
        return va - vb;
    });
    //load recipes
    theContent.ui.recipeList.removeAllChildren();
    var theRecipeLayer = cc.Layer.create();
    theRecipeLabel = null;
    theSSLayer = theRecipeLayer;
    theRecipeLayer.onEnter = function(){debug("onEnter - recipeLayer");};
    theRecipeLayer.onExit = function(){debug("onExit - recipeLayer");};
    theRecipeLayer.onTouchBegan = onSSTouchBegan;
    theRecipeLayer.onTouchMoved = onSSTouchMoved;
    theRecipeLayer.onTouchEnded = onSSTouchEnded;
    theRecipeLayer.onTouchCancelled = onSSTouchCancelled;
    theRecipeLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theRecipeLayer.setTouchPriority(1);
    theRecipeLayer.setTouchEnabled(true);

    var recipeSize = cc.size(0, theContent.ui.recipeList.getViewSize().height);
    if( theSSList.length > 0 ){
        for(var k in theSSList){
            var NK = Number(k);
            var info = theSSList[k];
            var dummyItem = new libItem.Item({
                cid: info.ClassId,
                stc: info.StackCount
            });
            var icon = libItem.UIItem.create(dummyItem, false);
            icon.setPosition(cc.p(UI_ITEM_FRAME/2+NK*(UI_ITEM_FRAME+ENHANCE_ITEM_GAP), UI_ITEM_FRAME/2));
            icon.showFrame();
            icon.setAvailable(dummyItem.isAvailable());
            theRecipeLayer.addChild(icon);
            recipeSize.width += UI_ITEM_FRAME+ENHANCE_ITEM_GAP;
        }
    }
    else{
        var label = cc.LabelTTF.create("暂时没有匹配的图纸", UI_FONT, UI_SIZE_XL);
        theRecipeLabel = label;
        label.setAnchorPoint(cc.p(0.5 ,0.5));
        var viewSize = theContent.ui.recipeList.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, viewSize.height/2));
        theRecipeLayer.addChild(label);
    }
    theRecipeLayer.setContentSize(recipeSize);
    theContent.ui.recipeList.setContainer(theRecipeLayer);

    ForgeCost = 0;
}

function setForgeRecipe(info){
    var targetItem = new libItem.Item({
        cid: info.ItemClass.recipeTarget
    });
    theForgeItem = targetItem;
    var targetClass = libTable.queryTable(TABLE_ITEM, info.ItemClass.recipeTarget);
    theContent.ui.target.setItem(targetItem);
    theContent.owner.labName.setString(targetClass.label);
    var targetProperties = {};
    mergeRoleProperties(targetProperties, targetClass.basic_properties);
    theContent.owner.labProperty.setString(propertyString(targetProperties));

    ForgeCost = info.ItemClass.recipeCost;
    theContent.ui.cost.setPrice({
        gold: ForgeCost
    });

    //类型
    var strType = EquipSlotDesc[targetClass.subcategory];
    if( targetClass.classLimit != null ){
        strType += "  职业限定：";
        var flag = false;
        for(var k in targetClass.classLimit){
            if(flag){
                strType += "，";
            }
            var roleClassId = targetClass.classLimit[k];
            var roleClass = libTable.queryTable(TABLE_ROLE, roleClassId);
            strType += roleClass.className;
        }
    }
    theContent.owner.labClass.setString(strType);

    if( targetClass.rank != null ){
        theContent.owner.labRank.setString(targetClass.rank+"级");
    }

    //update forge cost
    theContent.owner.nodePiece.removeAllChildren();
    var ingicon = cc.Sprite.createWithSpriteFrameName(INGREDIENTICON[info.IngredientIndex]);
    ingicon.setAnchorPoint(cc.p(0, 0.5));
    ingicon.setPosition(cc.p(0, 0));
    theContent.owner.nodePiece.addChild(ingicon);
    var ingcost = cc.LabelBMFont.create(info.IngredientCost, "font1.fnt");
    ingcost.setAnchorPoint(cc.p(0, 0.5));
    ingcost.setPosition(cc.p(ingicon.getContentSize().width, 0));
    theContent.owner.nodePiece.addChild(ingcost);

    ForgeArgs = {
        sid: info.Items[0],
        opn: ITMOP_FORGE
    };
}

function onStartForge(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( ForgeArgs != null ){
        libUIKit.waitRPC(Request_InventoryUseItem, ForgeArgs, function(rsp){
            if( rsp.RET == RET_OK ){
                pushForgeAnimation("effect-forge3.ccbi", {nodeItem:theForgeItem}, function(){
                        libUIKit.showAlert("锻造成功", function(){
                    }, theLayer);

                    loadForgeItems(theContent);

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

//--- 提炼 ---
var ExtractStoneId = 0;
var ExtractMinCount = 5;
var ExtractCostRate = 50;

function loadExtractItems(content){
    //load all extract stones
    var stoneCount = engine.user.inventory.countItem(ExtractStoneId);
    var dummyStone = new libItem.Item({
        cid: ExtractStoneId,
        stc: stoneCount
    });
    theForgeItem = {
        ClassId: ExtractStoneId,
        StackCount: 0
    };
    content.ui.target.setItem(dummyStone);
    ExtractArgs = null;
    if( stoneCount < ExtractMinCount ){
        content.owner.newName.setString("一次提炼至少需要5枚七色石");
        ExtractSlider = libGadget.UISlider.create({
            start: content.owner.nodeStart.getPosition(),
            end: content.owner.nodeEnd.getPosition(),
            sthumb: "forge4-common-btn.png",
            min: 0,
            max: stoneCount,
            def: 0,
            callback: function(val){
                var count = Math.floor(val);
                theForgeItem.StackCount = count;
                content.owner.labelCount.setString(count);
                content.ui.cost.setPrice({
                    gold: ExtractCostRate*count
                });
            }
        });
    }
    else{
        content.owner.newName.setString("提炼可获得多种属性石");
        ExtractSlider = libGadget.UISlider.create({
            start: content.owner.nodeStart.getPosition(),
            end: content.owner.nodeEnd.getPosition(),
            sthumb: "forge4-common-btn.png",
            min: ExtractMinCount,
            max: stoneCount,
            def: ExtractMinCount,
            callback: function(val){
                var count = Math.floor(val);
                theForgeItem.StackCount = count;
                content.owner.labelCount.setString(count);
                content.ui.cost.setPrice({
                    gold: ExtractCostRate*count
                });
                ExtractArgs = {
                    opn: ITMOP_EXTRACT,
                    opc: count
                }
            }
        });
    }
    content.owner.nodeX.addChild(ExtractSlider);
}

function loadExtract(){
    var ret = {};
    ret.owner = {};
    ret.owner.onStartExtract = onStartExtract;

    var node = libUIC.loadUI(ret, "ui-forge4x.ccbi", {
        itemA: {
            ui: "UIItem",
            id: "target",
            def: "wenhao.png"
        },
        nodeCost: {
            ui: "UIPrice",
            id: "cost"
        }
    });
    ret.node = node;
    engine.ui.regMenu(ret.owner.menuRoot);

    return ret;
}

function onExtract(sender){
    if( !engine.user.player.checkUnlock("extract") ){
        return;
    }

    if( isFlying ) return;

    //clean transitionContent
    if( theTransitionContent != null ){
        theTransitionContent.removeFromParent();
        theTransitionContent = null;
    }

    if( theMode < MODE_EXTRACT ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionContent = loadExtract();
        theContentNodeR.addChild(theTransitionContent.node);
        loadExtractItems(theTransitionContent);
        isFlying = true;
    }
    else if( theMode > MODE_EXTRACT ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionContent = loadExtract();
        theContentNodeL.addChild(theTransitionContent.node);
        loadExtractItems(theTransitionContent);
        isFlying = true;
    }
    else{
        //just load
        theTransitionContent = null;
        theContent = loadExtract();
        theContentNode.addChild(theContent.node);
        loadExtractItems(theContent);
        isFlying = false;
    }

    theMode = MODE_EXTRACT;
    setModeTag(theMode);
}

function onStartExtract(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( ExtractArgs != null ){
        libUIKit.waitRPC(Request_InventoryUseItem, ExtractArgs, function(rsp){
            if( rsp.RET == RET_OK ){
                pushForgeAnimation("effect-forge.ccbi", {nodeItem:theForgeItem}, function(){
                    libUIKit.showAlert("提炼成功", function(){
                        onExtract();
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
        case MODE_EXTRACT:
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
                    loadEnhanceItems(theContent);
                    setEnhanceEquip(theContent.ui.equip.getItem());
                }break;
                case MODE_EXTRACT:{
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
    this.owner.onExtract = onExtract;

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