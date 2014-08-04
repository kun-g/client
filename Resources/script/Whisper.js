/**
 * User: hammer
 * Date: 13-12-1
 * Time: 下午12:03
 */

var libUIC = loadModule("UIComposer.js");
var libUIKit = loadModule("uiKit.js");

var theSendLayer;

function getDeltaTime(sts){
    var snow = engine.game.getServerTime();
    var delta = snow - sts;
    var tail = "";
    if(delta > 0){
        tail = translate(engine.game.language, "whisperFront");
    }
    else{
        tail = translate(engine.game.language, "whisperBack");
    }
    delta = Math.abs(delta/1000);
    if( delta < 60 ){
        return translate(engine.game.language, "whisperJust");
    }
    else if( delta < 60*60 ){
        var m = Math.floor(delta/60);
        return m+translate(engine.game.language, "whisperMin")+tail;
    }
    else if( delta < 60*60*24 ){
        var h = Math.floor(delta/(60*60));
        return h+translate(engine.game.language, "whisperHour")+tail;
    }
    else{
        var d = Math.floor(delta/(60*60*24));
        return d+translate(engine.game.language, "whisperDay")+tail;
    }
}

function onDisplayExit(){
    engine.ui.unregMenu(engine.session.whisper.curDisplay.owner.menuRoot);
    engine.session.whisper.curDisplay = null;
    engine.session.whisper.curEvent = null;

    engine.session.whisper.invokeDisplayCheck();
}

function onSend(sender){
    if( theSendLayer.ui.input.getText() != "" ){
        theSendLayer.node.runAction(actionPopOut());

        var content = theSendLayer.ui.input.getText();
        content = filterUserInput(content);
        libUIKit.waitRPC(Request_SendWhisper, {
            nam: theSendLayer.TARGET,
            txt: content
        }, function(rsp){
            if( rsp.RET != RET_OK ){
                // TODO do something
            }
            else{
                engine.session.pushChat({
                    typ: 3,
                    src: engine.user.actor.Name,
                    txt: content
                })
            }
            engine.ui.popLayer();
        });
    }
}

function onTouchBegan(touch, event){
    var pos = touch.getLocation();
    var frame = theSendLayer.owner.frame;
    var rect = frame.getBoundingBox();
    var origin = frame.convertToWorldSpace(frame.getPosition());
    rect.x = origin.x;
    rect.y = origin.y;
    if( !cc.rectContainsPoint(rect, pos) ){
        return true;
    }
    return false;
}

function onTouchMoved(touch, event){
    //do nothing
}

function onTouchEnded(touch, event){
    //cancel the reply
    theSendLayer.node.runAction(actionPopOut(engine.ui.popLayer));
}

function onTouchCancelled(touch, event){
    onTouchEnded(touch, event);
}

function onEditReturned(){
    onSend();
}

function onReply(sender){
    engine.session.whisper.showSend(engine.session.whisper.curEvent.src);
}

function Whisper(){
    this.eventList = [];
    this.curDisplay = null;
    this.curEvent = null;
}

Whisper.prototype.invokeDisplayCheck = function(){
    if( this.eventList.length > 0
        && this.curDisplay == null ){
        this.showMessage(this.eventList.shift());
    }
}

Whisper.prototype.showSend = function(name){
    var layer = engine.ui.newLayer();
    layer.TARGET = name;

    var mask = blackMask();
    layer.addChild(mask);

    layer.owner = {};
    layer.owner.onSend = onSend;
    layer.node = libUIC.loadUI(layer, "ui-messagebox.ccbi", {
        nodeInput: {
            ui: "UIInput",
            id: "input",
            length: UI_CHAT_LENGTH,
            type: cc.KEYBOARD_RETURNTYPE_SEND
        }
    });
    layer.ui.input.onEditReturned = onEditReturned;

    var winSize = engine.game.viewSize;
    layer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    layer.addChild(layer.node);

    layer.owner.labelTitle.setString(translate(engine.game.language, "whisperSendTo")+name);

    layer.node.setScale(0);
    layer.node.runAction(actionPopIn());

    theSendLayer = layer;

    layer.onTouchBegan = onTouchBegan;
    layer.onTouchMoved = onTouchMoved;
    layer.onTouchEnded = onTouchEnded;
    layer.onTouchCancelled = onTouchCancelled;
    layer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    layer.setTouchPriority(-1);
    layer.setTouchEnabled(true);

    engine.ui.regMenu(layer.owner.menuRoot);
    engine.ui.regMenu(layer);
}

Whisper.prototype.showMessage = function(event){
    var thiz = {};
    thiz.owner = {};
    thiz.owner.onReply = onReply;
    thiz.node = libUIC.loadUI(thiz, "ui-message.ccbi", {
        frameChat: {
            ui: "UITextArea",
            id: "text"
        }
    });

    this.curDisplay = thiz;
    this.curEvent = event;

    thiz.node.onExit = onDisplayExit;

    thiz.node.setZOrder(1000);
    var winSize = engine.game.viewSize;
    thiz.node.setPosition(cc.p(0, winSize.height));
    engine.ui.curLayer.addChild(thiz.node);

    engine.ui.regMenu(thiz.owner.menuRoot);

    var title = event.src+translate(engine.game.language, "whisperSayToYou");
    thiz.ui.text.pushText({
        text: title,
        color: cc.c3b(80, 80, 240),
        size: UI_SIZE_L
    });
    thiz.ui.text.pushText({
        text: event.txt,
        color: cc.c3b(255, 255, 255),
        size: UI_SIZE_L
    });

    var mv1 = cc.MoveBy.create(1, cc.p(0, -118));
    var dey = cc.DelayTime.create(5);
    var mv2 = cc.MoveBy.create(1, cc.p(0, 118));
    var call = cc.CallFunc.create(function(){
        this.removeFromParent();
    }, thiz.node);
    var seq = cc.Sequence.create(mv1, dey, mv2, call);
    thiz.node.runAction(seq);
}

Whisper.prototype.send = function(name){
    this.showSend(name);
}

Whisper.prototype.recv = function(event){
    this.eventList.push(event);
    this.invokeDisplayCheck();
}

exports.Whisper = Whisper;