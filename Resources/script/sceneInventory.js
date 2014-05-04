/**
 * User: hammer
 * Date: 13-8-28
 * Time: 下午2:44
 */

var libItem = loadModule("xitem.js");
var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libItemInfo = loadModule("itemInfo.js");
var libUIKit = loadModule("uiKit.js");
var theLayer = null;

//contants
var GRID_SIZE = UI_ITEM_SIZE;
var GRID_GAP = UI_ITEM_GAP;
var LINE_COUNT = 5;
var MARGIN_TOP = 30;
var MARGIN_BUTTOM = 70;

var theLeft;
var theRight;
var theCenter;
var theCurrentGroup;
var theTransitionGroup;

var INVENTORY_GAME = 0;
var INVENTORY_SHOP = 1;
var INVENTORY_EXIT = 2;
var currentMode;
var isFlying = false;

var touchPosBeginWorld;

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    currentMode = INVENTORY_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function calcPosId(lpos)
{
    var rpos = cc.p(lpos.x, theCenter.theGridLayer.getContentSize().height - lpos.y);
    var PY = Math.floor((rpos.y - MARGIN_TOP)/(GRID_SIZE+GRID_GAP));
    var PX = Math.floor(rpos.x/(GRID_GAP+GRID_SIZE));
    var PYoff = rpos.y - MARGIN_TOP - PY*(GRID_SIZE+GRID_GAP);
    var PXoff = rpos.x - PX*(GRID_SIZE+GRID_GAP);
    if( PXoff < 100 && PYoff < 100 )
    {
        var ret = PX + PY*LINE_COUNT;
        if( PX >= LINE_COUNT || ret >= theCenter.inventorySize )
        {
            ret = -1;
        }
        return ret;
    }
    else
    {
        return -1;
    }
}

function onTouchBegan(touch, event)
{
    touchPosBeginWorld = touch.getLocation();
    var localPos = theCenter.contentScroller.convertToNodeSpace(touchPosBeginWorld);
    var localSize = theCenter.contentScroller.getViewSize();
    if( localPos.x >= 0 && localPos.y >= 0
        && localPos.x <= localSize.width
        && localPos.y <= localSize.height ) return true;
    else return false;
}

function onTouchMoved(touch, event)
{
    theCenter.theScrollBar.updateScrollBar();
}

function onTouchEnded(touch, event)
{
    var pos = touch.getLocation();
    var dis = cc.pSub(pos, touchPosBeginWorld);
    if( cc.pLengthSQ(dis) < CLICK_RANGESQ )
    {//as click
        var localPos = theCenter.theGridLayer.convertToNodeSpace(touchPosBeginWorld);
        var id = calcPosId(localPos);
        //debug("CLICK ID = "+id);
        var item = theCenter.inventoryData[id];
        if( item != null )
        {
            cc.AudioEngine.getInstance().playEffect("card2.mp3");
            libItemInfo.show(item, true);
        }
    }
}

function onTouchCancelled(touch, event)
{
    onTouchEnded(touch, event);
}

function onNotify(ntf)
{
    switch(ntf.NTF)
    {
        case Message_UpdateTreasure:
        {
            theLeft.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            theRight.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            theCenter.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            return false;
        }
        case Message_UpdateInventoryCapacity:
        {
            if( currentMode == INVENTORY_GAME )
            {
                setInventorySize(theCurrentGroup, engine.user.inventory.Capacity);
            }
            return false;
        }
        case Message_UpdateItem:
        {
            if( currentMode == INVENTORY_GAME ) onNormalInventory();
            else onShopInventory();
            return false;
        }
    }
    return false;
}

function unsetInventory(group){
    group.itemList = [];
    group.theGridLayer.removeAllChildren();
    group.inventoryData = null;
}

function setNormalInventory(group){
    var sfc = cc.SpriteFrameCache.getInstance();
    group.labTitle.setDisplayFrame(sfc.getSpriteFrame("bag-titleyxdj.png"));
    group.btnExtend.setVisible(true);
    group.labelSpace.setVisible(true);

    //set size
    group.itemList = [];
    group.theGridLayer.removeAllChildren();
    group.inventoryData = engine.user.inventory.getNormalItems();
    var size = engine.user.inventory.Capacity;
    setInventorySize(group, size);

    var curroffset = group.contentScroller.getContentOffset();
    curroffset.y = group.contentScroller.minContainerOffset().y;
    group.contentScroller.setContentOffset(curroffset);
}

