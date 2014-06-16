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

var theMode;

var RANK_BATTLEPOWER = 0;
var RANK_ENDLESS = 1;
var RANK_KILL = 2;

var MODE_BATTLEPOWER = RANK_BATTLEPOWER;
var MODE_ENDLESS = RANK_ENDLESS;
var MODE_KILL = RANK_KILL;
var MODE_EXIT = 3;

var theLIST = [];
var theRankList;
var thePage;
var theMe;

//domains
var theLeft;
var theRight;
var theCenter;
var theTransitionGroup;
var theCurrentGroup;
var isFlying;
var isScheduling;

var theCache = [];

var PAGE_SIZE = 10;//每页显示的玩家数量
var PAGE_COUNT = 3;

var BAR_WIDTH = 580;
var BAR_HEIGHT = 150;
var BAR_OFFSET = 80;
var FIRST_GAP = 25;

var nodeTopList = ["nodeZdlbg1","nodeZdlbg2","nodeZdlbg3","nodeZdlbg4"];
var topNum = [3,10,20,30];

function onRoleInfo(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var layer = sender.LAYER;
    var role = layer.ROLE;
    libUIKit.showRoleInfo(role.Name);
}

function createRoleBar(role, rank){
    var layer = cc.Node.create();
    layer.owner = {};
    layer.owner.onRoleInfo = onRoleInfo;

    layer.NODE = libUIC.loadUI(layer, "ui-ranking.ccbi", {
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
    for(var i=0; i<3; i++){
        layer.owner["spType"+i].setVisible(theMode == i);
        layer.owner["spPattern"+i].setVisible(theMode == i);
    }
    layer.owner.labPower.setString(role.scr);
    layer.ui.avatar.setRole(role);
    layer.owner.labBPRank.setString(rank);

    //--- vip panel ---
    if( role.vip != null && role.vip > 0 ){
        layer.owner.nodeVip.setVisible(true);
    }

    //--- top panel ---
    for (var k in topNum){
        layer.owner[nodeTopList[k]].setVisible(false);
        if (rank <= topNum[k]){
            layer.owner[nodeTopList[k]].setVisible(true);
            break;
        }
    }

    layer.owner.btnRoleInfo.LAYER = layer;
    layer.ROLE = role;

    return layer;
}

function fillPage(page){
    if( theCache[theMode][page] == null ){
        engine.event.sendRPCEvent(Request_QueryLeaderboard, {
            me: true,
            src: page*PAGE_SIZE,
            cnt: PAGE_SIZE,
            typ: theMode
        }, function(rsp){
            if( rsp.RET == RET_OK ){
                thePage = page;
                theMe = rsp.me;
                theCache[theMode][page] = rsp;//cache
                loadPage(rsp.lst);
                engine.session.cacheRoleInfo(rsp.lst);//缓存
            }
            else{
                libUIKit.showErrorMessage(rsp);
            }
        }, theLayer);
    }
    else{
        thePage = page;
        theMe = theCache[theMode][page].me;
        loadPage(theCache[theMode][page].lst);
    }
}

function loadPage(list){
    //clear up
    theCurrentGroup.theListLayer.removeAllChildren();
    theLIST = [];
    theRankList = list;
    if( theRankList.length == 0 ){
        var size = cc.size(0, 0);
        var label = cc.LabelTTF.create("暂时还没有数据", UI_FONT, UI_SIZE_XL);
        var viewSize = theCurrentGroup.scroller.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, -2*viewSize.height/5));
        theCurrentGroup.theListLayer.addChild(label);
    }
    else{
        theLayer.LOAD_SIZE = cc.size(BAR_WIDTH, BAR_HEIGHT*theRankList.length+BAR_OFFSET);
        theLayer.LOAD_INDEX = 0;
        theLayer.LOAD_FLAG = true;

        var size = theLayer.LOAD_SIZE;
    }

    //reform the list
    theCurrentGroup.theListLayer.setContentSize(size);
    var off = theCurrentGroup.scroller.getContentOffset();
    off.y = theCurrentGroup.scroller.minContainerOffset().y;
//    debug("minContainerOffset.Y:"+off.y);
    theCurrentGroup.scroller.setContentOffset(off);
}

