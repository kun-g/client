/**
 * User: hammer
 * Date: 13-11-25
 * Time: 下午2:34
 */

var libUIC = loadModule("UIComposer.js");
var libUIKit = loadModule("uiKit.js");
var libTable = loadModule("table.js");
var libRole = loadModule("role.js");

var theLayer;
var theInput;
var isPublic;

var theMode;
var MODE_PUBLIC = 0;
var MODE_PRIVATE = 1;
var MODE_EXIT = 2;
var theLeft;
var theRight;
var theCenter;
var theTransitionGroup;
var theCurrentGroup;
var isFlying;

var touchPosBegin;
var theSelectedNode;
var theClickFlag;

var CHAT_DIMENSION;

var theMenuLayer;

function actionGoIn(func, obj){
    var mb = cc.MoveBy.create(0.3, cc.p(CHAT_DIMENSION.width, 0));
    var ac = cc.EaseExponentialOut.create(mb);
    var call = null;
    if( func != null ){
        call = cc.CallFunc.create(func, obj);
    }
    if( call == null ){
        return ac;
    }
    else{
        return cc.Sequence.create(ac, call);
    }
}

function actionGoOut(func, obj){
    var mb = cc.MoveBy.create(0.3, cc.p(-CHAT_DIMENSION.width, 0));
    var ac = cc.EaseExponentialOut.create(mb);
    var call = null;
    if( func != null ){
        call = cc.CallFunc.create(func, obj);
    }
    if( call == null ){
        return ac;
    }
    else{
        return cc.Sequence.create(ac, call);
    }
}

function onMenuInfo(sender){
    if( theSelectedNode.CHAT.src != null ){
        libUIKit.showRoleInfo(theSelectedNode.CHAT.src);
    }
}

function onMenuWhisper(sender){
    engine.session.whisper.send(theSelectedNode.CHAT.src);
}