function onNormalInventory(sender)
{
    if( isFlying ) return;

    if( currentMode < INVENTORY_GAME ){
        // to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        setNormalInventory(theTransitionGroup);
        isFlying = true;
    }
    else if( currentMode > INVENTORY_GAME ){
        // to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        setNormalInventory(theTransitionGroup);
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        setNormalInventory(theCurrentGroup);
        isFlying = false;
    }
    currentMode = INVENTORY_GAME;

    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.owner.btnNormalInventory.setNormalSpriteFrame(sfc.getSpriteFrame("bag-buttonyxdj1.png"));
    theLayer.owner.btnNormalInventory.setSelectedSpriteFrame(sfc.getSpriteFrame("bag-buttonyxdj2.png"));
    theLayer.owner.btnNormalInventory.setEnabled(false);
    theLayer.owner.btnShopInventory.setNormalSpriteFrame(sfc.getSpriteFrame("bag-buttonsddj2.png"));
    theLayer.owner.btnShopInventory.setSelectedSpriteFrame(sfc.getSpriteFrame("bag-buttonsddj1.png"));
    theLayer.owner.btnShopInventory.setEnabled(true);
}

function setShopInventory(group){
    var sfc = cc.SpriteFrameCache.getInstance();
    group.labTitle.setDisplayFrame(sfc.getSpriteFrame("bag-titlesddj.png"));
    group.btnExtend.setVisible(false);
    group.labelSpace.setVisible(false);

    //set size
    group.itemList = [];
    group.theGridLayer.removeAllChildren();
    group.inventoryData = engine.user.inventory.getShopItems();
    var size = group.inventoryData.length;
    size = Math.ceil(size/5)*5;
    setInventorySize(group, size);

    if( size == 0 )
    {
        var label = cc.LabelTTF.create("暂无商店道具", UI_FONT, UI_SIZE_XL);
        var viewSize = group.contentScroller.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, -viewSize.height/3));
        group.theGridLayer.addChild(label);
    }

    var curroffset = group.contentScroller.getContentOffset();
    curroffset.y = group.contentScroller.minContainerOffset().y;
    group.contentScroller.setContentOffset(curroffset);
}

function onShopInventory(sender)
{
    if( isFlying ) return;

    if( currentMode < INVENTORY_SHOP ){
        // to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        setShopInventory(theTransitionGroup);
        isFlying = true;
    }
    else if( currentMode > INVENTORY_SHOP ){
        // to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        setShopInventory(theTransitionGroup);
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        setNormalInventory(theCurrentGroup);
        isFlying = false;
    }
    currentMode = INVENTORY_SHOP;

    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.owner.btnNormalInventory.setNormalSpriteFrame(sfc.getSpriteFrame("bag-buttonyxdj2.png"));
    theLayer.owner.btnNormalInventory.setSelectedSpriteFrame(sfc.getSpriteFrame("bag-buttonyxdj1.png"));
    theLayer.owner.btnNormalInventory.setEnabled(true);
    theLayer.owner.btnShopInventory.setNormalSpriteFrame(sfc.getSpriteFrame("bag-buttonsddj1.png"));
    theLayer.owner.btnShopInventory.setSelectedSpriteFrame(sfc.getSpriteFrame("bag-buttonsddj2.png"));
    theLayer.owner.btnShopInventory.setEnabled(false);
}

function onSort(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    engine.user.inventory.sort();
    if( currentMode == INVENTORY_GAME ) onNormalInventory();
    else onShopInventory();
}

function onExtend(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");

    var x = Math.floor((engine.user.inventory.Capacity-30)/5);
    var n = x+1;
    if( x > 5 ) x = 5;
    var cost = 50 + x*30;
    var str1 = "使用"+cost+"宝石来扩展5格仓库空间";
    var str2 = "剩余的宝石不足\n扩充仓库需要使用"+cost+"宝石\n是否需要充值?";
    libUIKit.confirmPurchase(Request_BuyFeature, {
        typ: 1
    }, str1, str2, cost,
    function(rsp){
        if( rsp.RET == RET_OK ){
            //统计
            tdga.itemPurchase("背包扩充"+n, 1, cost);
        }
    });
}

