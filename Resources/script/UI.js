/**
 * User: hammer
 * Date: 13-10-12
 * Time: 上午11:15
 *
 * UIManager 用来管理游戏中所有的UI
 *
 */

var director = cc.Director.getInstance();

function UIManager()
{
    this.LAYERS = [];
    //quick reference
    this.curScene = null;
    this.curLayer = null;
}

UIManager.prototype.start = function(assign)
{
    var scene = cc.Scene.create();
    director.runWithScene(scene);
    singleton.LAYERS = [];
    singleton.curScene = scene;

    singleton.newLayer(assign);
}

//pass in the new scene
UIManager.prototype.newScene = function(assign)
{
    //pop out all the layers
    while( singleton.curLayer != null )
    {
        singleton.popLayer();
    }

    var scene = cc.Scene.create();
    singleton.LAYERS = [];
    singleton.curScene = scene;

    //replace scene
    director.replaceScene(scene);

    singleton.newLayer(assign);
    singleton.LAYERS[0].backClicked = function(){
        system.alert("离开游戏", "确认要退出游戏吗？", null, function(btn){
                       if( btn != 0 ){//switch
                           system.exit();
                       }
                  }, "点错了", "退出");
    };
    singleton.LAYERS[0].setKeypadEnabled(true);
}

/*
    如果需要注册命令处理回调，给onCommand赋值
    如果需要重载onCommand的this，给THIZ赋值
 */
UIManager.prototype.newLayer = function(assign)
{
    //disable old layer
    if( singleton.curLayer != null )
    {
        disableLayer(singleton.curLayer);
    }

    //add new layer
    var layer = cc.Layer.create();

    layer.MENUS = [];
    copyProperties(layer, assign);
    singleton.LAYERS.push(layer);
    singleton.curLayer = layer;

    //auto assign
    if( layer.onNotify != null )
    {
        engine.event.pushNTFHandler(layer.onNotify, layer);
    }

    //add layer
    singleton.curScene.addChild(layer);

    if( layer.onActivate != null ){
        layer.onActivate();
    }
    return layer;
}

UIManager.prototype.popLayer = function()
{
    engine.event.removeNTFHandler(singleton.curLayer);

    //remove layer
    singleton.curScene.removeChild(singleton.curLayer);

    singleton.LAYERS.pop();
    if( singleton.LAYERS.length > 0 )
    {
        singleton.curLayer = singleton.LAYERS[singleton.LAYERS.length-1];
        enableLayer(singleton.curLayer);
    }
    else
    {
        singleton.curLayer = null;
    }
}

UIManager.prototype.removeLayer = function(layer){
    if( layer === singleton.curLayer ) this.popLayer();
    else{
        singleton.LAYERS = singleton.LAYERS.filter(function(ly){
            if( ly === layer ){
                engine.event.removeNTFHandler(ly);
                //remove layer
                singleton.curScene.removeChild(ly);
                return false;
            }
            return true;
        });
    }
}

UIManager.prototype.regMenu = function(menu)
{
    if( singleton.curLayer != null )
    {
        singleton.curLayer.MENUS.push(menu);
    }
    else
    {
        warn("UIManager.regMenu: no layer available.");
    }
}

UIManager.prototype.unregMenu = function(menu)
{
    for(var k = singleton.LAYERS.length-1; k>=0; k--){
        var layer = singleton.LAYERS[k];
        for(var m in layer.MENUS){
            if( layer.MENUS[m] === menu ){
                layer.MENUS.splice(m, 1);
                return;
            }
        }
    }
}

UIManager.prototype.setCommandHandler = function(handler, thiz)
{
    if( singleton.curLayer != null )
    {
        singleton.curLayer.onCommand = handler;
        if( thiz != null )
        {
            singleton.curLayer.THIZ = thiz;
        }
    }
    else
    {
        warn("UIManager.setCommandHandler: no layer available.");
    }
}

UIManager.prototype.postCommand = function(cmd, arg)
{
    if( singleton.curLayer != null
        && singleton.curLayer.onCommand != null )
    {
        if( singleton.curLayer.THIZ != null )
        {
            singleton.curLayer.onCommand.apply(singleton.curLayer.THIZ, [cmd, arg]);
        }
        else
        {
            singleton.curLayer.onCommand(cmd, arg);
        }
    }
    else
    {
        warn("UIManager.postCommand: no command handler assigned.");
    }
}

function enableLayer(layer)
{
    for(var k in layer.MENUS)
    {
        var menu = layer.MENUS[k];
        if( menu.setEnabled != null )
        {
            menu.setEnabled(true);
        }
        else if( menu.setTouchEnabled != null )
        {
            menu.setTouchEnabled(true);
        }
        else{
            error("UI::enableLayer: not a valid menu.");
        }
    }
    if( layer.onActivate != null ){
        layer.onActivate();
    }
}

function disableLayer(layer)
{
    try{
        for(var k in layer.MENUS)
        {
            var menu = layer.MENUS[k];
            if( menu.setEnabled != null )
            {
                menu.setEnabled(false);
            }
            else if( menu.setTouchEnabled != null )
            {
                menu.setTouchEnabled(false);
            }
            else{
                error("UI::disableLayer: not a valid menu.");
            }
        }
        if( layer.onDeactivate != null ){
            layer.onDeactivate();
        }
    }
    catch(e){
        traceError(e);
    }
}

var singleton = new UIManager();

exports.instance = singleton;