function update(delta){
    if( this.LOAD_FLAG === true ){
        var offY = theCurrentGroup.scroller.getContentOffset().y - theCurrentGroup.scroller.minContainerOffset().y;
        var idxOff = BAR_HEIGHT * this.LOAD_INDEX;
        var isInFrame = idxOff >= offY && idxOff <= (offY+BAR_HEIGHT*6);
//        debug("offY:"+offY+"  idxOff:"+idxOff+"  isInFrame:"+isInFrame);
        if( this.LOAD_INDEX < theRankList.length ){
            if(isInFrame){
                var role = new libRole.Role(theRankList[this.LOAD_INDEX]);
                role.fix();
                var rank = thePage*PAGE_SIZE+1+this.LOAD_INDEX;
                var node = createRoleBar(role, rank);
                node.setPosition(cc.p(0, this.LOAD_SIZE.height - this.LOAD_INDEX*BAR_HEIGHT - BAR_HEIGHT - FIRST_GAP));
                node.KEY = Number(this.LOAD_INDEX);
                theCurrentGroup.theListLayer.addChild(node);
                theLIST.push(node);
                this.LOAD_INDEX++;
            }
        }
        else{
            this.LOAD_FLAG = false;
        }
    }
    var bars = theCurrentGroup.theListLayer.getChildren();
    if( bars != null){
        for( var k in bars ){
            var layerPos = theCurrentGroup.nodeContent.getPosition();
            var layerSize = theCurrentGroup.nodeContent.getContentSize();
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

function updatePageNumber(page){
    var p = page+1;
    if( page <= PAGE_COUNT ){
        theCurrentGroup.labPage.setString(p+"/"+PAGE_COUNT);
    }
    else{
        theCurrentGroup.labPage.setString(p);
    }
}

function onMyPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var myPage = Math.floor(theMe/PAGE_SIZE);
    if( myPage != thePage ){
        fillPage(myPage);
        updatePageNumber(myPage);
    }
}

function onFirstPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( thePage != 0 ){
        fillPage(0);
        updatePageNumber(0);
    }
}

function onPreviousPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( thePage == 0 ){
        PopMsg.pop("已经到第一页了", POPTYPE_ERROR);
    }
    else{
        var page = thePage-1;
        if( page < 0 ) page = 0;
        if( page > PAGE_COUNT-1 ) page = PAGE_COUNT-1;

        fillPage(page);
        updatePageNumber(page);
    }
}

function onNextPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( thePage == PAGE_COUNT-1 ){
        PopMsg.pop("已经到最后一页了", POPTYPE_ERROR);
    }
    else{
        if( theRankList.length == 10){
            var page = thePage+1;
            if( page < 0 ) page = 0;
            if( page > PAGE_COUNT-1 ) page = PAGE_COUNT-1;

            fillPage(page);
            updatePageNumber(page);
        }
    }
}

function onLastPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( thePage != PAGE_COUNT-1 && theRankList.length == 10){
        fillPage(PAGE_COUNT-1);
        updatePageNumber(PAGE_COUNT-1);
    }
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theMode = MODE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function onUIAnimationCompleted(name){
    isFlying = false;
    if( theMode == MODE_EXIT ){
        var main = loadModule("sceneMain.js");
        engine.ui.newScene(main.scene());
    }

    if( theMode < MODE_EXIT ){
        if( theTransitionGroup != null ){
            theCurrentGroup = theTransitionGroup;
            theTransitionGroup = null;
            theLayer.LOAD_FLAG = true;
            theLayer.LOAD_INDEX = 0;
            fillPage(0);
            updatePageNumber(0);
        }
        if( !isScheduling ){
            theLayer.scheduleUpdate();
            isScheduling = true;
        }
    }
}

function onPower() {
    if( isFlying ) return;
    if(theCurrentGroup != null && theCurrentGroup.theListLayer != null) {
        theCurrentGroup.theListLayer.removeAllChildren();
    }
    if( theMode < MODE_BATTLEPOWER ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        theLayer.unscheduleUpdate();
        isScheduling = false;
        isFlying = true;
    }
    else if( theMode > MODE_BATTLEPOWER ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        theLayer.unscheduleUpdate();
        isScheduling = false;
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        isFlying = false;
    }
    theMode = MODE_BATTLEPOWER;
    setModeTag(theMode);
}

function onEndless() {
    if( isFlying ) return;
    if(theCurrentGroup != null && theCurrentGroup.theListLayer != null) {
        theCurrentGroup.theListLayer.removeAllChildren();
    }
    if( theMode < MODE_ENDLESS ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        theLayer.unscheduleUpdate();
        isScheduling = false;
        isFlying = true;
    }
    else if( theMode > MODE_ENDLESS ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        theLayer.unscheduleUpdate();
        isScheduling = false;
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        isFlying = false;
    }
    theMode = MODE_ENDLESS;
    setModeTag(theMode);
}

function onKill() {
    if( isFlying ) return;
    if(theCurrentGroup != null && theCurrentGroup.theListLayer != null) {
        theCurrentGroup.theListLayer.removeAllChildren();
    }
    if( theMode < MODE_KILL ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        theLayer.unscheduleUpdate();
        isScheduling = false;
        isFlying = true;
    }
    else if( theMode > MODE_KILL ){
        //to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        theLayer.unscheduleUpdate();
        isScheduling = false;
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        isFlying = false;
    }
    theMode = MODE_KILL;
    setModeTag(theMode);
}

