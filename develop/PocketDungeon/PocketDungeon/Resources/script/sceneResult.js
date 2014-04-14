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

var playerClasses = [0, 1, 2];

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

function loadResult(){
    if( theResult.res > 0 ){
        theLayer.owner.nodeWin.setVisible(true);
        theLayer.owner.nodeFail.setVisible(false);
    }
    else{
        theLayer.owner.nodeWin.setVisible(false);
        theLayer.owner.nodeFail.setVisible(true);
    }
    //load prize
    var size = theLayer.owner.layerPrize.getContentSize();
    var dimension = cc.size(size.width, 0);
    var prize = libItem.ItemPreview.create(theResult.prize, dimension);
    var psize = prize.getContentSize();
    prize.setPosition(cc.p(size.width/2 - psize.width/2, size.height - psize.height));
    theLayer.owner.layerPrize.addChild(prize);

    var btn = buttonNormalL("buttontext-confirm.png", BUTTON_OFFSET, this, onConfirm);
    btn.setPosition(theLayer.owner.nodeButton.getPosition());
    theLayer.owner.menuRoot.addChild(btn);
}

function onConfirm(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( !checkFriendInvite() ){
        engine.ui.newScene(loadModule("sceneMain.js").scene());
    }
}

function onEnter(){
    theLayer = this;

    this.owner = {};
    this.owner.onConfirm = onConfirm;
    this.node = cc.BuilderReader.load("sceneJiesuan2.ccbi", this.owner);
    this.addChild(this.node);

    engine.ui.regMenu(this.owner.menuRoot);

    loadResult();

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
}

function setParty(party){
    theParty = party;
}

exports.setResult = setResult;
exports.scene = scene;
exports.setParty = setParty;