/**
 * User: hammer
 * Date: 13-11-27
 * Time: 下午2:14
 */

var libItem = loadModule("xitem.js");
var libRole = loadModule("role.js");
var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");

var theLayer;
var theResult = null;
var theParty = null;
var theFriendList;

var theFriendLayer;

var SleepTimer = -1;
var theWXPAnimations;
var theWXPSource;
var theWXP;
var theEXP;
var theWXPSound = -1;
var theDummyRole;
var theEXPLeft;
var theEXPFlag;
var theExpAdded;

var EXP_SPEED = 75;

var theOldState;

function onFriendAdd(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var index = sender.getTag() - 1;
    if( theFriendList.length > index ){
        var role = theFriendList[index];
        if( !role.REQUESTED ){
            engine.event.sendRPCEvent(Request_FriendInvite, {
                nam: role.Name
            },function(rsp){
                //do nothing
            });
        }
    }
    sender.setEnabled(false);
}

function onRoleInfo(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var index = sender.getTag() - 1;
    if( theFriendList.length > index ){
        var role = theFriendList[index];
        libUIKit.showRoleInfo(role.Name);
    }
}

function onFriendCancel(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theFriendLayer.node.runAction(actionPopOut(function(){
        engine.ui.newScene(loadModule("sceneMain.js").scene());
    }))
}

function onFriendAddAll(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    for(var k in theFriendList){
        var role = theFriendList[k];
        if( !role.REQUESTED ){
            engine.event.sendRPCEvent(Request_FriendInvite, {
                nam: role.Name
            },function(rsp){
                //do nothing
            });
            role.REQUESTED = true;
        }
    }

    onFriendCancel();
}

function checkFriendInvite(){
    var list = [];
    for(var k in theParty){
        var raw = theParty[k];
        var human = false;
        for(var k in playerClasses){
            if( playerClasses[k] == raw.ClassId ){
                human = true;
                break;
            }
        }
        if( raw.Name != engine.user.actor.Name
            && engine.user.friend.queryFriend(raw.Name) < 0
            && human == true ){
            var role = raw;
            role.REQUESTED = false;
            list.push(role);
        }
    }
    if( list.length == 0 ){
        return false;
    }
    else{
        theFriendList = list;

        var layer = engine.ui.newLayer();
        var mask = blackMask();
        layer.addChild(mask);
        layer.owner = {};
        layer.owner.onAdd = onFriendAdd;
        layer.owner.onRoleInfo = onRoleInfo;
        layer.node = libUIC.loadUI(layer, "ui-friendadd2.ccbi", {
            btnA: {
                ui: "UIButtonL",
                menu: "menuRoot",
                func: onFriendCancel,
                obj: layer,
                label: "buttontext-close.png"
            },
            btnB: {
                ui: "UIButtonL",
                menu: "menuRoot",
                func: onFriendAddAll,
                obj: layer,
                label: "buttontext-qbtj.png",
                type: BUTTONTYPE_DEFAULT
            },
            nodeRole1: {
                ui: "UIAvatar",
                id: "role1"
            },
            nodeRole2: {
                ui: "UIAvatar",
                id: "role2"
            }
        });
        var winSize = cc.Director.getInstance().getWinSize();
        layer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
        layer.addChild(layer.node);

        layer.node.setScale(0);
        layer.node.runAction(actionPopIn());

        engine.ui.regMenu(layer.owner.menuRoot);

        //set role1
        {
            var role1 = list[0];
            var RClass1 = libTable.queryTable(TABLE_ROLE, role1.ClassId);
            layer.ui.role1.setRole(role1);
            layer.owner.labelName1.setString(role1.Name);
            appendVipIcon(layer.owner.labelName1, role1.vip);
            layer.owner.labelDesc1.setString("Lv."+role1.Level+" "+RClass1.className);
            layer.owner.labPower1.setString(role1.getPower());

            //--- vip panel ---
            if( role1.vip != null && role1.vip > 0 ){
                layer.owner.nodeVip1.setVisible(true);
            }
        }
        //set role2
        if( list.length >= 2 ){
            var role2 = list[1];
            var RClass2 = libTable.queryTable(TABLE_ROLE, role2.ClassId);
            layer.ui.role2.setRole(role2);
            layer.owner.labelName2.setString(role2.Name);
            appendVipIcon(layer.owner.labelName2, role2.vip);
            layer.owner.labelDesc2.setString("Lv."+role2.Level+" "+RClass2.className);
            layer.owner.labPower2.setString(role2.getPower());

            //--- vip panel ---
            if( role2.vip != null && role2.vip > 0 ){
                layer.owner.nodeVip2.setVisible(true);
            }
        }
        else{
            layer.owner.spLine2.setColor(cc.c3b(85, 85, 85));
            layer.owner.btnAdd2.setVisible(false);
            layer.owner.nodeLine2.setVisible(false);
        }

        theFriendLayer = layer;
    }
    return true;
}