function clearInventory(group)
{
    for(var k in group.itemList)
    {
        var item = group.itemList[k];
        item.setItem(null);
    }
}

function setInventorySize(group, size)
{
    //update inventory size
    var lineCount = Math.ceil(size/LINE_COUNT);
    group.theGridLayer.setContentSize(cc.size((LINE_COUNT-1)*(GRID_SIZE+GRID_GAP) + GRID_SIZE, MARGIN_TOP+MARGIN_BUTTOM+lineCount*(GRID_SIZE+GRID_GAP)));
    //debug("GridLayerSize = "+JSON.stringify(theGridLayer.getContentSize()));

    group.theGridLayer.removeAllChildren();
    group.itemList = [];
    group.inventorySize = size;

    for(var k = 0; k<group.inventorySize; ++k)
    {
        addSlot(group, k);
    }

    loadInventory(group);
}

function loadInventory(group)
{
    var inv = group.inventoryData;

    debug("LOAD INVENTORY = \n"+JSON.stringify(inv));
    for(var k=0; k<group.inventorySize; ++k)
    {
        var itm = inv[k];
        group.itemList[k].setItem(itm);
        if( itm != null ){
            group.itemList[k].setAvailable(itm.isAvailable());
        }
    }
    group.labelSpace.setString(engine.user.inventory.Count+"/"+engine.user.inventory.Capacity);
}

function sortInventory()
{
    clearInventory(theCurrentGroup);
    theCurrentGroup.inventoryData.sort(function(a, b){
        var ClassA = libTable.queryTable(TABLE_ITEM, a.ClassId);
        var ClassB = libTable.queryTbale(TABLE_ITEM, b.ClassId);
        return ClassA.category - ClassB.category;
    });
    loadInventory(theCurrentGroup);
}

function addSlot(group, id)
{
    var slot = libItem.UIItem.create(null, true, "itembg2.png");
    slot.setTag(id);
    var PX = Math.floor(id%LINE_COUNT);
    var PY = Math.floor(id/LINE_COUNT);
    var pos = cc.p(PX*(GRID_SIZE+GRID_GAP)+GRID_SIZE/2, MARGIN_TOP+PY*(GRID_GAP+GRID_SIZE)+GRID_SIZE/2);
    pos.y = group.theGridLayer.getContentSize().height - pos.y;//reverse
    slot.setPosition(pos);
    group.theGridLayer.addChild(slot);
    group.itemList[id] = slot;
}

function removeSlot(group, id)
{
    if( group.itemList[id] != null )
    {
        group.itemList[id].removeFromParent();
        group.itemList[id] = null;
    }
}

function onUIAnimationCompleted(name){
    isFlying = false;
    switch(currentMode){
        case INVENTORY_EXIT:{
            var main = loadModule("sceneMain.js");
            engine.ui.newScene(main.scene());
        }break;
        case INVENTORY_GAME:
        {
            if( theTransitionGroup != null ){
                //move transition to normal
                setNormalInventory(theCenter);
                unsetInventory(theTransitionGroup);
                theTransitionGroup = null;
                theCurrentGroup = theCenter;
            }
        }break;
        case INVENTORY_SHOP:
        {
            if( theTransitionGroup != null ){
                //move transition to normal
                setShopInventory(theCenter);
                unsetInventory(theTransitionGroup);
                theTransitionGroup = null;
                theCurrentGroup = theCenter;
            }
        }break;
    }
}

