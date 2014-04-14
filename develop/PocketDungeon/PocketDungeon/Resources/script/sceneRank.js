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

var MODE_NORMAL = 0;
var MODE_EXIT = 1;

var RANK_BATTLEPOWER = 0;

var theLIST = [];
var theRankList;
var thePage;
var theMe;

var PAGE_SIZE = 10;//每页显示的玩家数量
var PAGE_COUNT = 5;

var BAR_WIDTH = 580;
var BAR_HEIGHT = 150;
var BAR_OFFSET = 80;

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
    layer.owner.labPower.setString(role.getPower());
    layer.ui.avatar.setRole(role);
    layer.owner.labBPRank = rank;

    //--- vip panel ---
    if( role.vip != null && role.vip > 0 ){
        layer.owner.nodeVip.setVisible(true);
    }

    layer.owner.btnRoleInfo.LAYER = layer;
    layer.ROLE = role;

    return layer;
}

function fillPage(page){
    engine.event.sendRPCEvent(Request_QueryLeaderboard, {
        me: true,
        src: page*PAGE_SIZE,
        cnt: PAGE_SIZE,
        typ: RANK_BATTLEPOWER
    }, function(rsp){
        if( rsp.RET == RET_OK ){
            thePage = page;
            theMe = rsp.me;
            loadPage(rsp.lst);
        }
        else{
            libUIKit.showErrorMessage(rsp);
        }
    }, theLayer);
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
    theLayer.ui.scroller.setContentOffset(off);
}

function update(delta){
    if( this.LOAD_FLAG === true ){
        if( this.LOAD_INDEX < theRankList.length ){
            var role = new libRole.Role(theRankList[this.LOAD_INDEX]);
            role.fix();
            var rank = thePage*PAGE_SIZE+1;
            var node = createRoleBar(role, rank);
            node.setPosition(cc.p(0, this.LOAD_SIZE.height - this.LOAD_INDEX*BAR_HEIGHT - BAR_HEIGHT));
            node.KEY = Number(this.LOAD_INDEX);
            theListLayer.addChild(node);
            theLIST.push(node);

            this.LOAD_INDEX++;
        }
        else{
            this.LOAD_FLAG = false;
        }
    }
}

function onMyPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var myPage = Math.floor(theMe/PAGE_SIZE);
    if( myPage != thePage ){
        fillPage(myPage);
    }
}

function onFirstPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( thePage != 0 ){
        fillPage(0);
    }
}

function onPreviousPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var page = thePage-1;
    if( page < 0 ){
        PopMsg.pop(POPTYPE_ERROR, "已经到第一页了");
    }
    else{
        fillPage(page);
    }
}

function onNextPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var page = thePage+1;
    if( page >= PAGE_COUNT ){
        PopMsg.pop(POPTYPE_ERROR, "已经到最后一页了");
    }
    else{
        fillPage(page);
    }
}

function onLastPage(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    fillPage(PAGE_COUNT-1);
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
}

function onEnter()
{
    theLayer = this;

    theSelect = null;

    this.owner = {};
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
        }
    });

    theLayer.node = node;
    this.addChild(node);
    theMode = MODE_NORMAL;
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");

    engine.ui.regMenu(this.owner.menuRoot);

    theListLayer = cc.Layer.create();
    this.ui.scroller.setContainer(theListLayer);
    var off = this.ui.scroller.getContentOffset();
    off.y = this.ui.scroller.minContainerOffset().y;
    this.ui.scroller.setContentOffset(off);

    fillPage(0);

    this.update = update;
    this.scheduleUpdate();

    //register broadcast
    loadModule("broadcast.js").instance.simpleInit(this);
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("rank");
}

function onExit()
{
    loadModule("broadcast.js").instance.close();
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