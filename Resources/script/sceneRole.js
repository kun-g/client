/**
 * User: hammer
 * Date: 13-8-29
 * Time: 下午5:57
 */

var libTable = loadModule("table.js");
var libItemInfo = loadModule("itemInfo.js");
var ui = loadModule("UIComposer.js");
var libEffect = loadModule("effect.js");
var theLayer = null;
var theRole;

var theSkillEffect;

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theLayer.runAction(actionPopOut(engine.ui.popLayer));
}

function onGitem(sender){
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
    //buttons
    theLayer.ui.btnGitem.setEnabled(false);
    theLayer.ui.btnSitem.setEnabled(true);
}

function onSitem(sender){
    //set default icon
    theLayer.ui.equip1.setDefaultIcon("shopequipmentbg1.png");
    theLayer.ui.equip2.setDefaultIcon("shopequipmentbg2.png");
    theLayer.ui.equip3.setDefaultIcon("shopequipmentbg3.png");
    theLayer.ui.equip4.setDefaultIcon("shopequipmentbg4.png");
    theLayer.ui.equip5.setDefaultIcon("shopequipmentbg5.png");
    theLayer.ui.equip6.setDefaultIcon("shopequipmentbg6.png");
    //set equipments
    theLayer.ui.equip1.setItem(theRole.queryArmor(EquipSlot_StoreHead), theRole);
    theLayer.ui.equip2.setItem(theRole.queryArmor(EquipSlot_StoreHair), theRole);
    theLayer.ui.equip3.setItem(theRole.queryArmor(EquipSlot_StoreSuit), theRole);
    theLayer.ui.equip4.setItem(theRole.queryArmor(EquipSlot_StoreMainHand), theRole);
    theLayer.ui.equip5.setItem(theRole.queryArmor(EquipSlot_StoreSecondHand), theRole);
    theLayer.ui.equip6.setItem(theRole.queryArmor(EquipSlot_StoreGear), theRole);
    //buttons
    theLayer.ui.btnGitem.setEnabled(true);
    theLayer.ui.btnSitem.setEnabled(false);
}

function setSkillSelectEffect(node){
    if( theSkillEffect != null ){
        theSkillEffect.removeFromParent();
    }
    //theSkillEffect = libEffect.attachEffectCCBI(node, cc.p(0, 0), "effect-selected.ccbi", libEffect.EFFECTMODE_LOOP);
}

function onSkill(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var tag = sender.getTag();
    var uikey = "skill"+(tag+1);
    var nodeKey = "sk"+(tag+1);
    var skill = theLayer.ui[uikey].getSkill();
    if( skill != null ){
        var SkillClass = libTable.queryTable(TABLE_SKILL, skill.ClassId);
        theLayer.owner.labSkillDesc.setString(SkillClass.label+"："+SkillClass.desc);
        setSkillSelectEffect(theLayer.owner[nodeKey]);
    }
    else{
        theLayer.owner.labSkillDesc.setString("");

        if( theSkillEffect != null ){
            theSkillEffect.removeFromParent();
            theSkillEffect = null;
        }
    }
}

function onArmor(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var tag = sender.getTag();
    var uikey = "equip"+(tag+1);
    var item = theLayer.ui[uikey].getItem();
    if( item != null ){
        libItemInfo.show(item);
    }
}

function onEnter()
{
    theLayer = engine.ui.curLayer;
    //sync equip
    engine.user.inventory.syncArmors();

    var sfc = cc.SpriteFrameCache.getInstance();
    sfc.addSpriteFrames("avatar.plist");

    theLayer.owner = {};
    theLayer.owner.onGitem = onGitem;
    theLayer.owner.onSitem = onSitem;
    theLayer.owner.onSkill = onSkill;
    theLayer.owner.onArmor = onArmor;
    theLayer.owner.onClose = onClose;

    var node = ui.loadUI(theLayer, "sceneAvatarinfo.ccbi", {
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
        item1: {
            id: "equip1",
            ui: "UIItem"
        },
        item2: {
            id: "equip2",
            ui: "UIItem"
        },
        item3: {
            id: "equip3",
            ui: "UIItem"
        },
        item4: {
            id: "equip4",
            ui: "UIItem"
        },
        item5: {
            id: "equip5",
            ui: "UIItem"
        },
        item6: {
            id: "equip6",
            ui: "UIItem"
        },
        btnGitem: {
            id: "btnGitem",
            ui: "UIButtonL",
            menu: "menuRoot",
            label: "buttontext-yxzb.png",
            func: onGitem
        },
        btnSitem: {
            id: "btnSitem",
            ui: "UIButtonL",
            menu: "menuRoot",
            label: "buttontext-sdzb.png",
            func: onSitem
        },
        nodeRole: {
            id: "avatar",
            ui: "UIAvatar",
            scale: 1.2
        }
    });
    theLayer.addChild(node);
    engine.ui.regMenu(theLayer.owner.menuRoot);

    theLayer.ui.avatar.setRole(theRole);
    theLayer.ui.skill1.setSkill(theRole.querySkill(0));
    theLayer.ui.skill2.setSkill(theRole.querySkill(1));
    theLayer.ui.skill3.setSkill(theRole.querySkill(2));
    theLayer.ui.skill4.setSkill(theRole.querySkill(3));

    theLayer.owner.labName.setString(theRole.Name);
    appendVipIcon(theLayer.owner.labName, theRole.vip);
    theLayer.owner.labPower.setString(theRole.getPower());
    theLayer.owner.labHealth.setString(theRole.Health);
    theLayer.owner.labAttack.setString(theRole.Attack);
    theLayer.owner.labSpeed.setString(theRole.Speed);
    theLayer.owner.labCritical.setString(theRole.Critical);
    theLayer.owner.labStrong.setString(theRole.Strong);
    theLayer.owner.labAccuracy.setString(theRole.Accuracy);
    theLayer.owner.labReactivity.setString(theRole.Reactivity);

    var RoleClass = libTable.queryTable(TABLE_ROLE, theRole.ClassId);
    theLayer.owner.labClass.setString(theRole.Level+"级"+RoleClass.className);
    theLayer.owner.labSkillDesc.setString("");

    //--- vip panel ---
    if( theRole.vip != null && theRole.vip > 0 ){
        theLayer.owner.nodeVip.setVisible(true);
    }

    onGitem();

    theSkillEffect = null;

    theLayer.setScale(0);
    theLayer.runAction(actionPopIn());
    
    
}

function onExit()
{
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("role");
}

function show(role){
    theRole = role;

    theLayer = engine.ui.newLayer({
        onEnter: onEnter,
        onExit: onExit,
        onActivate: onActivate
    });
}

exports.show = show;