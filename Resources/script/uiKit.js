/**
 * User: hammer
 * Date: 13-9-26
 * Time: 下午11:44
 */

var ui = loadModule("UIComposer.js");

function setContent(content)
{
    this.owner.labTip1.setString(content);
    this.owner.labTip2.setString(content);
}

/*
 * args samples:
 * [{label:"xxx.png", func:onXXX, obj:x}]
 */
function setButton(args)
{
    this.owner.menuRoot.removeAllChildren();
    if( args.length == 1 )
    {
        var bc = args[0];
        var button = makeButton(bc);
        var pos = cc.pMidpoint(this.owner.btnOk.getPosition(), this.owner.btnCancel.getPosition());
        button.setPosition(pos);
        this.owner.menuRoot.addChild(button);
    }
    else if( args.length == 2 )
    {
        for(var k=0; k<2; ++k)
        {
            var bc = args[k];
            var pos = this.owner.btnOk.getPosition();
            if( k>0 )
            {
                pos = this.owner.btnCancel.getPosition();
            }
            var button = makeButton(bc);
            button.setPosition(pos);
            this.owner.menuRoot.addChild(button);
        }
    }
}

function setImage(sp){
    //switch to image mode
    this.owner.modeText.setVisible(false);
    this.owner.modeImage.setVisible(true);

    this.owner.nodeImage.removeAllChildren();
    var sprite = cc.Sprite.create(sp);
    sprite.setAnchorPoint(cc.p(0.5, 0.5));
    sprite.setPosition(cc.p(0, 0));
    this.owner.nodeImage.addChild(sprite);
}

function setCloseCallback(func, obj){
    this.FUNC = func;
    this.OBJ = obj;
}

function onClose()
{
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    this.theNode.runAction(actionPopOut(function(){
        engine.ui.popLayer();
        if( this.FUNC != null ){
            this.FUNC.apply(this.OBJ);
        }
    }, this));
}

function alert()
{
    var theLayer = engine.ui.newLayer();
    theLayer.addChild(blackMask());

    var winSize = cc.Director.getInstance().getWinSize();

    theLayer.owner = {};
    theLayer.theNode = cc.BuilderReader.load("ui-tip.ccbi", theLayer.owner);
    theLayer.theNode.setPosition(cc.p(winSize.width/2, winSize.height/2));
    theLayer.addChild(theLayer.theNode);
    theLayer.theNode.runAction(actionPopIn());

    theLayer.setContent = setContent;
    theLayer.setButton = setButton;
    theLayer.setImage = setImage;
    theLayer.onClose = onClose;
    theLayer.setCloseCallback = setCloseCallback;

    engine.ui.regMenu(theLayer.owner.menuRoot);
    theLayer.owner.modeText.setVisible(true);
    theLayer.owner.modeImage.setVisible(false);
    return theLayer;
}
exports.alert = alert;

function pushLoading(){
    var layer = engine.ui.newLayer();
    var winSize = cc.Director.getInstance().getWinSize();
    var sp = cc.Sprite.create("loading.png");
    sp.setPosition(cc.p(winSize.width/2, winSize.height/2));
    layer.addChild(sp);
    var rotate = cc.RotateBy.create(1, 120);
    var repeat = cc.RepeatForever.create(rotate);
    sp.runAction(repeat);
}
exports.pushLoading = pushLoading;

//waitRPC
function onRPCReturn(rsp, arg){
    engine.ui.popLayer();
    arg.func(rsp, arg.data);
}

function waitRPC(request, args, func, obj, data){
    pushLoading();
    var arg = {};
    arg.data = data;
    arg.func = func; 
    engine.event.sendRPCEvent(request, args, onRPCReturn, obj, arg);
}
exports.waitRPC = waitRPC;

//showErrorMessage
function showErrorMessage(rsp){
    showAlert(ErrorMsgs[rsp.RET]);
}
exports.showErrorMessage = showErrorMessage;

