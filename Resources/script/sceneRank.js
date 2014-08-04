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

var MODE_EXIT = -1;
var MODE_BATTLEPOWER = 0;
var MODE_PVP = 1;
var MODE_WORLD = 2;
var MODE_ENDLESS = 3;
var MODE_KILL = 4;

var FirstLoad = 0;
var isShowedOut = false;

function getRankId(mode) {
    switch (mode){
        case MODE_BATTLEPOWER: return RANK_BATTLEPOWER;
        case MODE_PVP: return RANK_PVP;
        case MODE_WORLD: return RANK_WORLD;
        case MODE_ENDLESS: return RANK_ENDLESS;
        case MODE_KILL: return RANK_KILL;
        default : return null;
    }
}

var theLIST = [];
var theRankList;
var thePage;
var theMe;
var theMenus = [];

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

var LOAD_INDEX;
var LOAD_FLAG;
var LOAD_SIZE;

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
    for(var i=0; i<5; i++){
        layer.owner["spType"+i].setVisible(getRankId(theMode) == i);
        layer.owner["spPattern"+i].setVisible(getRankId(theMode) == i);
    }
    if( theMode == MODE_PVP ){
        layer.owner.labPower.setString(role.getPower());
    }else{
        layer.owner.labPower.setString(role.Score);
    }

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
    if( theCache[getRankId(theMode)][page] == null ){
        engine.event.sendRPCEvent(Request_QueryLeaderboard, {
            me: true,
            src: page*PAGE_SIZE,
            cnt: PAGE_SIZE,
            typ: getRankId(theMode)
        }, function(rsp){
            if( rsp.RET == RET_OK ){
                thePage = page;
                theMe = rsp.me;
                theCache[getRankId(theMode)][page] = rsp;//cache
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
        theMe = theCache[getRankId(theMode)][page].me;
        loadPage(theCache[getRankId(theMode)][page].lst);
    }
}

function loadPage(list){
    //clear up
    theCurrentGroup.theListLayer.removeAllChildren();
    theLIST = [];
    theRankList = list;
    for(var k in theMenus){
        var m = theMenus[k];
        engine.ui.unregMenu(m);
    }
    theMenus = [];

    if( theRankList.length == 0 ){
        var size = cc.size(0, 0);
        var label = cc.LabelTTF.create(translate(engine.game.language, "sceneRankNoData"), UI_FONT, UI_SIZE_XL);
        var viewSize = theCurrentGroup.scroller.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, -2*viewSize.height/5));
        theCurrentGroup.theListLayer.addChild(label);
    }
    else{
        LOAD_SIZE = cc.size(BAR_WIDTH, BAR_HEIGHT*theRankList.length+BAR_OFFSET);
        LOAD_INDEX = 0;
        LOAD_FLAG = true;

        var size = LOAD_SIZE;
    }

    //reform the list
    theCurrentGroup.theListLayer.setContentSize(size);
    var off = theCurrentGroup.scroller.getContentOffset();
    off.y = theCurrentGroup.scroller.minContainerOffset().y;
//    debug("minContainerOffset.Y:"+off.y);
    theCurrentGroup.scroller.setContentOffset(off);
}

