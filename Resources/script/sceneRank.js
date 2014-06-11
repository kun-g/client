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
//var theLeft;
//var theRight;
//var theCenter;
//var theTransitionGroup;
//var theCurrentGroup;
//var isFlying;


var theCache = [];

var PAGE_SIZE = 10;//每页显示的玩家数量
var PAGE_COUNT = 3;

var BAR_WIDTH = 580;
var BAR_HEIGHT = 150;
var BAR_OFFSET = 80;

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
    theListLayer.removeAllChildren();
    theLIST = [];
    theRankList = list;
    if( theRankList.length == 0 ){
        var size = cc.size(0, 0);
        var label = cc.LabelTTF.create("暂时还没有数据", UI_FONT, UI_SIZE_XL);
        var viewSize = theLayer.ui.scroller.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, -2*viewSize.height/5));
        theListLayer.addChild(label);
    }
    else{
        theLayer.LOAD_SIZE = cc.size(BAR_WIDTH, BAR_HEIGHT*theRankList.length+BAR_OFFSET);
        theLayer.LOAD_INDEX = 0;
        theLayer.LOAD_FLAG = true;

        var size = theLayer.LOAD_SIZE;
    }

    //reform the list
    theListLayer.setContentSize(size);
    var off = theLayer.ui.scroller.getContentOffset();
    off.y = theLayer.ui.scroller.minContainerOffset().y;
//    debug("minContainerOffset.Y:"+off.y);
    theLayer.ui.scroller.setContentOffset(off);
}

function update(delta){
    if( this.LOAD_FLAG === true ){
        var offY = theLayer.ui.scroller.getContentOffset().y - theLayer.ui.scroller.minContainerOffset().y; //todo?
        var idxOff = BAR_HEIGHT * this.LOAD_INDEX;
        var isInFrame = idxOff >= offY && idxOff <= (offY+BAR_HEIGHT*6);
//        debug("offY:"+offY+"  idxOff:"+idxOff+"  isInFrame:"+isInFrame);
        if( this.LOAD_INDEX < theRankList.length ){
            if(isInFrame){
                var role = new libRole.Role(theRankList[this.LOAD_INDEX]);
                role.fix();
                var rank = thePage*PAGE_SIZE+1+this.LOAD_INDEX;
                var node = createRoleBar(role, rank);
                node.setPosition(cc.p(0, this.LOAD_SIZE.height - this.LOAD_INDEX*BAR_HEIGHT - BAR_HEIGHT));
                node.KEY = Number(this.LOAD_INDEX);
                theListLayer.addChild(node);
                theLIST.push(node);
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
            if( cc.rectContainsPoint(rect, bars[k].getParent().convertToWorldSpace(bars[k].getPosition())) ){
                bars[k].owner.menuRoot.setTouchEnabled(true);
            }else{
                bars[k].owner.menuRoot.setTouchEnabled(false);
            }
        }
    }
}

function updatePageNumber(page){
    var p = page+1;
    if( page <= PAGE_COUNT ){
        theLayer.owner.labelPage.setString(p+"/"+PAGE_COUNT);
    }
    else{
        theLayer.owner.labelPage.setString(p);
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
    if( theMode == MODE_EXIT ){
        var main = loadModule("sceneMain.js");
        engine.ui.newScene(main.scene());
    }
    if( theMode < MODE_EXIT ){
        theLayer.scheduleUpdate();
    }
}

function onPower() {
    theMode = MODE_BATTLEPOWER;
    fillPage(0);
    updatePageNumber(0);
}

function onEndless() {
    theMode = MODE_ENDLESS;
    fillPage(0);
    updatePageNumber(0);
}

function onKill() {
    theMode = MODE_KILL;
    fillPage(0);
    updatePageNumber(0);
}

function onEnter()
{
    theCache[MODE_BATTLEPOWER] = [];
    theCache[MODE_ENDLESS] = [];
    theCache[MODE_KILL] = [];
    theLayer = this;

    theSelect = null;

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
        }/*,
        nodeContentL: {
            ui: "UIScrollView",
            id: "scrollerL",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        nodeContentR: {
            ui: "UIScrollView",
            id: "scrollerR",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        }*/
    });
    theLayer.node = node;
    this.addChild(node);
    theMode = MODE_BATTLEPOWER;
    this.update = update;
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");

    //set domains TODO?
    engine.ui.regMenu(this.owner.menuRoot);
    theListLayer = cc.Layer.create();
    this.ui.scroller.setContainer(theListLayer);
    var off = this.ui.scroller.getContentOffset();
    off.y = this.ui.scroller.minContainerOffset().y;
    this.ui.scroller.setContentOffset(off);
    onPower();
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