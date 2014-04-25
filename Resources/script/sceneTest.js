/**
 * User: hammer
 * Date: 13-8-26
 * Time: 下午3:37
 */

var table = loadModule("table.js");

function onEnter()
{
    var bounty = loadModule("bounty.js");
    var bb = new bounty.BountyLog();
    var tp = typeof(bb.getBountyListCount);
    debug("TYPE = "+tp);
    bb.getBountyListCount();
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