//showTips
function showAlert(msg, func, obj){
    var ly = engine.ui.newLayer();
    var mask = blackMask();
    var winSize = cc.Director.getInstance().getWinSize();
    ly.owner = {};
    ly.theNode = cc.BuilderReader.load("ui-tip.ccbi", ly.owner);
    ly.theNode.setPosition(cc.p(winSize.width/2, winSize.height/2));
    ly.theNode.setScale(0);
    ly.addChild(mask);
    ly.addChild(ly.theNode);
    ly.theNode.runAction(actionPopIn());
    engine.ui.regMenu(ly.owner.menuRoot);

    setButton.apply(ly, [
        [{
            label: "buttontext-close.png",
            func: onClose,
            obj: ly
        }]
    ]);

    ly.owner.modeText.setVisible(true);
    ly.owner.modeImage.setVisible(false);
    ly.owner.labTip1.setString(msg);
    //ly.owner.labTip2.setString(msg);

    if( func != null )
    {
        ly.FUNC = func;
    }
    if( obj != null )
    {
        ly.OBJ = obj;
    }
}
exports.showAlert = showAlert;

//--- confirm --
var CONFIRM_DEFAULT = 0;
var CONFIRM_NEUTRAL = 1;
function confirm(text, mode, func, obj){
    var alt = alert();
    alt.setContent(text);
    var bt = BUTTONTYPE_DEFAULT;
    if( mode == CONFIRM_NEUTRAL ){
        bt = BUTTONTYPE_NORMAL;
    }
    alt.setButton([
        {
            label: "buttontext-qx.png",
            func: onClose,
            obj: alt
        },
        {
            label: "buttontext-confirm.png",
            func: function(sender){
                engine.ui.popLayer();
                func.apply(obj);
            },
            obj: alt,
            type: bt
        }
    ]);
}

exports.confirm = confirm;
exports.CONFIRM_DEFAULT = CONFIRM_DEFAULT;
exports.CONFIRM_NEUTRAL = CONFIRM_NEUTRAL;

//--- purchase confirm ---
function confirmPurchase(command, args, text1, text2, cost, callback){
    if( engine.user.inventory.Diamond >= cost ){
        //ask to confirm the purchase
        debug("text1 var alt = alert();");
        var alt = alert();
        debug("text1 alt.setContent("+text1+");");
        alt.setContent(text1);
        alt.setButton([
                {
                    label: "buttontext-qx.png",
                    func: onClose,
                    obj: alt
                },
                {
                    label: "buttontext-confirm.png",
                    func: function(sender){
                        engine.ui.popLayer();
                        waitRPC(command, args, function(rsp){
                            if( rsp != RET_OK ){
                                showErrorMessage(rsp);
                            }
                            if( callback != null ){
                                callback(rsp);
                            }
                        });
                    },
                    obj: alt,
                    type: BUTTONTYPE_DEFAULT
                }
        ]);
    }
    else{
        //ask to confirm charge
        debug("text2 var alt = alert();");
        var alt = alert();
        debug("text2 alt.setContent("+text2+");");
        alt.setContent(text2);
        alt.setButton([
            {
                label: "buttontext-qx.png",
                func: onClose,
                obj: alt
            },
            {
                label: "buttontext-confirm.png",
                func: function(sender){
                    engine.ui.popLayer();
                    loadModule("uiChargeDiamond.js").node();
                },
                obj: alt,
                type: BUTTONTYPE_DEFAULT
            }
        ]);
    }
}

exports.confirmPurchase = confirmPurchase;

//----------------------------------
function showRoleInfo(name){
    var rd = engine.session.queryRoleInfo(name);
    if( rd != null ){
        var viewRole = loadModule("sceneRole.js");
        var libRole = loadModule("role.js");
        var role = new libRole.Role(rd);
        role.fix();
        viewRole.show(role);
    }
    else{
        waitRPC(Request_RoleInfo, {
            nam: name
        }, function(rsp){
            if( rsp.RET == RET_OK ){
                var viewRole = loadModule("sceneRole.js");
                var libRole = loadModule("role.js");
                engine.session.cacheRoleInfo(rsp.arg);//save to cache
                var role = new libRole.Role(rsp.arg);
                role.fix();
                viewRole.show(role);
            }
            else{
                engine.msg.pop(ErrorMsgs[rsp.RET], POPTYPE_ERROR);
            }
        });
    }
}

exports.showRoleInfo = showRoleInfo;