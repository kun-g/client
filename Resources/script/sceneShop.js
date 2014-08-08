/**
 * User: hammer
 * Date: 13-8-29
 * Time: 下午5:59
 */

var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");

var theLayer = null;
var theSelectedNode;
var touchPosBegin;
var theClickFlag;
var theLIST = [];

var theLeft;
var theRight;
var theCenter;
var theCurrentGroup;
var theTransitionGroup;
var isFlying;

//--- the confirm layer
var theConfirmItemClass;
var theConfirmShopItem;
var theConfirmLayer;
var theConfirmPrice;
var theConfirmCount;
var theCurrentPrice;

var BAR_WIDTH = 560;
var BAR_HEIGHT = 120;

//--- tags ---
var theTagButtons;
var theCurrentTag = -1;
var theMaxTag;

//--- purchase confirm begin ---
function onConfirmCancel(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theConfirmLayer.node.runAction(actionPopOut(function(){
        engine.ui.removeLayer(theConfirmLayer);
    }));
    if( theSelectedNode != null ){
        theSelectedNode.owner.nodeShadow.setVisible(false);
        theSelectedNode = null;
    }
}

function onConfirmPurchase(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    //check cost
    for(var k in theCurrentPrice){
        switch(k){
            case "gold":{
                if( engine.user.inventory.Gold < theCurrentPrice[k] ){
                    libUIKit.showAlert("金币数量不足");
                    return;
                }
            }break;
            case "diamond":{
                if( engine.user.inventory.Diamond < theCurrentPrice[k] ){
                    libUIKit.showAlert("宝石数量不足");
                    return;
                }
            }break;
        }
    }

    libUIKit.waitRPC(Request_StoreBuyItem, {
        sid: theConfirmShopItem.sid,
        cnt: Number(theConfirmCount.getString()),
        ver: engine.session.shop.version
    }, function(rsp){
        if( rsp.RET == RET_OK ){
            cc.AudioEngine.getInstance().playEffect("buy.mp3");
            if( theConfirmShopItem.cost.diamond != null ){
                tdga.itemPurchase(theConfirmItemClass.label,
                Number(theConfirmCount.getString()),
                theConfirmShopItem.cost.diamond);
            }
            libUIKit.showAlert("购买成功。");
        }
        else{
            libUIKit.showErrorMessage(rsp);
        }
    }, theConfirmLayer);
    onConfirmCancel();
}

function onConfirmUp(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var count = Number(theConfirmCount.getString());
    count++;
    if( count > 99 ){
        count = 1;
    }
    theConfirmCount.setString(count);
    var price = {};
    for(var k in theConfirmShopItem.cost){
        price[k] = theConfirmShopItem.cost[k]*count;
    }
    theConfirmPrice.setPrice(price);
    theCurrentPrice = price;
}

function onConfirmDown(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var count = Number(theConfirmCount.getString());
    count--;
    if( count < 1 ){
        count = 99;
    }
    theConfirmCount.setString(count);
    var price = {};
    for(var k in theConfirmShopItem.cost){
        price[k] = theConfirmShopItem.cost[k]*count;
    }
    theConfirmPrice.setPrice(price);
    theCurrentPrice = price;
}

