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
    var node = cc.Node.create();
    director.runWithScene(scene);
    singleton.LAYERS = [];
    singleton.curScene = scene;
    singleton.curNode = node;

    singleton.curScene.addChild(singleton.curNode);
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
    var node = cc.Node.create();
    singleton.curNode = node;
    //replace scene
    director.replaceScene(scene);

    autoAdaptResolution();

    singleton.newLayer(assign);

    if (engine.game.getConfig().account_type == 6){
        singleton.LAYERS[0].backClicked = system.exit;
    } 
    else{
        singleton.LAYERS[0].backClicked = function(){
        system.alert(translate(engine.game.language, "uiLeaveGame"), translate(engine.game.language, "uiWantLeave"), null, function(btn){
                       if( btn != 0 ){//switch
                           system.exit();
                       }
                  }, translate(engine.game.language, "uiNo"), translate(engine.game.language, "uiExit"));
    };
    }

    singleton.LAYERS[0].setKeypadEnabled(true);
    singleton.curScene.addChild(singleton.curNode);
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

    if( layer.onActivate != null ){
        layer.onActivate();
    }

    //add layer
    singleton.curNode.addChild(layer);
    return layer;
}

UIManager.prototype.popLayer = function()
{
    engine.event.removeNTFHandler(singleton.curLayer);

    //remove layer
    singleton.curNode.removeChild(singleton.curLayer);

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
                singleton.curNode.removeChild(ly);
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

function autoAdaptResolution()
{
    var winViewWidth = system.getViewSizeWidth();
    var winViewHeight = system.getViewSizeHeight();
    var marginIconList = ["shipei1.png","shipei2.png","shipei3.png","shipei4.png"];

    //auto adapt resolution
    var winSize = cc.Director.getInstance().getWinSize();

    if (winSize.height != winViewHeight || winSize.width != winViewWidth){
        var ratioDev = winSize.height / winSize.width;
        var ratioFit = winViewHeight / winViewWidth;
        var sub = ratioDev - ratioFit;
        var offsetFloat = 0.01;

        if (sub < -offsetFloat){
            var offsetX = Math.round((winSize.width - winSize.height / winViewHeight * winViewWidth) / 2);

            singleton.curNode.setPosition(cc.p(offsetX,0));
            singleton.curNode.setAnchorPoint(cc.p(0,0));
            singleton.curNode.setScale(winSize.height/winViewHeight);
            engine.game.curNodeScale = winSize.height/winViewHeight;

            var stepMarginH = caculateMarginHeightStep(marginIconList[0],offsetX,false);
            var marOffsetX = caculateMarginHeightStep(marginIconList[0],offsetX,true);
            for (var k = 0;k < caculateMarginCount(marginIconList[0],offsetX,false);k++){
                var margin = cc.Sprite.create(marginIconList[0]);
                margin.setPosition(cc.p(-marOffsetX, k * stepMarginH));
                margin.setScale(caculateMarginScale(marginIconList[0],offsetX,false));
                margin.setAnchorPoint(cc.p(0, 0));
                singleton.curNode.addChild(margin,100);

                var margin1 = cc.Sprite.create(marginIconList[1]);
                margin1.setPosition(cc.p(winViewWidth, k * stepMarginH));
                margin1.setScale(caculateMarginScale(marginIconList[1],offsetX,false));
                margin1.setAnchorPoint(cc.p(0, 0));
                singleton.curNode.addChild(margin1,100);
            }
        }
        else if (sub > offsetFloat){
            var offsetY = Math.round((winSize.height - winSize.width / winViewWidth * winViewHeight) / 2);

            singleton.curNode.setPosition(cc.p(0,offsetY));
            singleton.curNode.setAnchorPoint(cc.p(0,0));
            singleton.curNode.setScale(winSize.width/winViewWidth);
            engine.game.curNodeScale = winSize.width/winViewWidth;

            var stepMarginW = caculateMarginHeightStep(marginIconList[2],offsetY,true);
            var marOffsetY = caculateMarginHeightStep(marginIconList[2],offsetX,false);
            for (var k = 0;k < caculateMarginCount(marginIconList[2],offsetY,true);k++) {
                var margin2 = cc.Sprite.create(marginIconList[2]);
                margin2.setPosition(cc.p(k * stepMarginW, -marOffsetY));
                margin2.setScale(caculateMarginScale(marginIconList[2],offsetY,true));
                margin2.setAnchorPoint(cc.p(0, 0));
                singleton.curNode.addChild(margin2, 100);

                var margin3 = cc.Sprite.create(marginIconList[3]);
                margin3.setPosition(cc.p(k * stepMarginW, winViewHeight));
                margin3.setScale(caculateMarginScale(marginIconList[3],offsetY,true));
                margin3.setAnchorPoint(cc.p(0, 0));
                singleton.curNode.addChild(margin3, 100);
            }
        }
        else{
            singleton.curNode.setScale(winSize.height/winViewHeight);
            engine.game.curNodeScale = winSize.height/winViewHeight;
        }
    }
}

function caculateMarginCount(icon,offset,mode){//mode false X mode true Y
    var retvalue = 0;
    if (mode == true){
        retvalue = Math.ceil(engine.game.viewSize.width / caculateMarginHeightStep(icon,offset,mode));
    }
    else{
        retvalue = Math.ceil(engine.game.viewSize.height / caculateMarginHeightStep(icon,offset,mode));
    }
    return retvalue;
}

function caculateMarginHeightStep(icon,offset,mode){

    var retvalue = 0;
    if (mode == true){
        var margin = cc.Sprite.create(icon);
        var marginSize = margin.getContentSize();
        var ratioY = 1;//marginSize.height / offset;
        retvalue = marginSize.width / ratioY;
    }
    else{
        var margin = cc.Sprite.create(icon);
        var marginSize = margin.getContentSize();
        var ratioX = 1;//marginSize.width / offset;
        retvalue = marginSize.height / ratioX;
    }
    return retvalue;
}

function caculateMarginScale(icon,offset,mode){
    var retvalue = 0;
    if (mode == true){
        var margin = cc.Sprite.create(icon);
        var marginSize = margin.getContentSize();
        retvalue = 1;//offset / marginSize.height;
    }
    else{
        var margin = cc.Sprite.create(icon);
        var marginSize = margin.getContentSize();
        retvalue = 1;//offset / marginSize.width;
    }
    return retvalue;
}

var singleton = new UIManager();

exports.instance = singleton;
