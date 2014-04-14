/**
 * User: hammer
 * Date: 13-8-26
 * Time: 下午3:37
 */

var table = loadModule("table.js");

function onEnter()
{
    /*
    var theOwner = {};
    configParticle(theOwner);
    var node = cc.BuilderReader.load("effect-openChest2.ccbi", theOwner);
    node.animationManager.runAnimationsForSequenceNamed("effect");
    node.setPosition(cc.p(320, 480));
    this.addChild(node);
    */
    table.loadTable(TABLE_STAGE);
    var cfg = table.readTable(TABLE_STAGE);
    var ret = [];
    cfg.forEach(function (c) {
        c.stage.forEach(function (s) {
            if( ret[s.stageId] != null ){
                debug("--- dumplicated stageId "+ s.stageId);
            }
            ret[s.stageId] = s;
            ret[s.stageId].chapter = c.chapterId;
        });
    });
    debug("CHECK COMPLETE");
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