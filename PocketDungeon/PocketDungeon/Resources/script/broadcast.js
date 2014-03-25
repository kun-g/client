/**
 * User: hammer
 * Date: 14-2-22
 * Time: 下午10:27
 */

var libTable = loadModule("table.js");

var BROADCAST_SLEEP = 180;
var BROADCAST_HEIGHT = 50;
var BROADCAST_OFFY = 12;
var BROADCAST_OFFX = 100;
var BROADCAST_FLY = 128;

function Broadcast(){
    this.PENDING = [];
    this.ACTIVE = [];
    this.TICK = 0;
    this.FLAG = false;

    var scheduler = cc.Director.getInstance().getScheduler();
    scheduler.scheduleCallbackForTarget(this, this.tick, 1, cc.REPEAT_FOREVER, 0, false);
}

Broadcast.prototype.pushBroadcast = function(arg){
    //处理字符串
    var broad = libTable.queryTable(TABLE_BROADCAST, +arg.typ);
    if( broad != null ){
        var cast = {};
        cast.node = cc.Node.create();
        var offset = 0;
        var patterns = broad.textFormat.split(/(\{[^{}]*)\}/gi);
        for(var k in patterns){
            var pa = patterns[k];
            if( pa[0] == "{" ){
                var cn = pa.substring(3, pa.length);
                switch(pa[1]){
                    case "I":{//道具
                        var itemClass = libTable.queryTable(TABLE_ITEM, arg[cn]);
                        var label = cc.LabelTTF.create("["+itemClass.label+"]", UI_FONT, UI_SIZE_L);
                        label.setAnchorPoint(cc.p(0, 0));
                        label.setPosition(cc.p(offset, 0));
                        if( itemClass.quality != null ){
                            label.setColor(COLOR_QUALITY[itemClass.quality]);
                        }
                        cast.node.addChild(label);
                        offset += label.getContentSize().width;
                    }
                        break;
                    case "C":{//关卡
                        var chapterData = libTable.queryTable(TABLE_STAGE, arg[cn]);
                        var label = cc.LabelTTF.create(chapterData.label, UI_FONT, UI_SIZE_L);
                        label.setAnchorPoint(cc.p(0, 0));
                        label.setPosition(cc.p(offset, 0));
                        label.setColor(COLOR_QUALITY[4]);
                        cast.node.addChild(label);
                        offset += label.getContentSize().width;
                    }
                        break;
                    case "N":{//字符串/数字
                        var label = cc.LabelTTF.create(arg[cn], UI_FONT, UI_SIZE_L);
                        label.setAnchorPoint(cc.p(0, 0));
                        label.setPosition(cc.p(offset, 0));
                        label.setColor(COLOR_QUALITY[4]);
                        cast.node.addChild(label);
                        offset += label.getContentSize().width;
                    }
                        break;
                }
            }
            else{
                var label = cc.LabelTTF.create(pa, UI_FONT, UI_SIZE_L);
                label.setAnchorPoint(cc.p(0, 0));
                label.setPosition(cc.p(offset, 0));
                label.setColor(COLOR_QUALITY[1]);
                cast.node.addChild(label);
                offset += label.getContentSize().width;
            }
        }
        cast.node.retain();
        cast.count = broad.repeat;
        cast.length = offset;
        this.ACTIVE.push(cast);
        this.invokeDisplay();
    }
}

Broadcast.prototype.invokeDisplay = function(){
    if( !this.FLAG ) return;
    if( this.FLYING == null && this.ACTIVE.length > 0 ){
        var winSize = cc.Director.getInstance().getWinSize();
        if( !this.LAYER.isVisible() ){
            this.LAYER.setVisible(true);
            this.LAYER.stopAllActions();
            var sd = cc.MoveTo.create(0.5, cc.p(0, winSize.height - BROADCAST_HEIGHT));
            this.LAYER.runAction(sd);
        }
        //scroll up
        this.FLYING = this.ACTIVE.shift();
        this.FLYING.node.setPosition(cc.p(winSize.width + BROADCAST_OFFX, BROADCAST_OFFY));
        this.LAYER.addChild(this.FLYING.node);
        var dist = this.FLYING.length + winSize.width + BROADCAST_OFFX*2;
        var time = dist/BROADCAST_FLY;
        var mv = cc.MoveBy.create(time, cc.p(-dist, 0));
        var cl = cc.CallFunc.create(this.scrollOver, this);
        var sq = cc.Sequence.create(mv, cl);
        this.FLYING.node.runAction(sq);
        this.FLYING.count--;

        return true;
    }
    return false;
}

Broadcast.prototype.scrollOver = function(){
    this.LAYER.removeAllChildren();
    if( this.FLYING.count > 0 ){
        this.FLYING.sleep = this.TICK + BROADCAST_SLEEP;
        this.PENDING.push(this.FLYING);
    }
    else{
        this.FLYING.node.release();
    }
    this.FLYING = null;
    if( !this.invokeDisplay() ){
        var winSize = cc.Director.getInstance().getWinSize();
        var sd = cc.MoveTo.create(0.5, cc.p(0, winSize.height));
        var hd = cc.Hide.create();
        var sq = cc.Sequence.create(sd, hd);
        this.LAYER.stopAllActions();
        this.LAYER.runAction(sq);
    }
}

Broadcast.prototype.tick = function(delta){
    this.TICK++;
    if( this.PENDING.length > 0
        && this.PENDING[0].sleep <= this.TICK ){
        this.ACTIVE.push(this.PENDING.pop());
        this.invokeDisplay();
    }
}

Broadcast.prototype.simpleInit = function(layer){
    var winSize = cc.Director.getInstance().getWinSize();
    this.LAYER = cc.LayerColor.create(cc.c4b(0, 0, 0, 205), winSize.width, BROADCAST_HEIGHT);
    this.LAYER.setAnchorPoint(cc.p(0, 0));
    this.LAYER.setPosition(cc.p(0, winSize.height));
    layer.addChild(this.LAYER, 1900);
    this.LAYER.setVisible(false);
    this.FLAG = true;
    this.invokeDisplay();
}

Broadcast.prototype.close = function(){
    this.FLAG = false;
    if( this.FLYING != null ){
        this.scrollOver();
    }
}

var singleton = new Broadcast();

exports.instance = singleton;
