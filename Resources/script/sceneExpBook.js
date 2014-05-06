/**
 * Created by tringame on 14-5-6.
 */
var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");

var theLayer;

var touchPosBegin;

function onTouchBegan(touch, event){
    touchPosBegin = touch.getLocation();

    return true;
}

function onTouchMoved(touch, event){

}

function onTouchEnded(touch, event){

}

function onTouchCancelled(touch, event){
    onTouchEnded(touch, event);
}

//function onUIAnimationCompleted(name){
//   engine.ui.popLayer();
//}

function onNotify(event){
    return false;
}

function onActivate(){
}

function update(delta)
{
    //装备经验增长动画
}

function onEnter(){
    //load resource
//    for(var k in loadList){
//        var file = loadList[k];
//        cacheSprite(file);
//    }

    theLayer = this;

    var mask = blackMask();
    this.addChild(mask);

    this.owner = {};
    this.update = update;
    this.scheduleUpdate();

//    this.node = libUIC.loadUI(this, "sceneBounty.ccbi", {
//        layerList: {
//            ui: "UIScrollView",
//            id: "scrollList",
//            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
//        },
//        layerDesc: {
//            ui: "UIScrollView",
//            id: "scrollDesc",
//            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
//        }
//    });
    this.addChild(this.node);

    //this.node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    //this.node.animationManager.runAnimationsForSequenceNamed("open");

    //theLayer.ui.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);

    theLayer.onTouchBegan = onTouchBegan;
    theLayer.onTouchMoved = onTouchMoved;
    theLayer.onTouchEnded = onTouchEnded;
    theLayer.onTouchCancelled = onTouchCancelled;
    theLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theLayer.setTouchPriority(1);
    theLayer.setTouchEnabled(false);

    engine.ui.regMenu(this.owner.menuRoot);

}

function show(){
    engine.ui.newLayer({
        onNotify: onNotify,
        onEnter: onEnter,
        onActivate: onActivate
    });
}

exports.show = show;