function onMenuInvite(sender){
    libUIKit.waitRPC(Request_FriendInvite, {
        nam: theSelectedNode.CHAT.src
    }, function(rsp){
        engine.ui.popLayer();
        if( rsp.RET == RET_OK ){
            engine.msg.pop(translate(engine.game.language, "chatInfoInviteSended"), POPTYPE_INFO);
        }
        else{
            engine.msg.pop(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
        }
    });
}

function onMenuTouchBegan(touch, event){
    if( theMenuLayer.READY ){
        var pos = touch.getLocation();
        var rpos = theSelectedNode.convertToWorldSpace(cc.p(0, 0));
        var rsiz = theSelectedNode.getContentSize();
        var rect = cc.rect(rpos.x, rpos.y, rsiz.width, rsiz.height);
        if( !cc.rectContainsPoint(rect, pos) ){
            return true;
        }
    }
    return false;
}

function onMenuTouchMoved(touch, event){}

function onMenuTouchEnded(touch, event){
    popMenu();
}

function onMenuTouchCancelled(touch, event){
    this.onTouchEnded(touch, event);
}

function popMenu(){
    theSelectedNode.unshift();
    theMenuLayer.node.runAction(actionGoOut(function(){
        unfadeAll();
        engine.ui.popLayer();
    }));
}

function pushMenu(){
    //load node
    theMenuLayer = engine.ui.newLayer();
    theMenuLayer.owner = {};
    theMenuLayer.owner.onInfo = onMenuInfo;
    theMenuLayer.owner.onWhisper = onMenuWhisper;
    theMenuLayer.owner.onInvite = onMenuInvite;
    theMenuLayer.node = cc.BuilderReader.load("ui-talkMenu.ccbi", theMenuLayer.owner);
    //prepare data
    var off = cc.p(CHAT_DIMENSION.width/2, theSelectedNode.txt.getContentSize().height/2);
    var rtpos = theSelectedNode.txt.convertToWorldSpace(off);
    theMenuLayer.node.setPosition(cc.p(rtpos.x - CHAT_DIMENSION.width, rtpos.y));
    theMenuLayer.addChild(theMenuLayer.node);
    engine.ui.regMenu(theMenuLayer.owner.menuRoot);
    //go
    theMenuLayer.READY = false;
    theSelectedNode.shift();
    theMenuLayer.node.runAction(actionGoIn(function(){
        theMenuLayer.READY = true;
    }, theMenuLayer));
    //set touch
    theMenuLayer.onTouchBegan = onMenuTouchBegan;
    theMenuLayer.onTouchMoved = onMenuTouchMoved;
    theMenuLayer.onTouchEnded = onMenuTouchEnded;
    theMenuLayer.onTouchCancelled = onMenuTouchCancelled;
    theMenuLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theMenuLayer.setTouchPriority(1);
    theMenuLayer.setTouchEnabled(true);
    engine.ui.regMenu(theMenuLayer);
}

//---------------------

var ChatItem = cc.LayerColor.extend({
    init: function(){
        if( !this._super() ) return false;
        //init code here
        this.setColor(cc.c3b(255, 255, 255));
        this.setOpacity(0);
        this.CHAT = null;
        this.SHIFT = false;
        return true;
    },
    setChat: function(chat){
        this.CHAT = chat;
        if( this.CHAT != null ){
            var size = cc.size(CHAT_DIMENSION.width, 0);
            //add button division
            this.div = cc.Sprite.createWithSpriteFrameName("talkline.png");
            this.div.setAnchorPoint(cc.p(0.5, 0));
            this.div.setPosition(cc.p(size.width/2, 0));
            this.addChild(this.div);
            size.height += this.div.getContentSize().height;
            size.height += 20;
            //add chat content
            this.txt = cc.LabelTTF.create(
                this.CHAT.txt,
                UI_FONT,
                UI_SIZE_L,
                cc.size(CHAT_DIMENSION.width, 0),
                cc.TEXT_ALIGNMENT_LEFT,
                cc.VERTICAL_TEXT_ALIGNMENT_TOP
            );
            this.txt.setAnchorPoint(cc.p(0, 0));
            this.txt.setPosition(cc.p(0, size.height));
            this.addChild(this.txt);
            size.height += this.txt.getContentSize().height;
            size.height += 13;

            switch(this.CHAT.typ){
                case 1://系统
                {
                    this.txt.setColor(COLOR_QUALITY[2]);
                }break;
                case 2://广播
                {
                    this.txt.setColor(COLOR_QUALITY[4]);
                }break;
                case 0://玩家
                case 3://私聊
                {
                    var xoff = 0;
                    //add user name
                    this.name = cc.LabelTTF.create(this.CHAT.src, UI_FONT, UI_SIZE_L);
                    this.name.setColor(COLOR_QUALITY[1]);
                    this.name.setAnchorPoint(cc.p(0, 0.5));
                    this.name.setPosition(cc.p(xoff, size.height + 25));
                    this.addChild(this.name);
                    xoff += this.name.getContentSize().width;
                    //add vip
                    if( this.CHAT.vip != null ){
                        appendVipIcon(this.name, this.CHAT.vip);
                    }
                    //add power
                    this.power = cc.LabelTTF.create(this.CHAT.pow, UI_FONT, UI_SIZE_L);
                    this.power.setColor(COLOR_QUALITY[2]);
                    this.power.setAnchorPoint(cc.p(1, 0.5));
                    this.power.setPosition(cc.p(CHAT_DIMENSION.width - 15, size.height + 25));
                    this.addChild(this.power);
                    //add emblem
                    var roleData = libTable.queryTable(TABLE_ROLE, this.CHAT.cla);
                    this.emblem = cc.Sprite.create(roleData.emblem[1]);
                    this.emblem.setAnchorPoint(cc.p(1, 0.5));
                    this.emblem.setPosition(cc.p(CHAT_DIMENSION.width - 100, size.height + 25));
                    this.addChild(this.emblem);
                    size.height += 50;
                }break;
            }

            size.height += 13;
            this.setContentSize(size);
        }
        else{
            this.removeAllChildren();
        }
    },
    getChat: function(){
        return this.CHAT;
    },
    fade: function(){
        if( this.txt != null ){
            this.txt.setOpacity(128);
        }
        if( this.name != null ){
            this.name.setOpacity(128);
        }
        if( this.power != null ){
            this.power.setOpacity(128);
        }
        if( this.emblem != null ){
            this.emblem.setOpacity(128);
        }
        if( this.vip != null ){
            this.vip.setOpacity(128);
        }
    },
    unfade: function(){
        if( this.txt != null ){
            this.txt.setOpacity(255);
        }
        if( this.name != null ){
            this.name.setOpacity(255);
        }
        if( this.power != null ){
            this.power.setOpacity(255);
        }
        if( this.emblem != null ){
            this.emblem.setOpacity(255);
        }
        if( this.vip != null ){
            this.vip.setOpacity(255);
        }
    },
    highlight: function(){
        //this.setOpacity(64);
    },
    unhighlight: function(){
        //this.setOpacity(0);
    },
    shift: function(){
        if( !this.SHIFT ){
            this.txt.runAction(actionGoIn());
            this.SHIFT = true;
        }
    },
    unshift: function(){
        if( this.SHIFT ){
            this.txt.runAction(actionGoOut());
            this.SHIFT = false;
        }
    }
});

ChatItem.create = function(chat){
    var ret = new ChatItem();
    ret.init();
    if( chat != null ){
        ret.setChat(chat);
    }
    return ret;
}

// -----------------------

function reformatText(group){
    var viewSize = group.scroller.getViewSize();
    var textSize = group.theListLayer.getContentSize();
    if( textSize.height > viewSize.height ){
        var curroffset = group.scroller.getContentOffset();
        curroffset.y = group.scroller.maxContainerOffset().y;
        group.scroller.setContentOffset(curroffset);
    }
    else{
        var curroffset = group.scroller.getContentOffset();
        curroffset.y = group.scroller.minContainerOffset().y;
        group.scroller.setContentOffset(curroffset);
    }
}

function onLoadPublic(sender){
    loadPublic();
}

function onLoadPrivate(sender){
    loadPrivate();
}

function setPublic(group){
    group.theListLayer.removeAllChildren();
    var size = cc.size(CHAT_DIMENSION.width, 0);
    for(var k=engine.session.chats.length-1; k>=0; k--){
        var chat = engine.session.chats[k];
        if( chat.typ != 3 ){
            var bar = ChatItem.create(chat);
            bar.setAnchorPoint(cc.p(0, 0));
            bar.setPosition(cc.p(0, size.height));
            group.theListLayer.addChild(bar);
            size.height += bar.getContentSize().height;
        }
    }
    group.theListLayer.setContentSize(size);

    reformatText(group);

    //update chat box
    theInput.setText("");
    theInput.setPlaceHolder(translate(engine.game.language, "chatInfoInputContent"));
}

function loadPublic(){
    if( isFlying ) return;

    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.owner.btnPublic.setNormalSpriteFrame(sfc.getSpriteFrame("talk-tabsj1.png"));
    theLayer.owner.btnPublic.setSelectedSpriteFrame(sfc.getSpriteFrame("talk-tabsj2.png"));
    theLayer.owner.btnPrivate.setNormalSpriteFrame(sfc.getSpriteFrame("talk-tabsl2.png"));
    theLayer.owner.btnPrivate.setSelectedSpriteFrame(sfc.getSpriteFrame("talk-tabsl1.png"));
    theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("talk-titlesj.png"));
    theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("talk-titlesj.png"));
    theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("talk-titlesj.png"));
    theLayer.owner.btnPublic.setEnabled(false);
    theLayer.owner.btnPrivate.setEnabled(true);
    isPublic = true;

    if( theMode < MODE_PUBLIC ){
        // to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        setPublic(theTransitionGroup);
        isFlying = true;
    }
    else if( theMode > MODE_PUBLIC ){
        // to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        setPublic(theTransitionGroup);
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        setPublic(theCurrentGroup);
        isFlying = false;
    }
    theMode = MODE_PUBLIC;
}