function onConfirmEnter(){
    theConfirmLayer = this;

    this.owner = {};
    this.owner.onSell = null;

    this.node = libUIC.loadUI(this, "ui-iteminfo.ccbi", {
        nodeIcon:{
            ui: "UIItem",
            id: "icon",
            def: "wenhao.png"
        }
    });
    var mask = blackMask();
    var winSize = cc.Director.getInstance().getWinSize();
    this.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    this.addChild(mask);
    this.addChild(this.node);

    this.node.setScale(0);
    this.node.runAction(actionPopIn());
    engine.ui.regMenu(this.owner.menuRoot);

    //assign values
    var dummyItem = new libItem.Item({
        cid: theConfirmShopItem.cid,
        stc: theConfirmShopItem.cnt
    });
    this.ui.icon.setItem(dummyItem);
    this.owner.labelName.setString(theConfirmItemClass.label);

    //hide sell button
    this.owner.btnSell.setVisible(false);

    //main buttons
    var button1 = makeButton({
        label: "buttontext-qx.png",
        func: onConfirmCancel,
        obj: theConfirmLayer
    });
    button1.setPosition(this.owner.nodeButtonA.getPosition());
    this.owner.menuRoot.addChild(button1);
    var button2 = makeButton({
        label: "buttontext-buy.png",
        func: onConfirmPurchase,
        obj: theConfirmLayer,
        type: BUTTONTYPE_DEFAULT
    });
    button2.setPosition(this.owner.nodeButtonB.getPosition());
    this.owner.menuRoot.addChild(button2);

    //load content
    var owner = {};
    owner.onConfirmUp = onConfirmUp;
    owner.onConfirmDown = onConfirmDown;
    var node = cc.BuilderReader.load("ui-shopdesc.ccbi", owner);
    this.owner.nodeDesc.addChild(node);

    if( theConfirmItemClass.description != null && theConfirmItemClass.description != ""){
        owner.labelDesc.setString(theConfirmItemClass.description);
    }
    else{
        owner.labelDesc.setString("这是一件普普通通的道具");
        owner.labelDesc.setColor(cc.c3b(128, 128, 128));
    }

    theConfirmCount = owner.labCount;
    theConfirmCount.setString(1);
    if( theConfirmItemClass.category == 0 && theConfirmItemClass.subcategory == 0 ){
        owner.btnConfirmUp.setEnabled(false);
        owner.btnConfirmDown.setEnabled(false);
    }
    theConfirmPrice = UIPrice.create(theConfirmShopItem.cost);
    owner.nodePrice.addChild(theConfirmPrice);
    theCurrentPrice = theConfirmShopItem.cost;
}

function showPurchaseConfirm(){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    engine.ui.newLayer({
       onEnter: onConfirmEnter
    });
}
//--- purchase confirm end ---

function createStockBar(sitem){
    var layer = cc.Node.create();
    layer.owner = {};

    layer.NODE = libUIC.loadUI(layer, "ui-shop.ccbi", {
        nodeItem: {
            ui: "UIItem",
            id: "icon"
        }
    });
    layer.NODE.setPosition(cc.p(0, 0));
    layer.addChild(layer.NODE);

    //assign values
    var itemClass = libTable.queryTable(TABLE_ITEM, sitem.cid);
    var dummyItem = new libItem.Item({
        cid: sitem.cid,
        stc: sitem.cnt
    });
    layer.ui.icon.setItem(dummyItem);
    layer.owner.labName.setString(itemClass.label);

    var price = UIPrice.create(sitem.cost);
    price.setPosition(cc.p(-price.getLength(), 0));
    layer.owner.nodePrice.addChild(price);

    return layer;
}

function loadStocks(group, tag){
    theCurrentTag = tag;
    group.theListLayer.removeAllChildren();
    group.theLIST = [];

    //init
    var itemIndex = engine.session.shop.items;
    var itemList = engine.session.shop.categories[theCurrentTag];
    var size = cc.size(BAR_WIDTH, BAR_HEIGHT*itemList.length);
    for(var k in itemList){
        var shopItem = itemIndex[itemList[k]];
        var node = createStockBar(shopItem);
        node.setPosition(cc.p(0, size.height - k*BAR_HEIGHT - BAR_HEIGHT));
        node.SHOPITEM = shopItem;
        group.theListLayer.addChild(node);
        group.theLIST.push(node);
    }

    //reform the list
    group.theListLayer.setContentSize(size);
    var off = group.scroller.getContentOffset();
    off.y = group.scroller.minContainerOffset().y;
    group.scroller.setContentOffset(off);

    theClickFlag = false;
    theSelectedNode = null;
}

