/**
 * User: hammer
 * Date: 13-12-4
 * Time: 下午3:00
 */

var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");
var libRole = loadModule("role.js");

var STATE_SYSTEMDELIVER_LIST = 0;
var STATE_SYSTEMDELIVER_INFO = 1;
var STATE_FRIENDINVITE_LIST = 2;
var STATE_EXIT = 3;

var theLayer;
var theState;
var thePopMsg;

//domains
var theLeft;
var theRight;
var theCenter;
var theTransitionGroup;
var theCurrentGroup;
var isFlying;

var theSelectedNode;
var theClickFlag;
var touchPosBegin;
var BAR_HEIGHT = 100;
var FIRST_GAP = 25;

var COLOR_BLACK = cc.c3b(55,37,20);
var COLOR_RED = cc.c3b(197,16,16);

var thePrizeLayer = [];

function removeDeliver(sid){
    if( sid == null ){
        //remove all
        engine.session.deliver = [];
    }
    else{
        engine.session.deliver = engine.session.deliver.filter(function(d){
            if(d.sid == sid ){
                return false;
            }
            return true;
        });
    }
}

function removeInvite(sid){
    if( sid == null ){
        //remove all
        engine.session.invite = [];
    }
    else{
        engine.session.invite = engine.session.invite.filter(function(d){
            if(d.sid == sid ){
                return false;
            }
            return true;
        });
    }
}

function clearBoard(group){
    group.theContentLayer.removeAllChildren();
    group.theContentListLayer.removeAllChildren();
    group.thePresentList = [];
    for(var k in group.theMenus){
        var m = group.theMenus[k];
        engine.ui.unregMenu(m);
    }
    group.theMenus = [];
}

function setButtons(group, barray){
    //clean
    for(var k in group.theButtons){
        var btn = group.theButtons[k];
        btn.removeFromParent();
    }
    group.theButtons = [];

    if( barray.length == 1 ){
        var btnOnly = makeButton(barray[0]);
        btnOnly.setPosition(group.btnC.getPosition());
        group.menu.addChild(btnOnly);
        group.theButtons.push(btnOnly);
    }
    else if( barray.length == 2 ){
        var btnA = makeButton(barray[0]);
        btnA.setPosition(group.btnA.getPosition());
        group.menu.addChild(btnA);
        var btnB = makeButton(barray[1]);
        btnB.setPosition(group.btnB.getPosition());
        group.menu.addChild(btnB);
        group.theButtons.push(btnA);
        group.theButtons.push(btnB);
    }
}