function setPrivate(group){
    group.theListLayer.removeAllChildren();
    var size = cc.size(CHAT_DIMENSION.width, 0);
    for(var k=engine.session.chats.length-1; k>=0; k--){
        var chat = engine.session.chats[k];
        if( chat.typ == 3 ){
            var bar = ChatItem.create(chat);
            bar.setAnchorPoint(cc.p(0, 0));
            bar.setPosition(cc.p(0, size.height));
            group.theListLayer.addChild(bar);
            size.height += bar.getContentSize().height;
        }
    }
    group.theListLayer.setContentSize(size);

    reformatText(group);

    //update chat box
    if( engine.session.whisper.curEvent != null ){
        theInput.setText("");
        theInput.setPlaceHolder();
    }
}

function loadPrivate(){
    if( isFlying ) return;

    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.owner.btnPublic.setNormalSpriteFrame(sfc.getSpriteFrame("talk-tabsj2.png"));
    theLayer.owner.btnPublic.setSelectedSpriteFrame(sfc.getSpriteFrame("talk-tabsj1.png"));
    theLayer.owner.btnPrivate.setNormalSpriteFrame(sfc.getSpriteFrame("talk-tabsl1.png"));
    theLayer.owner.btnPrivate.setSelectedSpriteFrame(sfc.getSpriteFrame("talk-tabsl2.png"));
    theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("talk-titlesl.png"));
    theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("talk-titlesl.png"));
    theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("talk-titlesl.png"));
    theLayer.owner.btnPublic.setEnabled(true);
    theLayer.owner.btnPrivate.setEnabled(false);

    isPublic = false;

    if( theMode < MODE_PRIVATE ){
        // to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        setPrivate(theTransitionGroup);
        isFlying = true;
    }
    else if( theMode > MODE_PRIVATE ){
        // to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        setPrivate(theTransitionGroup);
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        setPrivate(theCurrentGroup);
        isFlying = false;
    }
    theMode = MODE_PRIVATE;
}

