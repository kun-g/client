/**
 * Created by jovidu on 14-6-17.
 */

var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libItem = loadModule("xitem.js");
var libUIKit = loadModule("uiKit.js");
var libEffect = loadModule("effect.js");
var libGadget = loadModule("gadgets.js");

var theLayer = null;
var isFlying = false;

var theMode;
var MODE_EXIT = 0;
var MODE_PVP = 1;

var theRivalsList;


function getRivals() {

}

function onRival() {

}

function onStartPK() {

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
    if( theMode == MODE_PVP ){
        getRivals();
    }
}

function onEnter() {

    theLayer = this;
    this.owner = {};
    this.owner.onRival = onRival;
    this.owner.onStartPK = onStartPK;
    this.owner.onClose = onClose;
    var node = libUIC.loadUI(this, "scenePVP.ccbi", {
        //bind todo?
    });
    theLayer.node = node;
    this.addChild(node);
    theMode = MODE_PVP;
    node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    node.animationManager.runAnimationsForSequenceNamed("open");

    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);
}

function onExit() {
    loadModule("broadcastx.js").instance.close();
}

function onNotify(ntf){
//    switch(ntf.NTF){
//    }
    return false;
}

function scene(){
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onNotify
//        onActivate: onActivate
    };
}

exports.scene = scene;