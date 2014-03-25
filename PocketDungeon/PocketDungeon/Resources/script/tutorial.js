/**
 * User: hammer
 * Date: 13-12-24
 * Time: 上午10:23
 */
var libTable = loadModule("table.js");
var libEffect = loadModule("effect.js");

var theHintCloseCBFunc;
var theHintCloseCBObj;

function onCloseHint(sender){
    engine.ui.popLayer();
    if( theHintCloseCBFunc != null ){
        theHintCloseCBFunc.apply(theHintCloseCBObj);
    }
}

function showHint(){
    var layer = engine.ui.newLayer();
    var mask = blackMask();
    layer.addChild(mask);

    layer.owner = {};
    layer.owner.onClose = onCloseHint;
    layer.node = cc.BuilderReader.load("sceneTutorial.ccbi", layer.owner);
    layer.addChild(layer.node);

    layer.node.animationManager.runAnimationsForSequenceNamed("open");

    //统计
    tdga.event("Intro#3");
    engine.event.sendNTFEvent(Request_ReportState, {
        key: "intro",
        val: "first talk over"
    });
}

function setHintCloseCallback(func, obj){
    theHintCloseCBFunc = func;
    theHintCloseCBObj = obj;
}

exports.showHint = showHint;
exports.setHintCloseCallback = setHintCloseCallback;

//--------------------------------

var TutorialPress = cc.Layer.extend({
    init: function(){
        if( !this._super()) return false;
        //init code here
        this.RECT = cc.rect(0, 0, 0, 0);
        this.setTouchPriority(-1000);
        this.setTouchMode(cc.TOUCH_ONE_BY_ONE);
        this.setTouchEnabled(true);
        this.setZOrder(10000);
        this.CALLBACK = this.onDefaultCallback;
        this.setPosition(cc.p(0, 0));
        this.TRIGGER = false;
        return true;
    },
    setValidRect: function(rect, trigger, callback){
        if( callback != null ){
            this.CALLBACK = callback;
        }
        if( trigger != null ){
            this.TRIGGER = trigger;
        }
        this.removeAllChildren();
        var ld = cc.p(rect.x, rect.y);
        var lu = cc.p(rect.x, rect.y+rect.height);
        var rd = cc.p(rect.x+rect.width, rect.y);
        var winSize = cc.Director.getInstance().getWinSize();
        var rects = [];
        rects[0] = cc.rect(0, lu.y, winSize.width, winSize.height-lu.y);
        rects[1] = cc.rect(0, ld.y, ld.x, rect.height);
        rects[2] = cc.rect(rd.x, rd.y, winSize.width - rd.x, rect.height);
        rects[3] = cc.rect(0, 0, winSize.width, ld.y);
        for(rck in rects){
            var rc = rects[rck];
            if( rc.width == 0 || rc.height == 0 ) continue;
            var mk = cc.LayerColor.create(cc.c4b(0, 0, 0, 205), rc.width, rc.height);
            mk.setPosition(cc.p(rc.x, rc.y));
            this.addChild(mk);
        }
        this.RECT = rect;
    },
    onDefaultCallback: function(trigger){
        this.removeFromParent();
        if( trigger === true ){
            engine.pop.invokePop();
        }
    },
    onEnter: function(){
        engine.ui.regMenu(this);
    },
    onExit: function(){
        engine.ui.unregMenu(this);
    },
    onTouchBegan: function(touch, event){
        var pos = touch.getLocation();
        if( cc.rectContainsPoint(this.RECT, pos) ){
            return false;
        }
        return true;
    },
    onTouchEnded: function(touch, event){
        var pos = touch.getLocation();
        if( cc.rectContainsPoint(this.RECT, pos) ){
            if( this.CALLBACK != null ){
                this.CALLBACK(this.TRIGGER);
            }
        }
    }
});
TutorialPress.create = function(rect, trigger, callback){
    var ret = new TutorialPress();
    ret.init();
    ret.setValidRect(rect, trigger, callback);
    return ret;
}

//-------------------

var TutorialClick = cc.Layer.extend({
    init: function(){
        if( !this._super()) return false;
        //init code here
        this.RECT = cc.rect(0, 0, 0, 0);
        this.setTouchPriority(-1000);
        this.setTouchMode(cc.TOUCH_ONE_BY_ONE);
        this.setTouchEnabled(true);
        this.setZOrder(10000);
        this.CALLBACK = this.onDefaultCallback;
        this.setPosition(cc.p(0, 0));
        this.TRIGGER = false;
        return true;
    },
    setClick: function(pos, rect, trigger, callback){
        if( callback != null ){
            this.CALLBACK = callback;
        }
        if( trigger != null ){
            this.TRIGGER = trigger;
        }
        this.removeAllChildren();
        libEffect.attachEffectCCBI(this, pos, "tips-hand.ccbi", libEffect.EFFECTMODE_LOOP);
        this.RECT = rect;
    },
    onDefaultCallback: function(trigger){
        this.removeFromParent();
        if( trigger === true ){
            engine.pop.invokePop();
        }
    },
    onEnter: function(){
        engine.ui.regMenu(this);
    },
    onExit: function(){
        engine.ui.unregMenu(this);
    },
    onTouchBegan: function(touch, event){
        var pos = touch.getLocation();
        if( cc.rectContainsPoint(this.RECT, pos) ){
            if( this.CALLBACK != null ){
                this.CALLBACK(this.TRIGGER);
            }
        }
        return false;
    }
});

TutorialClick.create = function(pos, rect, trigger, callback){
    var ret = new TutorialClick();
    ret.init();
    ret.setClick(pos, rect, trigger, callback);
    return ret;
}

//-------------------
function TutorialManager(){
    this.TUTORIAL = null;
    this.ACTION = 0;
}

TutorialManager.prototype.startTutorial = function(index){
    this.TUTORIAL = libTable.queryTable(TABLE_TUTORIAL, index);
    this.ACTION = -1;
}

TutorialManager.prototype.nextAction = function(){
    if( this.TUTORIAL != null ){
        this.ACTION++;
        if( this.TUTORIAL.actions.length > this.ACTION ){
            var act = this.TUTORIAL.actions[this.ACTION];
            debug("ACT = "+JSON.stringify(act));
            switch(act.act){
                case "press":{
                    var press = TutorialPress.create(act.rect, act.trigger);
                    engine.ui.curLayer.addChild(press);
                }break;
                case "dialogue":{
                    engine.dialogue.startDialogue(act.index);
                }break;
                case "click":{
                    var click = TutorialClick.create(act.pos, act.rect, act.trigger);
                    engine.ui.curLayer.addChild(click);
                }break;
                case "yield":{
                    return false;
                }break;
                default: return this.nextAction();
            }
            return true;
        }
    }
    this.TUTORIAL = null;
    this.ACTION = -1;
    return false;
}

var TutorialSingleton = new TutorialManager();

exports.invokeTutorial = function(index){
    TutorialSingleton.startTutorial(index);
    engine.pop.invokePop();
}

exports.activateTutorial = function(){
    return TutorialSingleton.nextAction();
}