function setModeTag(mode){
    var sfc = cc.SpriteFrameCache.getInstance();
    if( mode == MODE_BATTLEPOWER ){
        theLayer.owner.btnPower.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnph1.png"));
        theLayer.owner.btnPower.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnph2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("ranking-title.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("ranking-title.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("ranking-title.png"));
        theLayer.owner.btnPower.setEnabled(false);
    }
    else{
        theLayer.owner.btnPower.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnph2.png"));
        theLayer.owner.btnPower.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnph1.png"));
        theLayer.owner.btnPower.setEnabled(true);
    }
    if( mode == MODE_ENDLESS ){
        theLayer.owner.btnEndless.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnwj1.png"));
        theLayer.owner.btnEndless.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnwj2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("ranking-titlewj.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("ranking-titlewj.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("ranking-titlewj.png"));
        theLayer.owner.btnEndless.setEnabled(false);
    }
    else{
        theLayer.owner.btnEndless.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnwj2.png"));
        theLayer.owner.btnEndless.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnwj1.png"));
        theLayer.owner.btnEndless.setEnabled(true);
    }
    if( mode == MODE_KILL ){
        theLayer.owner.btnKill.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnsg1.png"));
        theLayer.owner.btnKill.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnsg2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("ranking-titlesg.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("ranking-titlesg.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("ranking-titlesg.png"));
        theLayer.owner.btnKill.setEnabled(false);
    }
    else{
        theLayer.owner.btnKill.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnsg2.png"));
        theLayer.owner.btnKill.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnsg1.png"));
        theLayer.owner.btnKill.setEnabled(true);
    }
}

function onEnter()
{
    theCache[MODE_BATTLEPOWER] = [];
    theCache[MODE_ENDLESS] = [];
    theCache[MODE_KILL] = [];
    theLayer = this;
    isFlying = false;
    isScheduling = false;
    theSelect = null;
    theCurrentGroup = null;

    this.owner = {};
    this.owner.onPower = onPower;
    this.owner.onEndless = onEndless;
    this.owner.onKill = onKill;
    this.owner.onClose = onClose;
    this.owner.onMyPage = onMyPage;
    this.owner.onFirstPage = onFirstPage;
    this.owner.onPreviousPage = onPreviousPage;
    this.owner.onNextPage = onNextPage;
    this.owner.onLastPage = onLastPage;
    var node = libUIC.loadUI(this, "sceneRanking.ccbi", {
        nodeContent:{
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
        }
    });
    theLayer.node = node;
    this.addChild(node);
    theMode = MODE_BATTLEPOWER;
    this.update = update;
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");

    //set domains
    theLeft = {};
    {
        theLeft.scroller = this.ui.scrollerL;
        theLeft.labTitle = this.owner.labTitleL;
        theLeft.labPage = this.owner.labelPageL;
        theLeft.scrollTop = this.owner.scrollTopL;
        theLeft.scrollBottom = this.owner.scrollBottomL;
        theLeft.theListLayer = cc.Layer.create();
        theLeft.scroller.setContainer(theLeft.theListLayer);
        theLeft.nodeContent = this.owner.nodeContentL;
        var offL = theLeft.scroller.getContentOffset();
        offL.y = theLeft.scroller.minContainerOffset().y;
        theLeft.scroller.setContentOffset(offL);
    }
    theRight = {};
    {
        theRight.scroller = this.ui.scrollerR;
        theRight.labTitle = this.owner.labTitleR;
        theRight.labPage = this.owner.labelPageR;
        theRight.scrollTop = this.owner.scrollTopR;
        theRight.scrollBottom = this.owner.scrollBottomR;
        theRight.theListLayer = cc.Layer.create();
        theRight.scroller.setContainer(theRight.theListLayer);
        theRight.nodeContent = this.owner.nodeContentR;
        var offR = theRight.scroller.getContentOffset();
        offR.y = theRight.scroller.minContainerOffset().y;
        theRight.scroller.setContentOffset(offR);
    }
    theCenter = {};
    {
        theCenter.scroller = this.ui.scroller;
        theCenter.labTitle = this.owner.labTitle;
        theCenter.labPage = this.owner.labelPage;
        theCenter.scrollTop = this.owner.scrollTop;
        theCenter.scrollBottom = this.owner.scrollBottom;
        theCenter.theListLayer = cc.Layer.create();
        theCenter.scroller.setContainer(theCenter.theListLayer);
        theCenter.nodeContent = this.owner.nodeContent;
        var off = theCenter.scroller.getContentOffset();
        off.y = theCenter.scroller.minContainerOffset().y;
        theCenter.scroller.setContentOffset(off);
    }
    engine.ui.regMenu(this.owner.menuRoot);

    onPower();
    fillPage(0);
    updatePageNumber(0);
    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("rank");
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
        onActivate: onActivate
    }
}

exports.scene = scene;