function resetContentScroll(group){
    var curroffset = group.scrollerlist.getContentOffset();
    curroffset.y = group.scrollerlist.minContainerOffset().y;
    group.scrollerlist.setContentOffset(curroffset);

    curroffset = group.scroller.getContentOffset();
    curroffset.y = group.scroller.minContainerOffset().y;
    group.scroller.setContentOffset(curroffset);
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theState = STATE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

var DELIVER_WIDTH = 570;
var DELIVER_HEIGHT = 110;

function createDeliverBar(data){
    var bar = cc.Node.create();
    bar.owner = {};

    bar.node = cc.BuilderReader.load("ui-mail.ccbi", bar.owner);
    bar.owner.labTitle.setString(data.tit);
    bar.node.setPosition(cc.p(0, 0));
    bar.addChild(bar.node);

    bar.DATA = data;

    return bar;
}

function getDeliverNodeByPos(rpos){
    var size = theCenter.theContentListLayer.getContentSize();
    var rect = cc.rect(0, 0, size.width, size.height);
    if( cc.rectContainsPoint(rect, rpos) ){
        var index = theCenter.thePresentList.length - Math.floor(rpos.y/DELIVER_HEIGHT) - 1;
        return theCenter.thePresentList[index];
    }
    return null;
}

function setSystemDeliver(group){
    group.theContentListLayer.setTouchEnabled(true);
    clearBoard(group);

    theState = STATE_SYSTEMDELIVER_LIST;

    group.labBlueTitle.setVisible(false);
    group.nodeConBg.setVisible(false);
    group.labContTitle.setVisible(false);

    var sfc = cc.SpriteFrameCache.getInstance();
    group.labTitle.setDisplayFrame(sfc.getSpriteFrame("mail-titlextyj.png"));
    theCenter.labTitle.setDisplayFrame(sfc.getSpriteFrame("mail-titlextyj.png"));

    var list = engine.session.deliver;
    var size = cc.size(DELIVER_WIDTH, DELIVER_HEIGHT*list.length);
    theLayer.LOAD_SIZE = size;
    group.theContentListLayer.setContentSize(size);
    resetContentScroll(group);

    var bstate = list.length != 0;
    setButtons(group, [{
        label: "buttontext-qblq.png",
        func: onSDAcceptAll,
        obj: theLayer,
        type: BUTTONTYPE_DEFAULT,
        state: bstate
    }]);
}

function onSystemDeliver(sender){
    if( isFlying ) return;

    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.owner.btnSystemDeliver.setNormalSpriteFrame(sfc.getSpriteFrame("mail-tabxtyj1.png"));
    theLayer.owner.btnSystemDeliver.setSelectedSpriteFrame(sfc.getSpriteFrame("mail-tabxtyj2.png"));
    theLayer.owner.btnFriendInvite.setNormalSpriteFrame(sfc.getSpriteFrame("mail-tabhysq2.png"));
    theLayer.owner.btnFriendInvite.setSelectedSpriteFrame(sfc.getSpriteFrame("mail-tabhysq1.png"));
    theLayer.owner.btnSystemDeliver.setEnabled(false);
    theLayer.owner.btnFriendInvite.setEnabled(true);

    if( theState == STATE_SYSTEMDELIVER_INFO
        || theState == STATE_SYSTEMDELIVER_LIST ){
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        setSystemDeliver(theCurrentGroup);
        isFlying = false;
        theLayer.LOAD_FLAG = true;
        theLayer.LOAD_INDEX = 0;
    }
    else if( theState < STATE_SYSTEMDELIVER_LIST ){
        // to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        setSystemDeliver(theTransitionGroup);
        isFlying = true;
    }
    else if( theState > STATE_SYSTEMDELIVER_LIST ){
        // to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        setSystemDeliver(theTransitionGroup);
        isFlying = true;
    }

    theClickFlag = false;
    theSelectedNode = null;
}

var INVITE_WIDTH = 570;
var INVITE_HEIGHT = 145;

function createInviteBar(data){
    var bar = cc.Node.create();
    bar.owner = {};
    bar.owner.onFIAccept = onFIAccept;
    bar.owner.onRoleInfo = onFIRoleInfo;

    bar.node = libUIC.loadUI(bar, "ui-friend2.ccbi", {
        nodeRole: {
            ui: "UIAvatar",
            id: "avatar"
        }
    });
    bar.node.setPosition(cc.p(0, 0));
    bar.addChild(bar.node);

    //assign values
    var role = new libRole.Role(data.act);
    role.fix();
    var RoleClass = libTable.queryTable(TABLE_ROLE, role.ClassId);
    bar.owner.labName.setString(role.Name);
    appendVipIcon(bar.owner.labName, role.vip);
    bar.owner.labLevel.setString("Lv."+role.Level+" "+RoleClass.className);
    bar.owner.labPower.setString(role.getPower());
    bar.ui.avatar.setRole(role);

    //--- vip panel ---
    if( role.vip != null && role.vip > 0 ){
        bar.owner.nodeVip.setVisible(true);
    }

    theCurrentGroup.theMenus.push(bar.owner.menuRoot);
    engine.ui.regMenu(bar.owner.menuRoot);

    bar.DATA = data;
    bar.owner.btnAccept.NODE = bar;
    bar.owner.btnRoleInfo.NODE = bar;

    return bar;
}

function loadDeliverDetail(data){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    clearBoard(theCurrentGroup);
    for (var k in thePrizeLayer){
        engine.ui.unregMenu(thePrizeLayer[k]);
    }
    thePrizeLayer = [];

    theState = STATE_SYSTEMDELIVER_INFO;
    theCurrentGroup.labBlueTitle.setVisible(true);
    theCurrentGroup.nodeConBg.setVisible(true);
    theCurrentGroup.labContTitle.setVisible(true);

    theCurrentGroup.labContTitle.setString(data.tit);

    var winSize = engine.game.viewSize;
    var iphone5s = (winSize.height == 1136);
    var dimension = cc.size(theCurrentGroup.nodeContent.getContentSize().width, 0);
    var text = DCTextArea.create();
    text.setDimension(dimension);
//    text.pushText({text: "  "});
//    text.pushText({//push title
//        text: data.tit,
//        color: COLOR_RED,
//        //align: cc.TEXT_ALIGNMENT_CENTER,
//        size: UI_SIZE_XXL
//    });
    if (iphone5s){
        text.pushText({text: "  "});
    }
    text.pushText({//push title
        text: /*"    "+*/data.txt,
        color: COLOR_BLACK,
        size: UI_SIZE_S
    });
    var yoffset = 0;
    if( data.prz != null ){
        text.pushText({text: "  "});
        text.pushText({//push title
            text: translate(engine.game.language, "messageInfoAttachment"),
            color: COLOR_RED,
            size: UI_SIZE_L
        });
        if (iphone5s){
            text.pushText({text: "  "});
        }
        var size = text.getContentSize();
        var prize = libItem.ItemPreview.createRaw(dimension);
        engine.ui.regMenu(prize);
        debug("MessageInfo.js");
        thePrizeLayer.push(prize);
        prize.setTextColor(COLOR_BLACK);
        prize.setShowInfo(true);
        if (!iphone5s){
            prize.setNodeScale(0.77);
        }
        prize.setPreview(data.prz);
        prize.setPosition(cc.p(0, 0));
        theCurrentGroup.theContentLayer.addChild(prize);
        yoffset = prize.getContentSize().height;
    }

    text.setPosition(cc.p(0, yoffset));
    theCurrentGroup.theContentLayer.addChild(text);
    size.height += yoffset;
    theCurrentGroup.theContentLayer.setContentSize(size);
    resetContentScroll(theCurrentGroup);

    setButtons(theCurrentGroup, [
        {
            label: "buttontext-back.png",
            func: onSDBack,
            obj: theLayer
        },
        {
            label: "buttontext-lqfj.png",
            func: onSDAccept,
            obj: theLayer,
            type: BUTTONTYPE_DEFAULT
        }
    ]);
}

function setFriendInvite(group){
    group.theContentListLayer.setTouchEnabled(false);
    clearBoard(group);
    theState = STATE_FRIENDINVITE_LIST;

    group.labBlueTitle.setVisible(false);
    group.nodeConBg.setVisible(false);
    group.labContTitle.setVisible(false);

    var sfc = cc.SpriteFrameCache.getInstance();
    cacheSprite("buttontext-hysq.png");
    group.labTitle.setDisplayFrame(sfc.getSpriteFrame("mail-titlehysq.png"));
    theCenter.labTitle.setDisplayFrame(sfc.getSpriteFrame("mail-titlehysq.png"));

    var list = engine.session.invite;
    var size = cc.size(INVITE_WIDTH, INVITE_HEIGHT*list.length);
    theLayer.LOAD_SIZE = size;
    group.theContentListLayer.setContentSize(size);
    resetContentScroll(group);

    var bstate = list.length != 0;
    setButtons(group, [{
        label: "buttontext-qbjj.png",
        func: onFIRejectAll,
        obj: theLayer,
        state: bstate
    }]);
}

function onFriendInvite(sender){
    if( isFlying ) return;

    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.owner.btnSystemDeliver.setNormalSpriteFrame(sfc.getSpriteFrame("mail-tabxtyj2.png"));
    theLayer.owner.btnSystemDeliver.setSelectedSpriteFrame(sfc.getSpriteFrame("mail-tabxtyj1.png"));
    theLayer.owner.btnFriendInvite.setNormalSpriteFrame(sfc.getSpriteFrame("mail-tabhysq1.png"));
    theLayer.owner.btnFriendInvite.setSelectedSpriteFrame(sfc.getSpriteFrame("mail-tabhysq2.png"));
    theLayer.owner.btnSystemDeliver.setEnabled(true);
    theLayer.owner.btnFriendInvite.setEnabled(false);

    if( theState < STATE_FRIENDINVITE_LIST ){
        // to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        setFriendInvite(theTransitionGroup);
        isFlying = true;
    }
    else if( theState > STATE_FRIENDINVITE_LIST ){
        // to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        setFriendInvite(theTransitionGroup);
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        setFriendInvite(theCurrentGroup);
        isFlying = false;
        //--------------
        theLayer.LOAD_FLAG = true;
        theLayer.LOAD_INDEX = 0;
    }
}

function onSDAcceptAll(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libUIKit.pushLoading();
    var list = engine.session.deliver;
    var count = list.length;
    engine.event.sendRPCEvent(Request_NotifyOperate, {
        typ: 201,
        opn: NTFOP_ACCEPT
    }, function (rsp){
        engine.ui.popLayer();
        if( rsp.RET == RET_OK ){
            engine.session.MessageCount -= count;
            //clear data
            removeDeliver();
            onSystemDeliver();
        }
        else{
            thePopMsg.pushMsg(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
        }
    }, theLayer);
}

function onSDBack(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    for (var k in thePrizeLayer){
        engine.ui.unregMenu(thePrizeLayer[k]);
    }
    thePrizeLayer = [];
    onSystemDeliver();
}

function onSDAccept(sender){
    libUIKit.waitRPC(Request_NotifyOperate, {
        sid: theSelectedNode.DATA.sid,
        opn: NTFOP_ACCEPT
    }, function(rsp){
        if( rsp.RET != RET_OK )
        {
            thePopMsg.pushMsg(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
        }
        engine.session.MessageCount--;
        removeDeliver(theSelectedNode.DATA.sid);
        onSystemDeliver();
    }, theLayer);
}

function onFIAccept(sender){
    var data = sender.NODE.DATA;
    libUIKit.waitRPC(Request_NotifyOperate, {
        sid:data.sid,
        opn: NTFOP_ACCEPT
    }, function(rsp){
        if( rsp.RET != RET_OK )
        {
            thePopMsg.pushMsg(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
        }
        engine.session.MessageCount--;
        removeInvite(data.sid);
        onFriendInvite();
    }, theLayer);
}

function onFIRoleInfo(sender){
    var data = sender.NODE.DATA;
    libUIKit.showRoleInfo(data.act.nam);
}

function onFIRejectAll(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var alt = libUIKit.alert();
    alt.setContent(translate(engine.game.language, "messageInfoRefuseAll"));
    alt.setButton([
        {
            label: "buttontext-confirm.png",
            func: function(){
                alt.theNode.runAction(actionPopOut(function(){
                    engine.ui.popLayer();
                    libUIKit.pushLoading();
                    var list = engine.session.invite;
                    var count = list.length;
                    engine.event.sendRPCEvent(Request_NotifyOperate, {
                        typ: 200,
                        opn: NTFOP_DECLINE
                    }, function (rsp){
                        engine.ui.popLayer();
                        if( rsp.RET == RET_OK )
                        {
                            engine.session.MessageCount -= count;
                            removeInvite();
                            onFriendInvite();
                        }
                        else{
                            thePopMsg.pushMsg(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
                        }
                    }, theLayer);
                }));
            },
            obj: alt
        },
        {
            label: "buttontext-qx.png",
            func: alt.onClose,
            obj: alt
        }
    ]);
}

function update(delta){
    if( this.LOAD_FLAG === true ){
        if( theState == STATE_SYSTEMDELIVER_LIST ){
            if( this.LOAD_INDEX < engine.session.deliver.length ){
                var node = createDeliverBar(engine.session.deliver[this.LOAD_INDEX]);
                node.setPosition(cc.p(0, this.LOAD_SIZE.height - this.LOAD_INDEX*DELIVER_HEIGHT - DELIVER_HEIGHT - FIRST_GAP));
                theCenter.theContentListLayer.addChild(node);
                theCenter.thePresentList.push(node);

                this.LOAD_INDEX++;
            }
            else{
                this.LOAD_FLAG = false;
            }
        }
        else if( theState == STATE_FRIENDINVITE_LIST ){
            if( this.LOAD_INDEX < engine.session.invite.length ){
                var node = createInviteBar(engine.session.invite[this.LOAD_INDEX]);
                node.setPosition(cc.p(0, this.LOAD_SIZE.height - this.LOAD_INDEX*INVITE_HEIGHT - INVITE_HEIGHT - FIRST_GAP));
                theCenter.theContentListLayer.addChild(node);
                theCenter.thePresentList.push(node);

                this.LOAD_INDEX++;
            }
            else{
                this.LOAD_FLAG = false;
            }
        }
    }
}

function onNotify(event){
    if( theState == STATE_SYSTEMDELIVER_LIST
        && event.NTF == Message_NewSystemDeliver ){
        onSystemDeliver();
    }
    if( theState == STATE_FRIENDINVITE_LIST
        && event.NTF == Message_NewFriendInvite ){
        onFriendInvite();
    }
    return false;
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("mail");
}

function onTouchBegan(touch, event){
    var pos = touch.getLocation();
    var rpos = theCenter.theContentListLayer.convertToNodeSpace(pos);
    var node = getDeliverNodeByPos(rpos);
    if( node != null ){
        touchPosBegin = pos;
        if( theSelectedNode != null ){
            theSelectedNode.owner.nodeShadow.setVisible(false);
        }
        theSelectedNode = node;
        node.owner.nodeShadow.setVisible(true);
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
            theSelectedNode.owner.nodeShadow.setVisible(false);
            theSelectedNode = null;
        }
    }
}

function onTouchEnded(touch, event){
    if( theClickFlag ){
        var pos = touch.getLocation();
        var dis = cc.pSub(pos, touchPosBegin);
        if( cc.pLengthSQ(dis) > CLICK_RANGESQ ){
            theSelectedNode.owner.nodeShadow.setVisible(false);
            theSelectedNode = null;
        }
        else{
            var layerPos = theLayer.owner.nodeContentlist.getPosition();
            var layerSize = theLayer.owner.nodeContentlist.getContentSize();
            var rect = cc.rect(layerPos.x, layerPos.y - BAR_HEIGHT/2, layerSize.width, layerSize.height);
            if( cc.rectContainsPoint(rect, theSelectedNode.getParent().convertToWorldSpace(theSelectedNode.getPosition())) ){
                loadDeliverDetail(theSelectedNode.DATA);
            }
        }
        theClickFlag = false;
    }
}

function onTouchCancelled(touch, event){
    onTouchEnded(touch, event);
}

function onUIAnimationCompleted(name){
    isFlying = false;
    if( theState == STATE_EXIT ){
        engine.ui.popLayer();
    }
    else if( theState == STATE_FRIENDINVITE_LIST ){
        if( theTransitionGroup != null ){
            resetContentScroll(theTransitionGroup);
            setFriendInvite(theCenter);
            theCurrentGroup = theCenter;
            theTransitionGroup = null;

            theLayer.LOAD_FLAG = true;
            theLayer.LOAD_INDEX = 0;
        }
    }
    else if( theState == STATE_SYSTEMDELIVER_LIST ){
        if( theTransitionGroup != null ){
            resetContentScroll(theTransitionGroup);
            setSystemDeliver(theCenter);
            theCurrentGroup = theCenter;
            theTransitionGroup = null;

            theLayer.LOAD_FLAG = true;
            theLayer.LOAD_INDEX = 0;
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
    this.owner.onSystemDeliver = onSystemDeliver;
    this.owner.onFriendInvite = onFriendInvite;
    this.owner.onSDAcceptAll = onSDAcceptAll;
    this.owner.onSDBack = onSDBack;
    this.owner.onSDAccept = onSDAccept;
    this.owner.onFIRejectAll = onFIRejectAll;

    this.node = libUIC.loadUI(this, "sceneMail.ccbi", {
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
        nodeContentlist: {
            ui: "UIScrollView",
            id: "scrollerlist",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        nodeContentlistL: {
            ui: "UIScrollView",
            id: "scrollerlistL",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        nodeContentlistR: {
            ui: "UIScrollView",
            id: "scrollerlistR",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        }
    });
    this.addChild(this.node);
    this.node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    this.node.animationManager.runAnimationsForSequenceNamed("open");

    //set domains
    theLeft = {};
    {
        theLeft.scroller = this.ui.scrollerL;
        theLeft.scrollerlist = this.ui.scrollerlistL;
        theLeft.labTitle = this.owner.labTitleL;
        theLeft.labBlueTitle = this.owner.labBlueTitleL;
        theLeft.nodeConBg = this.owner.nodeConBgL;
        theLeft.labContTitle = this.owner.labContTitleL;
        theLeft.scrollTop = this.owner.scrollTopL;
        theLeft.scrollBottom = this.owner.scrollBottomL;
        theLeft.btnA = this.owner.btnAL;
        theLeft.btnB = this.owner.btnBL;
        theLeft.btnC = this.owner.btnCL;
        theLeft.theContentLayer = cc.Layer.create();
        theLeft.theContentListLayer = cc.Layer.create();
        theLeft.scroller.setContainer(theLeft.theContentLayer);
        theLeft.scrollerlist.setContainer(theLeft.theContentListLayer);
        theLeft.nodeContent = this.owner.nodeContentL;
        theLeft.nodeContentlist = this.owner.nodeContentlistL;
        theLeft.menu = this.owner.menuL;
        theLeft.theMenus = [];
    }
    theRight = {};
    {
        theRight.scroller = this.ui.scrollerR;
        theRight.scrollerlist = this.ui.scrollerlistR;
        theRight.labBlueTitle = this.owner.labBlueTitleR;
        theRight.labTitle = this.owner.labTitleR;
        theRight.nodeConBg = this.owner.nodeConBgR;
        theRight.labContTitle = this.owner.labContTitleR;
        theRight.scrollTop = this.owner.scrollTopR;
        theRight.scrollBottom = this.owner.scrollBottomR;
        theRight.btnA = this.owner.btnAR;
        theRight.btnB = this.owner.btnBR;
        theRight.btnC = this.owner.btnCR;
        theRight.theContentLayer = cc.Layer.create();
        theRight.theContentListLayer = cc.Layer.create();
        theRight.scroller.setContainer(theRight.theContentLayer);
        theRight.scrollerlist.setContainer(theRight.theContentListLayer);
        theRight.nodeContent = this.owner.nodeContentR;
        theRight.nodeContentlist = this.owner.nodeContentlistR;
        theRight.menu = this.owner.menuR;
        theRight.theMenus = [];
    }
    theCenter = {};
    {
        theCenter.scroller = this.ui.scroller;
        theCenter.scrollerlist = this.ui.scrollerlist;
        theCenter.labTitle = this.owner.labTitle;
        theCenter.labBlueTitle = this.owner.labBlueTitle;
        theCenter.nodeConBg = this.owner.nodeConBg;
        theCenter.labContTitle = this.owner.labContTitle;
        theCenter.scrollTop = this.owner.scrollTop;
        theCenter.scrollBottom = this.owner.scrollBottom;
        theCenter.btnA = this.owner.btnA;
        theCenter.btnB = this.owner.btnB;
        theCenter.btnC = this.owner.btnC;
        theCenter.theContentLayer = cc.Layer.create();
        theCenter.theContentListLayer = cc.Layer.create();
        theCenter.scroller.setContainer(theCenter.theContentLayer);
        theCenter.scrollerlist.setContainer(theCenter.theContentListLayer);
        theCenter.nodeContent = this.owner.nodeContent;
        theCenter.nodeContentlist = this.owner.nodeContentlist;
        theCenter.menu = this.owner.menu;
        theCenter.theMenus = [];
    }
    theTransitionGroup = null;

    engine.ui.regMenu(this.owner.menuRoot);
    engine.ui.regMenu(this.owner.menu);
    engine.ui.regMenu(this.owner.menuR);
    engine.ui.regMenu(this.owner.menuL);

    theCenter.theContentListLayer.onTouchBegan = onTouchBegan;
    theCenter.theContentListLayer.onTouchMoved = onTouchMoved;
    theCenter.theContentListLayer.onTouchEnded = onTouchEnded;
    theCenter.theContentListLayer.onTouchCancelled = onTouchCancelled;
    theCenter.theContentListLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theCenter.theContentListLayer.setTouchPriority(1);
    theCenter.theContentListLayer.setTouchEnabled(false);

    thePopMsg = PopMsg.simpleInit(theLayer);

    this.update = update;
    this.scheduleUpdate();

    theState = STATE_SYSTEMDELIVER_LIST;
    onSystemDeliver();
    
    
}

function show(){
    engine.ui.newLayer({
        onNotify: onNotify,
        onEnter: onEnter,
        onActivate: onActivate
    });
}

exports.show = show;