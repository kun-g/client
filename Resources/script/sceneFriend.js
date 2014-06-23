/**
 * User: hammer
 * Date: 13-8-29
 * Time: 下午6:09
 */

var theLayer = null;
var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libRole = loadModule("role.js");

//quick access
var theListLayer;
var labelNumber;
var nodeParty;

var theAddLayer;

var theMode;

var MODE_NORMAL = 0;
var MODE_EXIT = 1;

var theLIST = [];
var theSelect = null;
var theMenus = [];
var thePopMsg;

var BAR_WIDTH = 580;
var BAR_HEIGHT = 150;
var BAR_OFFSET = 80;
var FIRST_GAP = 25;

function updateFriendTeam(){
    nodeParty.removeAllChildren();
    theLayer.owner.btnMate2.setTag(-1);
    theLayer.owner.btnMate1.setTag(-1);
    theLayer.owner.btnMate1.setVisible(false);
    theLayer.owner.btnMate2.setVisible(false);

    var count = 0;
    for(var k in engine.session.team ){
        var mate = engine.session.team[k];
        if( mate.IsFriend ){
            var frame = RoleBox.create(mate);
            var pos;
            if( count == 0 ){
                pos = theLayer.owner.btnMate1.getPosition();
                theLayer.owner.btnMate1.setTag(Number(k));
                theLayer.owner.btnMate1.setVisible(true);
            }
            else{
                pos = theLayer.owner.btnMate2.getPosition();
                theLayer.owner.btnMate2.setTag(Number(k));
                theLayer.owner.btnMate2.setVisible(true);
            }
            frame.setPosition(pos);
            nodeParty.addChild(frame);
            count++;
        }
    }
}

