/**
 * User: hammer
 * Date: 13-8-29
 * Time: 下午6:00
 */

;
var theLayer = null;
var ui = loadModule("UIComposer.js");

function onEvent(event)
{
    return false;
}

function onClose(sender){
    var main = loadModule("sceneMain.js");
    engine.ui.newScene(main.scene());
}

function onEnter()
{
    theLayer = this;

    theLayer.owner = {};
    theLayer.owner.onClose = onClose;


    var node = cc.BuilderReader.load("sceneShop2.ccbi", theLayer.owner);
    theLayer.addChild(node);
}

function onExit()
{
}

function scene()
{
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onEvent
    };
}

exports.scene = scene;