function onEvent(ntf)
{
    switch(ntf.NTF){
        case Message_UpdateTreasure:
        {
            theLeft.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            theRight.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            theCenter.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            return false;
        }
    }
    return false;
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theCurrentTag = -1;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

var tagSprites = [
    {
        one: "shop-tablb1.png",
        two: "shop-tablb2.png",
        title: "shop-title.png"
    },
    {
        one: "shop-tabzb1.png",
        two: "shop-tabzb2.png",
        title: "shop-titlezb.png"
    },
    {
        one: "shop-buttonvipbag1.png",
        two: "shop-buttonvipbag2.png",
        title: "shop-titlevipbx.png"
    }
];

function onTag(sender){
    var tag = sender.getTag();
    setTag(tag);
}

function unloadStocks(group){
    group.theListLayer.removeAllChildren();
}

function setTag(tag){
    if( isFlying ) return;

    var sfc = cc.SpriteFrameCache.getInstance();
    if( theCurrentTag >= 0 ){
        theTagButtons[theCurrentTag].setNormalSpriteFrame(sfc.getSpriteFrame(tagSprites[theCurrentTag].two));
        theTagButtons[theCurrentTag].setSelectedSpriteFrame(sfc.getSpriteFrame(tagSprites[theCurrentTag].one));
        theTagButtons[theCurrentTag].setEnabled(true);
    }
    //the new tag
    theTagButtons[tag].setNormalSpriteFrame(sfc.getSpriteFrame(tagSprites[tag].one));
    theTagButtons[tag].setSelectedSpriteFrame(sfc.getSpriteFrame(tagSprites[tag].two));
    theTagButtons[tag].setEnabled(false);
    theLeft.labTitle.setDisplayFrame(sfc.getSpriteFrame(tagSprites[tag].title));
    theRight.labTitle.setDisplayFrame(sfc.getSpriteFrame(tagSprites[tag].title));
    theCenter.labTitle.setDisplayFrame(sfc.getSpriteFrame(tagSprites[tag].title));

    if( theCurrentTag < tag ){
        // to right
        theLayer.node.animationManager.runAnimationsForSequenceNamed("right");
        theTransitionGroup = theRight;
        loadStocks(theTransitionGroup, tag);
        isFlying = true;
    }
    else if( theCurrentTag > tag ){
        // to left
        theLayer.node.animationManager.runAnimationsForSequenceNamed("left");
        theTransitionGroup = theLeft;
        loadStocks(theTransitionGroup, tag);
        isFlying = true;
    }
    else{
        //just load
        theTransitionGroup = null;
        theCurrentGroup = theCenter;
        loadStocks(theCurrentGroup, tag);
        isFlying = false;
    }
    theCurrentTag = tag;
}

function getNodeByPos(rpos){
    var size = theCenter.theListLayer.getContentSize();
    var rect = cc.rect(0, 0, size.width, size.height);
    if( cc.rectContainsPoint(rect, rpos) ){
        var index = theCenter.theLIST.length - Math.floor(rpos.y/BAR_HEIGHT) - 1;
        return theCenter.theLIST[index];
    }
    return null;
}

function onTouchBegan(touch, event){
    var pos = touch.getLocation();
    var rpos = theCenter.theListLayer.convertToNodeSpace(pos);
    var node = getNodeByPos(rpos);
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
            theConfirmShopItem = theSelectedNode.SHOPITEM;
            theConfirmItemClass = libTable.queryTable(TABLE_ITEM, theConfirmShopItem.cid);
            showPurchaseConfirm();
        }
        theClickFlag = false;
    }
}

function onTouchCancelled(touch, event){
    onTouchEnded(touch, event);
}

function onUIAnimationCompleted(name){
    isFlying = false;
    if( theCurrentTag < 0 ){
        engine.ui.newScene(loadModule("sceneMain.js").scene());
    }
    else{
        if( theTransitionGroup != null ){
            unloadStocks(theTransitionGroup);
            loadStocks(theCenter, theCurrentTag);
            theCurrentGroup = theCenter;
            theTransitionGroup = null;
        }
    }
}