function onClose(sender){
    theMode = MODE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function onRecvRPC(rsp){
    if( rsp.RET != RET_OK ){
        engine.msg.pop(ErrorMsgs[rsp], POPTYPE_ERROR);
    }
}

function onSend(sender){
    var text = theInput.getText();
    text = filterUserInput(text);
    if( text != null && text != "" ){
        if( !isPublic
            && engine.session.whisper.curEvent != null ){
            engine.event.sendRPCEvent(Request_SendWhisper, {
                nam: engine.session.whisper.curEvent.src,
                txt: text
            }, onRecvRPC, theLayer);
        }
        else{
            engine.event.sendRPCEvent(Request_SendChat, {
                txt: text
            }, onRecvRPC, theLayer);
        }
        theInput.setText("");
    }
}

function onNotify(ntf){
    if( ntf.NTF == Message_NewChat ){
        var append = false;
        if( isPublic ){
            if( ntf.arg.typ != 3 ){
                append = true;
            }
        }
        else{
            if( ntf.arg.typ == 3 ){
                append = true;
                theInput.setPlaceHolder(translate(engine.game.language, "chatInfoSendMessTo",[ntf.arg.src]));
                theInput.setText("");
            }
        }
        if( append ){
            var size = theCurrentGroup.theListLayer.getContentSize();
            var bar = ChatItem.create(ntf.arg);
            bar.setAnchorPoint(cc.p(0, 0));
            bar.setPosition(cc.p(0, 0));
            var height = bar.getContentSize().height;
            var olds = theCurrentGroup.theListLayer.getChildren();
            for(var k in olds){
                var old = olds[k];
                var ops = old.getPosition();
                ops.y += height;
                old.setPosition(ops);
            }
            theCurrentGroup.theListLayer.addChild(bar);
            size.height += height;
            theCurrentGroup.theListLayer.setContentSize(size);

            reformatText(theCurrentGroup);
        }
    }
    return false;
}

function getNodeByPos(rpos)
{
    var nodes = theCenter.theListLayer.getChildren();
    for(var k in nodes){
        var nd = nodes[k];
        var pos = nd.getPosition();
        var siz = nd.getContentSize();
        var rec = cc.rect(pos.x, pos.y, siz.width, siz.height);
        if( cc.rectContainsPoint(rec, rpos) )
        {
            return nd;
        }
    }
    return null;
}

function fadeAll(){
    var nodes = theCurrentGroup.theListLayer.getChildren();
    for(var k in nodes){
        var nd = nodes[k];
        nd.fade();
    }
}

function unfadeAll(){
    var nodes = theCurrentGroup.theListLayer.getChildren();
    for(var k in nodes){
        var nd = nodes[k];
        nd.unfade();
    }
}

function onTouchBegan(touch, event){
    var pos = touch.getLocation();
    var rvpos = theCenter.scroller.convertToNodeSpace(pos);
    if( !cc.rectContainsPoint(cc.rect(0, 0, CHAT_DIMENSION.width, CHAT_DIMENSION.height), rvpos))
    {
        return false;
    }

    var rpos = theCenter.theListLayer.convertToNodeSpace(pos);
    var node = getNodeByPos(rpos);
    if( node != null ){
        touchPosBegin = pos;
        if( theSelectedNode != null ){
            theSelectedNode.unhighlight();
        }
        theSelectedNode = node;
        theSelectedNode.highlight();
        theClickFlag = true;
    }
    return true;
}

function onTouchMoved(touch, event){
    if( theClickFlag ){
        var pos = touch.getLocation();
        var dis = cc.pSub(pos, touchPosBegin);
        if( cc.pLengthSQ(dis) > CLICK_RANGESQ ){
            theClickFlag = false;
            theSelectedNode.unhighlight();
            theSelectedNode = null;
        }
    }
}

function onTouchEnded(touch, event){
    if( theClickFlag ){
        var pos = touch.getLocation();
        var dis = cc.pSub(pos, touchPosBegin);
        if( cc.pLengthSQ(dis) > CLICK_RANGESQ ){
            theSelectedNode.unhighlight();
            theSelectedNode = null;
        }
        else{
            theSelectedNode.unhighlight();
            var showMenu = false;
            if( theSelectedNode.CHAT.typ == 0 || theSelectedNode.CHAT.typ == 3 ){
                if( theSelectedNode.CHAT.src != engine.user.actor.Name )
                {//can't show menu for oneself
                    showMenu = true;
                }
            }
            if( showMenu )
            {//only player chat have menu
                fadeAll();
                theSelectedNode.unfade();
                pushMenu();
            }
        }
        theClickFlag = false;
    }
}

function onTouchCancelled(touch, event){
    return this.onTouchEnded(touch, event);
}

function onEditReturned(){
    onSend();
}

function onUIAnimationCompleted(name){
    isFlying = false;
    if( theMode == MODE_EXIT ){
        engine.ui.popLayer();
    }
    else if( theMode == MODE_PUBLIC ){
        if( theTransitionGroup != null ){
            theTransitionGroup.theListLayer.removeAllChildren();
            setPublic(theCenter);
            theCurrentGroup = theCenter;
            theTransitionGroup = null;
        }
    }
    else if( theMode == MODE_PRIVATE ){
        if( theTransitionGroup != null ){
            theTransitionGroup.theListLayer.removeAllChildren();
            setPrivate(theCenter);
            theCurrentGroup = theCenter;
            theTransitionGroup = null;
        }
    }
}

function onEnter(){
    theLayer = this;
    isFlying = false;

    var mask = blackMask();
    this.addChild(mask);

    this.owner = {};
    this.owner.onClose = onClose;
    this.owner.onSend = onSend;
    this.owner.onLoadPublic = onLoadPublic;
    this.owner.onLoadPrivate = onLoadPrivate;

    this.node = libUIC.loadUI(this, "sceneTalk.ccbi", {
        nodeContent: {
            ui: "UIScrollView",
            id: "scroller",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        nodeContentL: {
            ui: "UIScrollView",
            id: "scrollerL",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        nodeContentR: {
            ui: "UIScrollView",
            id: "scrollerR",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        nodeInput: {
            ui: "UIInput",
            id: "input",
            length: UI_CHAT_LENGTH,
            type: cc.KEYBOARD_RETURNTYPE_SEND,
            hold: translate(engine.game.language, "chatInfoSendMessTo")
        }
    });
    this.addChild(this.node);
    this.node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    this.node.animationManager.runAnimationsForSequenceNamed("open");

    //set domains
    theLeft = {};
    {
        theLeft.labTitle = this.owner.labTitleL;
        theLeft.scrollTop = this.owner.scrollTopL;
        theLeft.scrollBottom = this.owner.scrollBottomL;
        theLeft.scroller = this.ui.scrollerL;
        theLeft.theListLayer = cc.Layer.create();
        theLeft.scroller.setContainer(theLeft.theListLayer);
        var off = theLeft.scroller.getContentOffset();
        off.y = theLeft.scroller.minContainerOffset().y;
        theLeft.scroller.setContentOffset(off);
    }
    theRight = {};
    {
        theRight.labTitle = this.owner.labTitleR;
        theRight.scrollTop = this.owner.scrollTopR;
        theRight.scrollBottom = this.owner.scrollBottomR;
        theRight.scroller = this.ui.scrollerR;
        theRight.theListLayer = cc.Layer.create();
        theRight.scroller.setContainer(theRight.theListLayer);
        var off = theRight.scroller.getContentOffset();
        off.y = theRight.scroller.minContainerOffset().y;
        theRight.scroller.setContentOffset(off);
    }
    theCenter = {};
    {
        theCenter.labTitle = this.owner.labTitle;
        theCenter.scrollTop = this.owner.scrollTop;
        theCenter.scrollBottom = this.owner.scrollBottom;
        theCenter.scroller = this.ui.scroller;
        theCenter.theListLayer = cc.Layer.create();
        theCenter.scroller.setContainer(theCenter.theListLayer);
        var off = theCenter.scroller.getContentOffset();
        off.y = theCenter.scroller.minContainerOffset().y;
        theCenter.scroller.setContentOffset(off);
    }
    theTransitionGroup = null;

    //read chat dimension for further usage
    CHAT_DIMENSION = this.owner.nodeContent.getContentSize();
    theSelectedNode = null;
    theClickFlag = false;

    theCenter.theListLayer.onTouchBegan = onTouchBegan;
    theCenter.theListLayer.onTouchMoved = onTouchMoved;
    theCenter.theListLayer.onTouchEnded = onTouchEnded;
    theCenter.theListLayer.onTouchCancelled = onTouchCancelled;
    theCenter.theListLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theCenter.theListLayer.setTouchPriority(1);
    theCenter.theListLayer.setTouchEnabled(true);

    engine.ui.regMenu(this.owner.menuRoot);
    engine.ui.regMenu(theCenter.scroller);
    engine.ui.regMenu(theCenter.theListLayer);

    theInput = this.ui.input;
    theInput.onEditReturned = onEditReturned;

    theMode = MODE_PUBLIC;
    loadPublic();
}

function chatObject(chat){
    var color = cc.c3b(255, 255, 255);
    var str = "["+chat.src+"] "+chat.txt;
    switch(chat.typ){
        case 1:
            color = cc.c3b(95, 187, 38);
            break;
        case 2:
            color = cc.c3b(240, 40, 0);
            break;
        case 3:
            color = cc.c3b(80, 80, 240);
            break;
    }
    return {
        text: str,
        color: color
    };
}

function show(){
    engine.ui.newLayer({
        onNotify: onNotify,
        onEnter: onEnter
    });
}

exports.show = show;
exports.chatObject = chatObject;