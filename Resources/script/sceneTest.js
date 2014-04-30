/**
 * User: hammer
 * Date: 13-8-26
 * Time: 下午3:37
 */

var table = loadModule("table.js");

function resp(rsp){
    //do nothing
}

function onEnter()
{

    while(true){

        engine.event.connectServer()

        var arg = {};
        arg.id = "testdevice";
        arg.tp = 1;
        arg.bv = system.getBinaryVersion();
        arg.rv = engine.game.getConfig().resource_version;
        arg.ch = engine.game.getConfig().binary_channel;
        arg.tk = "whatfuck";

        engine.event.sendRPCEvent(Request_AccountLogin, arg, resp, this);
    }
}

function onExit()
{

}

function scene()
{
    var scene = cc.Scene.create();
    scene.onEnter = onEnter;
    scene.onExit = onExit;
    return scene;
}

exports.scene = scene;