function onEnter()
{
    theLayer = this;

    this.owner = {};
    this.owner.onClose = onClose;
    this.owner.onTag = onTag;

    var node = libUIC.loadUI(this, "sceneShop.ccbi", {
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
        nodeContent:{
            ui: "UIScrollView",
            id: "scroller",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        nodeContentL:{
            ui: "UIScrollView",
            id: "scrollerL",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        nodeContentR:{
            ui: "UIScrollView",
            id: "scrollerR",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        }
    });
    this.addChild(node);
    theLayer.node = node;
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");

    //set domains
    theLeft = {};
    {
        theLeft.treasureDisplay = this.ui.treasureDisplayL;
        theLeft.scroller = this.ui.scrollerL;
        theLeft.labTitle = this.owner.labTitleL;
        theLeft.scrollTop = this.owner.scrollTopL;
        theLeft.scrollBottom = this.owner.scrollBottomL;
        theLeft.theListLayer = cc.Layer.create();
        theLeft.scroller.setContainer(theLeft.theListLayer);
        var off = theLeft.scroller.getContentOffset();
        off.y = theLeft.scroller.minContainerOffset().y;
        theLeft.scroller.setContentOffset(off);
        theLeft.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    }
    theRight = {};
    {
        theRight.treasureDisplay = this.ui.treasureDisplayR;
        theRight.scroller = this.ui.scrollerR;
        theRight.labTitle = this.owner.labTitleR;
        theRight.scrollTop = this.owner.scrollTopR;
        theRight.scrollBottom = this.owner.scrollBottomR;
        theRight.theListLayer = cc.Layer.create();
        theRight.scroller.setContainer(theRight.theListLayer);
        var off = theRight.scroller.getContentOffset();
        off.y = theRight.scroller.minContainerOffset().y;
        theRight.scroller.setContentOffset(off);
        theRight.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    }
    theCenter = {};
    {
        theCenter.treasureDisplay = this.ui.treasureDisplay;
        theCenter.scroller = this.ui.scroller;
        theCenter.labTitle = this.owner.labTitle;
        theCenter.scrollTop = this.owner.scrollTop;
        theCenter.scrollBottom = this.owner.scrollBottom;
        theCenter.theListLayer = cc.Layer.create();
        theCenter.scroller.setContainer(theCenter.theListLayer);
        var off = theCenter.scroller.getContentOffset();
        off.y = theCenter.scroller.minContainerOffset().y;
        theCenter.scroller.setContentOffset(off);
        theCenter.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    }
    theTransitionGroup = null;
    isFlying = false;

    //give center touch
    theCenter.theListLayer.onTouchBegan = onTouchBegan;
    theCenter.theListLayer.onTouchMoved = onTouchMoved;
    theCenter.theListLayer.onTouchEnded = onTouchEnded;
    theCenter.theListLayer.onTouchCancelled = onTouchCancelled;
    theCenter.theListLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theCenter.theListLayer.setTouchPriority(1);
    theCenter.theListLayer.setTouchEnabled(true);

    engine.ui.regMenu(this.owner.menuRoot);
    engine.ui.regMenu(theCenter.theListLayer);

    theClickFlag = false;

    //init tag buttons
    theMaxTag = engine.session.shop.categories.length-1;
    theTagButtons = [];
    for(var i=0; i<3; ++i){
        theTagButtons[i] = this.owner.menuRoot.getChildByTag(i);
        if( i > theMaxTag ) theTagButtons[i].setVisible(false);
    }

    theCurrentTag = 0;
    setTag(0);

    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);
    
    
}

function onExit()
{
    loadModule("broadcastx.js").instance.close();
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("store");
}

function scene()
{
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onEvent,
        onActivate: onActivate
    };
}

function purchaseItem(cid, count, callback, thiz){
    //find store sid
    var shopItem = engine.session.queryStore(cid);
    if( shopItem != null ){
        for( var k in shopItem.cost ){
            switch(k){
                case "gold":{
                    if( engine.user.inventory.Gold < shopItem.cost[k] ){
                        libUIKit.showAlert(ErrorMsgs[1]);
                        //callback({RET: RET_NotEnoughGold});
                        return;
                    }
                }break;
                case "diamond":{
                    if( engine.user.inventory.Diamond < shopItem.cost[k] ){
                        libUIKit.showAlert(ErrorMsgs[2]);
                        //callback({RET: RET_NotEnoughDiamond});
                        return;
                    }
                }break;
                default: return;
            }
        }

        libUIKit.waitRPC(Request_StoreBuyItem, {
            sid: shopItem.sid,
            cnt: count,
            ver: engine.session.shop.version
        }, callback, thiz);
    }

}

exports.scene = scene;
exports.purchaseItem = purchaseItem;