var UIArgs = [
    {icon:"equipmentbg1.png", slot:EquipSlot_MainHand},
    {icon:"equipmentbg2.png", slot:EquipSlot_SecondHand},
    {icon:"equipmentbg3.png", slot:EquipSlot_Chest},
    {icon:"equipmentbg4.png", slot:EquipSlot_Legs},
    {icon:"equipmentbg5.png", slot:EquipSlot_Finger},
    {icon:"equipmentbg6.png", slot:EquipSlot_Neck}
];

function loadResult(){
    if( theResult.res > 0 ){
        theLayer.owner.nodeWin.setVisible(true);
        theLayer.owner.nodeFail.setVisible(false);
    }
    else{
        theLayer.owner.nodeWin.setVisible(false);
        theLayer.owner.nodeFail.setVisible(true);
    }

    //init wxp animations
    theWXPAnimations = [];
    for(var k in UIArgs){
        var args = UIArgs[k];
        var index = +k+1;
        theLayer.ui["equip"+index].showFrame();
        if( theWXPSource[index] != null ){
            var src = theWXPSource[index];
            theLayer.ui["equip"+index].setItem(src.itm, null, true, true);
            if( src.up >= 0 ){
                var last = src.xp + theWXP;
                if( last > src.up ){
                    last = src.up;
                }
                if( last != src.xp && theWXP > 0 ){
                    var anim = {
                        base: src.xp,
                        last: last,
                        total: src.up,
                        added: 0,
                        toadd: last - src.xp,
                        index: index,
                        label: theLayer.owner["labExp"+index],
                        progress: theLayer.ui["progress"+index]
                    };
                    theWXPAnimations.push(anim);
                    theLayer.owner["labExp"+index].setVisible(true);
                    theLayer.owner["labExp"+index].setString("+0");
                }
                else{
                    theLayer.owner["labExp"+index].setVisible(false);
                }
                theLayer.ui["progress"+index].setProgress(src.xp/src.up);
            }
            else{
                theLayer.ui["progress"+index].setProgress(1);
                theLayer.owner["labExp"+index].setVisible(false);
            }
        }
        else{
            theLayer.ui["progress"+index].setProgress(0);
            theLayer.owner["labExp"+index].setVisible(false);
            theLayer.ui["equip"+index].setDefaultIcon(args.icon);
            theLayer.ui["equip"+index].setItem(null, null, true, true);
        }
    }
    //init exp animation
    var exp = theDummyRole.calcExp();
    if( exp.max ){
        theLayer.owner.labExp7.setVisible(false);
        theLayer.ui.progress7.setProgress(1);
        theEXPFlag = false;
    }
    else{
        if( theEXP > 0 ){
            theLayer.owner.labExp7.setVisible(true);
            theLayer.owner.labExp7.setString("+0");
            theLayer.ui.progress7.setProgress(exp.now/exp.total);
            theExpAdded = 0;
            theEXPFlag = true;
            theEXPLeft = theEXP;
        }
        else{
            theLayer.owner.labExp7.setVisible(false);
            theLayer.ui.progress7.setProgress(exp.now/exp.total);
            theEXPFlag = false;
        }
    }
    //set avatar
    theLayer.owner.labName.setString(engine.user.actor.Name);
    theLayer.ui.avatar.setRole(engine.user.actor);
    theLayer.owner.labLevel.setString("LV."+exp.level);

    //初始化控件
    if( theWXPAnimations.length > 0 ){
        theWXPSound = cc.AudioEngine.getInstance().playEffect("prize.mp3", true);
    }

    //load prize
    var size = theLayer.owner.layerPrize.getContentSize();
    var dimension = cc.size(size.width, 0);
    var prize = libItem.ItemPreview.create(theResult.prize, dimension);
    prize.setShowInfo(true);
    var psize = prize.getContentSize();
    prize.setPosition(cc.p(size.width/2 - psize.width/2, size.height - psize.height));
    theLayer.owner.layerPrize.addChild(prize);
    prize.shake();

    var btn = buttonNormalL("buttontext-confirm.png", BUTTON_OFFSET, this, onConfirm);
    btn.setPosition(theLayer.owner.nodeButton.getPosition());
    theLayer.owner.menuRoot.addChild(btn);
}