function onMate(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    var k = sender.getTag();
    if( k >= 0 ){
        //var mate = engine.session.team[k];
        libUIKit.waitRPC(Request_StageRefreshMercenaryList, {
            sid: k
        }, function(rsp){
            if( rsp.RET == RET_OK ){
                var newRole = new libRole.Role(rsp.arg);
                newRole.fix();
                engine.session.team[k] = newRole;
                updateFriendTeam();
                loadFriend();
            }
            else{
                thePopMsg.pushMsg(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
            }
        }, theLayer);
    }
}

function onCommand(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    //select the bar
    var layer = sender.LAYER;
    if( theSelect != null ){
        if( theSelect === layer ){
            closeEdit(theSelect);
            theSelect = null;
        }
        else{
            closeEdit(theSelect);
            theSelect = layer;
            openEdit(theSelect);
        }
    }
    else{
        theSelect = layer;
        openEdit(theSelect);
    }
}

function onTeam(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var layer = sender.LAYER;
    var role = layer.ROLE;

    libUIKit.waitRPC(Request_FriendTeam, {
        nam: role.Name
    }, function(rsp){
        if( rsp.RET == RET_OK ){
            updateFriendTeam();
            loadFriend();
        }
        else{
            thePopMsg.pushMsg(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
        }
    }, theLayer);
}

function onRoleInfo(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var layer = sender.LAYER;
    var role = layer.ROLE;
    libUIKit.showRoleInfo(role.Name);
}

function onChat(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var layer = sender.LAYER;
    var role = layer.ROLE;
    engine.session.whisper.send(role.Name);
}

function onRemove(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var layer = sender.LAYER;
    var role = layer.ROLE;

    libUIKit.waitRPC(Request_FriendRemove, {
        nam: role.Name
    }, function(rsp){
        if( rsp.RET == RET_OK ){
            engine.user.friend.removeFriend(role.Name);
            loadFriend();
            thePopMsg.pushMsg(translate(engine.game.language, "sceneFriendDeleted"), POPTYPE_INFO);
        }
        else{
            thePopMsg.pushMsg(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
        }
    }, theLayer);
}

function openEdit(layer){
    layer.owner.nodeHide.setVisible(false);
    layer.owner.btnRoleInfo.setVisible(false);
    layer.owner.btnTeam.setVisible(true);
    layer.owner.btnChat.setVisible(true);
    layer.owner.btnRemove.setVisible(true);
}

function closeEdit(layer){
    layer.owner.nodeHide.setVisible(true);
    layer.owner.btnRoleInfo.setVisible(true);
    layer.owner.btnTeam.setVisible(false);
    layer.owner.btnChat.setVisible(false);
    layer.owner.btnRemove.setVisible(false);
}

function createFriendBar(role){
    var layer = cc.Node.create();
    layer.owner = {};
    layer.owner.onCommand = onCommand;
    layer.owner.onTeam = onTeam;
    layer.owner.onChat = onChat;
    layer.owner.onRemove = onRemove;
    layer.owner.onRoleInfo = onRoleInfo;

    layer.NODE = libUIC.loadUI(layer, "ui-friend.ccbi", {
        nodeRole: {
            ui: "UIAvatar",
            id: "avatar"
        }
    });
    layer.NODE.setPosition(cc.p(0, 0));
    layer.addChild(layer.NODE);

    //assign values
    var RoleClass = libTable.queryTable(TABLE_ROLE, role.ClassId);
    layer.owner.labName.setString(role.Name);
    appendVipIcon(layer.owner.labName, role.vip);
    layer.owner.labLevel.setString("Lv."+role.Level+" "+RoleClass.className);
    layer.owner.labPower.setString(role.getPower());
    layer.owner.spTeam.setVisible(false);
    if( role.BlueStar != null ){
        layer.owner.labelBlueStar.setString(role.BlueStar);
    }
    else{
        layer.owner.labelBlueStar.setString("0");
    }
    layer.ui.avatar.setRole(role);

    //--- vip panel ---
    if( role.vip != null && role.vip > 0 ){
        layer.owner.nodeVip.setVisible(true);
    }

    //setup for buttons
    layer.owner.nodeHide.setVisible(true);
    layer.owner.btnTeam.setVisible(false);
    layer.owner.btnChat.setVisible(false);
    layer.owner.btnRemove.setVisible(false);
    layer.owner.btnRoleInfo.LAYER = layer;
    layer.owner.btnEdit.LAYER = layer;
    layer.owner.btnTeam.LAYER = layer;
    layer.owner.btnChat.LAYER = layer;
    layer.owner.btnRemove.LAYER = layer;

    layer.ROLE = role;

    return layer;
}

function loadFriend(){
    //clear up
    theListLayer.removeAllChildren();
    theLIST = [];
    for(var k in theMenus){
        var m = theMenus[k];
        engine.ui.unregMenu(m);
    }
    theMenus = [];

    var friends = engine.user.friend.Friends;
    if( friends.length == 0 ){
        var size = cc.size(0, 0);
        var label = cc.LabelTTF.create(translate(engine.game.language, "sceneFriendNoFriend"), UI_FONT, UI_SIZE_XL);
        var viewSize = theLayer.ui.scroller.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, -2*viewSize.height/5));
        theListLayer.addChild(label);
    }
    else{
        theLayer.LOAD_SIZE = cc.size(BAR_WIDTH, BAR_HEIGHT*friends.length+BAR_OFFSET);
        theLayer.LOAD_INDEX = 0;
        theLayer.LOAD_FLAG = true;

        var size = theLayer.LOAD_SIZE;
    }

    //write count and capacity
    theLayer.owner.labelNumber.setString(engine.user.friend.Count+"/"+engine.user.friend.Capacity);
    theSelect = null;

    //reform the list
    theListLayer.setContentSize(size);
    var off = theLayer.ui.scroller.getContentOffset();
    off.y = theLayer.ui.scroller.minContainerOffset().y;
    theLayer.ui.scroller.setContentOffset(off);
}

function update(delta){
    if( this.LOAD_FLAG === true ){
        var offY = theLayer.ui.scroller.getContentOffset().y - theLayer.ui.scroller.minContainerOffset().y;
        var idxOff = BAR_HEIGHT * this.LOAD_INDEX;
        var isInFrame = idxOff >= offY && idxOff <= (offY+BAR_HEIGHT*6);
//        debug("offY:"+offY+"  idxOff:"+idxOff+"  isInframe:"+isInFrame);
        if( this.LOAD_INDEX < engine.user.friend.Friends.length ){
            if( isInFrame ){
                var friend = engine.user.friend.Friends[this.LOAD_INDEX];
                friend.fix();
                var node = createFriendBar(friend);
                node.setPosition(cc.p(0, this.LOAD_SIZE.height - this.LOAD_INDEX*BAR_HEIGHT - BAR_HEIGHT - FIRST_GAP));
                node.KEY = Number(this.LOAD_INDEX);
                theListLayer.addChild(node);
                theLIST.push(node);
                var m = node.owner.menuRoot;
                engine.ui.regMenu(m);
                theMenus.push(m);
                this.LOAD_INDEX++;
            }
        }
        else{
            this.LOAD_FLAG = false;
        }
    }

    var bars = theListLayer.getChildren();
    if( bars != null){
        for( var k in bars ){
            var layerPos = theLayer.owner.nodeContent.getPosition();
            var layerSize = theLayer.owner.nodeContent.getContentSize();
            var rect = cc.rect(layerPos.x, layerPos.y - BAR_HEIGHT/2, layerSize.width, layerSize.height);
            if( bars[k].owner != null ){
                if( cc.rectContainsPoint(rect, bars[k].getParent().convertToWorldSpace(bars[k].getPosition())) ){
                    bars[k].owner.menuRoot.setTouchEnabled(true);
                }else{
                    bars[k].owner.menuRoot.setTouchEnabled(false);
                }
            }
        }
    }
}

function onSort(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    engine.user.friend.sort();
    loadFriend();
}

function confirmAdd(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var str = theAddLayer.ui.input.getText();
    if( str != null && str != "" ){
        libUIKit.waitRPC(Request_FriendInvite, {
            nam: str
        }, function(rsp){
            engine.ui.popLayer();
            if( rsp.RET == RET_OK ){
                theAddLayer.node.runAction(actionPopOut(engine.ui.popLayer));
                thePopMsg.pushMsg(translate(engine.game.language, "chatInfoInviteSended"), POPTYPE_INFO);
            }
            else{
                thePopMsg.pushMsg(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
            }
        })
    }
}

function onAddTouchBegan(touch, event){
    var pos = touch.getLocation();
    var frame = theAddLayer.owner.frame;
    var rect = frame.getBoundingBox();
    var origin = frame.convertToWorldSpace(frame.getPosition());
    rect.x = origin.x;
    rect.y = origin.y;
    if( !cc.rectContainsPoint(rect, pos) ){
        return true;
    }
    return false;
}

function onAddTouchMoved(touch, event){
    //do nothing
}

function onAddTouchEnded(touch, event){
    //cancel the reply
    theAddLayer.node.runAction(actionPopOut(engine.ui.popLayer));
}

function onAddTouchCancelled(touch, event){
    onTouchEnded(touch, event);
}

function onAddEditReturned(){
    confirmAdd();
}

function onAdd(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var layer = engine.ui.newLayer();
    layer.owner = {};
    layer.owner.onConfirm = confirmAdd;
    layer.node = libUIC.loadUI(layer, "ui-friendadd.ccbi", {
        nodeInput: {
            ui: "UIInput",
            id: "input",
            length: UI_NAME_LENGTH,
            hold: translate(engine.game.language, "sceneFriendInputPlayerName"),
            type: cc.KEYBOARD_RETURNTYPE_SEND
        }
    });
    layer.ui.input.onEditReturned = onAddEditReturned;

    var winSize = cc.Director.getInstance().getWinSize();
    layer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    var mask = blackMask();
    layer.addChild(mask);
    layer.addChild(layer.node);

    layer.node.setScale(0);
    layer.node.runAction(actionPopIn());

    layer.onTouchBegan = onAddTouchBegan;
    layer.onTouchMoved = onAddTouchMoved;
    layer.onTouchEnded = onAddTouchEnded;
    layer.onTouchCancelled = onAddTouchCancelled;
    layer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    layer.setTouchPriority(-1);
    layer.setTouchEnabled(true);

    engine.ui.regMenu(layer.owner.menuRoot);
    engine.ui.regMenu(layer);

    theAddLayer = layer;
}

function onExtend(sender){
    var x = Math.floor((engine.user.friend.Capacity-20)/5);
    var n = x+1;
    if( x > 5 ) x = 5;
    var cost = 50 + x*30;
    var str1 = translate(engine.game.language, "sceneFriendExfriend",[cost]);
    var str2 = translate(engine.game.language, "sceneFriendChargeForExfriend",[cost]);
    libUIKit.confirmPurchase(Request_BuyFeature, {
        typ: 2
    }, str1, str2, cost, function(rsp){
        if( rsp.RET == RET_OK ){
            //统计
            tdga.itemPurchase(translate(engine.game.language, "sceneFriendExfriendN",[n]), 1, cost);
        }
    });
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theMode = MODE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function onUIAnimationCompleted(name){
    if( theMode == MODE_EXIT ){
        var main = loadModule("sceneMain.js");
        engine.ui.newScene(main.scene());
    }
    if( theMode == MODE_NORMAL ){
        theLayer.scheduleUpdate();
    }
}

function onNotify(ntf)
{
    switch(ntf.NTF){
        case Message_UpdateMercenaryList:
        {
            updateFriendTeam();
            return false;
        }
        case Message_UpdateFriend:
        {
            loadFriend();
            return false;
        }
    }
    return false;
}

function onEnter()
{
    theLayer = this;

    theSelect = null;

    this.owner = {};
    this.owner.onClose = onClose;
    this.owner.onSort = onSort;
    this.owner.onAdd = onAdd;
    this.owner.onExtend = onExtend;
    this.owner.onMate = onMate;

    var node = libUIC.loadUI(this, "sceneFriend.ccbi", {
        nodeContent:{
            ui: "UIScrollView",
            id: "scroller",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        }
    });

    theLayer.node = node;
    this.addChild(node);
    theMode = MODE_NORMAL;
    this.update = update;
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");

    engine.ui.regMenu(this.owner.menuRoot);

    theListLayer = cc.Layer.create();
    this.ui.scroller.setContainer(theListLayer);
    var off = this.ui.scroller.getContentOffset();
    off.y = this.ui.scroller.minContainerOffset().y;
    this.ui.scroller.setContentOffset(off);
    labelNumber = this.owner.labelNumber;
    nodeParty = theLayer.owner.nodeParty;

    loadFriend();
    updateFriendTeam();

    thePopMsg = PopMsg.simpleInit(this);
    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);
    
    
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("friend");
}

function onExit()
{
    loadModule("broadcastx.js").instance.close();
}

function scene()
{
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onNotify,
        onActivate: onActivate
    }
}

exports.scene = scene;