function onEnter()
{
    theLayer = this;

    isFlying = false;

    this.owner = {};
    this.owner.onClose = onClose;
    this.owner.onNormalInventory = onNormalInventory;
    this.owner.onShopInventory = onShopInventory;
    this.owner.onSort = onSort;
    this.owner.onExtend = onExtend;

    var node = libUIC.loadUI(this, "sceneBag.ccbi", {
        nodeTreasure: {
            ui: "UITreasure",
            id: "treasureDisplay"
        },
        nodeTreasureL: {
            ui: "UITreasure",
            id: "treasureDisplayL"
        },
        nodeTreasureR: {
            ui: "UITreasure",
            id: "treasureDisplayR"
        },
        nodeContent: {
            ui: "UIScrollView",
            id: "contentScroller",
            dir: 1
        },
        nodeContentL: {
            ui: "UIScrollView",
            id: "contentScrollerL",
            dir: 1
        },
        nodeContentR: {
            ui: "UIScrollView",
            id: "contentScrollerR",
            dir: 1
        }
    });
    theLayer.node = node;
    this.addChild(node);
    //register menu root
    engine.ui.regMenu(this.owner.menuRoot);
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");

    //side domain
    theLeft = {};
    {//to the Left
        //assign
        theLeft.labTitle = this.owner.labTitleL;
        theLeft.labelSpace = this.owner.labelSpaceL;
        theLeft.scrollTop = this.owner.scrollTopL;
        theLeft.scrollBottom = this.owner.scrollBottomL;
        theLeft.btnSort = this.owner.btnSortL;
        theLeft.btnExtend = this.owner.btnExtendL;
        theLeft.treasureDisplay = this.ui.treasureDisplayL;
        //generate
        theLeft.itemList = [];
        theLeft.inventorySize = 0;
        theLeft.inventoryData = null;
        theLeft.theGridLayer = cc.Layer.create();
        theLeft.contentScroller = this.ui.contentScrollerL;
        theLeft.contentScroller.setContainer(theLeft.theGridLayer);
        theLeft.theScrollBar = UIScrollBar.create(this.owner.scrollTopL, this.owner.scrollBottomL, "scroll.png", this.ui.contentScrollerL);
        //init
        theLeft.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    }
    theRight = {};
    {//to the Right
        //assign
        theRight.labTitle = this.owner.labTitleR;
        theRight.labelSpace = this.owner.labelSpaceR;
        theRight.scrollTop = this.owner.scrollTopR;
        theRight.scrollBottom = this.owner.scrollBottomR;
        theRight.btnSort = this.owner.btnSortR;
        theRight.btnExtend = this.owner.btnExtendR;
        theRight.treasureDisplay = this.ui.treasureDisplayR;
        //generate
        theRight.itemList = [];
        theRight.inventorySize = 0;
        theRight.inventoryData = null;
        theRight.theGridLayer = cc.Layer.create();
        theRight.contentScroller = this.ui.contentScrollerR;
        theRight.contentScroller.setContainer(theRight.theGridLayer);
        theRight.theScrollBar = UIScrollBar.create(this.owner.scrollTopR, this.owner.scrollBottomR, "scroll.png", this.ui.contentScrollerR);
        //init
        theRight.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    }
    theCenter = {};
    {//to the Center
        //assign
        theCenter.labTitle = this.owner.labTitle;
        theCenter.labelSpace = this.owner.labelSpace;
        theCenter.scrollTop = this.owner.scrollTop;
        theCenter.scrollBottom = this.owner.scrollBottom;
        theCenter.btnSort = this.owner.btnSort;
        theCenter.btnExtend = this.owner.btnExtend;
        theCenter.treasureDisplay = this.ui.treasureDisplay;
        //generate
        theCenter.itemList = [];
        theCenter.inventorySize = 0;
        theCenter.inventoryData = null;
        theCenter.theGridLayer = cc.Layer.create();
        theCenter.contentScroller = this.ui.contentScroller;
        theCenter.contentScroller.setContainer(theCenter.theGridLayer);
        theCenter.theScrollBar = UIScrollBar.create(this.owner.scrollTop, this.owner.scrollBottom, "scroll.png", this.ui.contentScroller);
        //init
        theCenter.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    }
    theTransitionGroup = null;

    engine.user.actor.fix();//it's always right to update a role data in the first place

    currentMode = INVENTORY_GAME;
    onNormalInventory();

    //only center can be touched
    theCenter.theGridLayer.onTouchBegan = onTouchBegan;
    theCenter.theGridLayer.onTouchMoved = onTouchMoved;
    theCenter.theGridLayer.onTouchEnded = onTouchEnded;
    theCenter.theGridLayer.onTouchCancelled = onTouchCancelled;
    theCenter.theGridLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theCenter.theGridLayer.setTouchPriority(1);
    theCenter.theGridLayer.setTouchEnabled(true);

    engine.ui.regMenu(theCenter.theGridLayer);

    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);
    
    
}

function onActivate(){
    //schedule pop
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("inventory");
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