function initResult(){
    //process prize
    theWXP = 0;
    theEXP = 0;
    if( theResult.prize != null ){
        theResult.prize = theResult.prize.filter(function(pz){
            if( pz.type == 4 ){
                theWXP += pz.count;
                return false;
            }
            else if( pz.type == 3 ){
                theEXP += pz.count;
                return false;
            }
            return true;
        });
    }
    EXP_SPEED = theEXP / 1.5;

    theWXPSource = {};
    var theRole = engine.user.actor;
    for(var k in UIArgs){
        var args = UIArgs[k];
        var index = +k+1;
        var item = theRole.queryArmor(args.slot, true);
        if( item != null ){
            var CurrXp = 0;
            if( item.Xp != null ) CurrXp = item.Xp;
            var UpgradeXp = item.equipUpgradeXp();
            if( CurrXp > UpgradeXp ){
                CurrXp = UpgradeXp;
            }
            var src = {
                itm: item,
                xp: CurrXp,
                up: UpgradeXp
            };
            theWXPSource[index] = src;
        }
    }
    //create dummy role
    theDummyRole = new libRole.Role({
        cid: engine.user.actor.ClassId,
        exp: engine.user.actor.Experience
    });
}

function update(delta){
    SleepTimer += delta;
    if( SleepTimer >= 0 ){
        theWXPAnimations = theWXPAnimations.filter(function(anim){
            var step = delta*EXP_SPEED;
            var left = anim.toadd - anim.added;
            if( step > left ){
                step = left;
            }
            anim.added += step;
            var now = anim.base + anim.added;
            anim.label.setString("+"+Math.round(anim.added));
            anim.progress.setProgress(now/anim.total);
            if( anim.added >= anim.toadd ){
                return false;
            }
            return true;
        });
        //run role exp
        if( theEXPFlag ){
            var step = delta*EXP_SPEED;
            var exp = theDummyRole.calcExp();
            theLayer.owner.labLevel.setString("LV."+exp.level);
            if( !exp.max ){
                var lose = exp.total - exp.now;
                if( step > lose ){
                    step = lose;
                }
                if( step > theEXPLeft ){
                    step = theEXPLeft;
                    theEXPFlag = false;//used up
                }
                theExpAdded += step;
                if( theExpAdded > theEXP ){
                    theExpAdded = theEXP;
                }
                theLayer.owner.labExp7.setString("+"+Math.round(theExpAdded));
                theDummyRole.Experience += step;
                theLayer.ui.progress7.setProgress((exp.now+step)/exp.total);
                if( theExpAdded >= theEXP ){
                    theEXPFlag = false;
                }
            }
            else{
                theEXPFlag = false;
            }
        }
        if( theWXPAnimations.length == 0 && theWXPSound >= 0 && theEXPFlag == false ){
            cc.AudioEngine.getInstance().stopEffect(theWXPSound);
            theWXPSound = -1;

            loadModule("pops.js").invokePopLevelUp();
        }
    }
}

function onConfirm(sender){
    if (theWXPSound >= 0) {
        cc.AudioEngine.getInstance().stopEffect(theWXPSound);
        theWXPSound = -1;
    }
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( !checkFriendInvite() ){
        engine.ui.newScene(loadModule("sceneMain.js").scene());
    }
}

function onItem(sender) {
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var tag = sender.getTag();
    var itm = theLayer.ui["equip"+tag].getItem();
    if (itm != null) {
        loadModule("itemInfo.js").show(itm);
    }
}

function onEnter(){
    theLayer = this;

    this.owner = {};
    this.owner.onConfirm = onConfirm;
    this.owner.onItem = onItem;
    this.node = libUIC.loadUI(this, "sceneJiesuan.ccbi", {
        nodeRole:{
            ui: "UIAvatar",
            id: "avatar",
            scale: 1.2
        },
        nodeExp1:{
            ui: "UIProgress",
            id: "progress1",
            length: 88,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp2:{
            ui: "UIProgress",
            id: "progress2",
            length: 88,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp3:{
            ui: "UIProgress",
            id: "progress3",
            length: 88,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp4:{
            ui: "UIProgress",
            id: "progress4",
            length: 88,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp5:{
            ui: "UIProgress",
            id: "progress5",
            length: 88,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp6:{
            ui: "UIProgress",
            id: "progress6",
            length: 88,
            begin: "jiesuan-sld1.png",
            middle: "jiesuan-sld2.png",
            end: "jiesuan-sld3.png"
        },
        nodeExp7:{
            ui: "UIProgress",
            id: "progress7",
            length: 253,
            begin: "jiesuan-jyz1.png",
            middle: "jiesuan-jyz2.png",
            end: "jiesuan-jyz3.png"
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
    this.addChild(this.node);

    engine.ui.regMenu(this.owner.menuRoot);

    loadResult();

    theLayer.update = update;
    theLayer.scheduleUpdate();

    //schedule pop
    engine.pop.resetAllFlags();
}

function onExit(){
}

function scene(){
    return {
        onEnter: onEnter,
        onExit: onExit
    }
}

function setResult(result){
    theResult = result;
    initResult();
}

function setParty(party){
    theParty = party;
}

exports.setResult = setResult;
exports.scene = scene;
exports.setParty = setParty;