function update(delta){
    if( LOAD_FLAG === true ){
        var offY = theCurrentGroup.scroller.getContentOffset().y - theCurrentGroup.scroller.minContainerOffset().y;
        var idxOff = BAR_HEIGHT * LOAD_INDEX;
        var isInFrame = idxOff >= offY && idxOff <= (offY+BAR_HEIGHT*6);
//        debug("offY:"+offY+"  idxOff:"+idxOff+"  isInFrame:"+isInFrame);
        if( LOAD_INDEX < theRankList.length ){
            if(isInFrame){
                var role = new libRole.Role(theRankList[LOAD_INDEX]);
                role.fix();
                var rank = thePage*PAGE_SIZE+1+LOAD_INDEX;
                var node = createRoleBar(role, rank);
                node.setPosition(cc.p(0, LOAD_SIZE.height - LOAD_INDEX*BAR_HEIGHT - BAR_HEIGHT - FIRST_GAP));
                node.KEY = Number(LOAD_INDEX);
                theCurrentGroup.theListLayer.addChild(node);
                theLIST.push(node);
                var m = node.owner.menuRoot;
                engine.ui.regMenu(m);
                theMenus.push(m);
                LOAD_INDEX++;
            }
        }
        else{
            LOAD_FLAG = false;
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
        PopMsg.pop(translate(engine.game.language, "sceneRankFirstPage"), POPTYPE_ERROR);
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
        PopMsg.pop(translate(engine.game.language, "sceneRankLastPage"), POPTYPE_ERROR);
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
        if (isShowedOut) {
            engine.ui.popLayer();
        }else{
            var main = loadModule("sceneMain.js");
            engine.ui.newScene(main.scene());
        }

    }

    if( theMode > MODE_EXIT ){
        if( theTransitionGroup != null ){
            theCurrentGroup = theTransitionGroup;
            theTransitionGroup = null;
            LOAD_FLAG = true;
            LOAD_INDEX = 0;
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

function onPVP() {
    if( isFlying ) return;
    if(theCurrentGroup != null && theCurrentGroup.theListLayer != null) {
        theCurrentGroup.theListLayer.removeAllChildren();
    }
    if( theMode < MODE_PVP ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        theLayer.unscheduleUpdate();
        isScheduling = false;
        isFlying = true;
    }
    else if( theMode > MODE_PVP ){
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
    theMode = MODE_PVP;
    setModeTag(theMode);
}

function onWorld() {
    if( isFlying ) return;
    if(theCurrentGroup != null && theCurrentGroup.theListLayer != null) {
        theCurrentGroup.theListLayer.removeAllChildren();
    }
    if( theMode < MODE_WORLD ){
        //to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        theLayer.unscheduleUpdate();
        isScheduling = false;
        isFlying = true;
    }
    else if( theMode > MODE_WORLD ){
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
    theMode = MODE_WORLD;
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
    if( mode == MODE_PVP ){
        theLayer.owner.btnPVP.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnjjc1.png"));
        theLayer.owner.btnPVP.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnjjc2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("ranking-titlepk.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("ranking-titlepk.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("ranking-titlepk.png"));
        theLayer.owner.btnPVP.setEnabled(false);
    }
    else{
        theLayer.owner.btnPVP.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnjjc2.png"));
        theLayer.owner.btnPVP.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnjjc1.png"));
        theLayer.owner.btnPVP.setEnabled(true);
    }
    if( mode == MODE_WORLD ){
        theLayer.owner.btnWorld.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnsjfb1.png"));
        theLayer.owner.btnWorld.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnsjfb2.png"));
        theLayer.owner.labTitle.setDisplayFrame(sfc.getSpriteFrame("ranking-titlesjfb.png"));
        theLayer.owner.labTitleL.setDisplayFrame(sfc.getSpriteFrame("ranking-titlesjfb.png"));
        theLayer.owner.labTitleR.setDisplayFrame(sfc.getSpriteFrame("ranking-titlesjfb.png"));
        theLayer.owner.btnWorld.setEnabled(false);
    }
    else{
        theLayer.owner.btnWorld.setNormalSpriteFrame(sfc.getSpriteFrame("ranking-btnsjfb2.png"));
        theLayer.owner.btnWorld.setSelectedSpriteFrame(sfc.getSpriteFrame("ranking-btnsjfb1.png"));
        theLayer.owner.btnWorld.setEnabled(true);
    }
}

function onEnter()
{
    theCache[MODE_BATTLEPOWER] = [];
    theCache[MODE_ENDLESS] = [];
    theCache[MODE_KILL] = [];
    theCache[MODE_PVP] = [];
    theCache[MODE_WORLD] = [];
    theLayer = this;
    isFlying = false;
    isScheduling = false;
    theSelect = null;
    theCurrentGroup = null;

    theLayer.owner = {};
    theLayer.owner.onPower = onPower;
    theLayer.owner.onEndless = onEndless;
    theLayer.owner.onKill = onKill;
    theLayer.owner.onClose = onClose;
    theLayer.owner.onMyPage = onMyPage;
    theLayer.owner.onFirstPage = onFirstPage;
    theLayer.owner.onPreviousPage = onPreviousPage;
    theLayer.owner.onNextPage = onNextPage;
    theLayer.owner.onLastPage = onLastPage;
    theLayer.owner.onPVP = onPVP;
    theLayer.owner.onWorld = onWorld;
    var node = libUIC.loadUI(theLayer, "sceneRanking.ccbi", {
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
    theLayer.addChild(node);
//    theMode = MODE_BATTLEPOWER;
    theLayer.update = update;
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");

    //set domains
    theLeft = {};
    {
        theLeft.scroller = theLayer.ui.scrollerL;
        theLeft.labTitle = theLayer.owner.labTitleL;
        theLeft.labPage = theLayer.owner.labelPageL;
        theLeft.scrollTop = theLayer.owner.scrollTopL;
        theLeft.scrollBottom = theLayer.owner.scrollBottomL;
        theLeft.theListLayer = cc.Layer.create();
        theLeft.scroller.setContainer(theLeft.theListLayer);
        theLeft.nodeContent = theLayer.owner.nodeContentL;
        var offL = theLeft.scroller.getContentOffset();
        offL.y = theLeft.scroller.minContainerOffset().y;
        theLeft.scroller.setContentOffset(offL);
    }
    theRight = {};
    {
        theRight.scroller = theLayer.ui.scrollerR;
        theRight.labTitle = theLayer.owner.labTitleR;
        theRight.labPage = theLayer.owner.labelPageR;
        theRight.scrollTop = theLayer.owner.scrollTopR;
        theRight.scrollBottom = theLayer.owner.scrollBottomR;
        theRight.theListLayer = cc.Layer.create();
        theRight.scroller.setContainer(theRight.theListLayer);
        theRight.nodeContent = theLayer.owner.nodeContentR;
        var offR = theRight.scroller.getContentOffset();
        offR.y = theRight.scroller.minContainerOffset().y;
        theRight.scroller.setContentOffset(offR);
    }
    theCenter = {};
    {
        theCenter.scroller = theLayer.ui.scroller;
        theCenter.labTitle = theLayer.owner.labTitle;
        theCenter.labPage = theLayer.owner.labelPage;
        theCenter.scrollTop = theLayer.owner.scrollTop;
        theCenter.scrollBottom = theLayer.owner.scrollBottom;
        theCenter.theListLayer = cc.Layer.create();
        theCenter.scroller.setContainer(theCenter.theListLayer);
        theCenter.nodeContent = theLayer.owner.nodeContent;
        var off = theCenter.scroller.getContentOffset();
        off.y = theCenter.scroller.minContainerOffset().y;
        theCenter.scroller.setContentOffset(off);
    }
    engine.ui.regMenu(theLayer.owner.menuRoot);
    engine.ui.regMenu(theLayer.owner.menuRoot1);
    engine.ui.regMenu(theLayer.owner.menuRoot2);
    engine.ui.regMenu(theLayer.owner.menuRoot3);

    if( engine.session.dataBounty[3] != null
        && engine.session.dataBounty[3].sta == 1 ){
        theLayer.owner.btnEndless.setVisible(true);
        theLayer.owner.btnKill.setVisible(false);
    }else if( engine.session.dataBounty[4] != null
        && engine.session.dataBounty[4].sta == 1){
        theLayer.owner.btnEndless.setVisible(false);
        theLayer.owner.btnKill.setVisible(true);
    }else{
        theLayer.owner.btnEndless.setVisible(false);
        theLayer.owner.btnKill.setVisible(false);
    }
//    theLayer.owner.btnPVP.setVisible(false);
    switch (FirstLoad){
        case RANK_BATTLEPOWER: {theMode = MODE_BATTLEPOWER; onPower();}break;
        case RANK_ENDLESS: {theMode = MODE_ENDLESS; onEndless();} break;
        case RANK_KILL: {theMode = MODE_KILL; onKill();}break;
        case RANK_PVP: {theMode = MODE_PVP; onPVP();} break;
        case RANK_WORLD: {theMode = MODE_WORLD; onWorld();} break;
        default : onPower();break;
    }
    fillPage(0);
    updatePageNumber(0);
    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(theLayer);
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
    isShowedOut = false;
    FirstLoad = RANK_BATTLEPOWER;
    return {
        onEnter: onEnter,
        onExit: onExit,
        onActivate: onActivate
    }
}

exports.scene = scene;

function show(rankId){
    isShowedOut = true;
    FirstLoad = rankId;
    engine.ui.newLayer({
        onEnter: onEnter,
        onExit: onExit,
        onActivate: onActivate
    });
}

exports.show = show;
