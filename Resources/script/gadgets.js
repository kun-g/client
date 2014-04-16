/**
 * User: hammer
 * Date: 14-1-3
 * Time: 下午4:39
 */

var BossHP = cc.Node.extend({
    init: function(){
        if( !this._super()) return false;
        //init code here
        this.MAXHP = 0;
        this.HP = 0;
        return true;
    },
    show: function(max){
        if( max == null ){
            max = 1;
        }
        this.owner = {};
        this.NODE = cc.BuilderReader.load("ui-bosshp.ccbi", this.owner);
        this.NODE.setPosition(cc.p(0, 0));
        this.addChild(this.NODE);
        this.NODE.animationManager.runAnimationsForSequenceNamed("open");

        this.HP = max;
        this.MAXHP = max;
        //attach progress
        this.PROGRESS = new ProgressBar(500, "boss-hpl.png", "boss-hpm.png", "boss-hpr.png");
        this.owner.nodeProgress.addChild(this.PROGRESS.node);
        this.PROGRESS.setProgress(this.HP/this.MAXHP);

        this.PAR = cc.BuilderReader.load("pHpSpit.ccbi");
        this.PAR.stopSystem();
        this.PAR.setPosition(cc.p(this.PROGRESS.length, this.PROGRESS.height/2));
        this.owner.nodeProgress.addChild(this.PAR);
    },
    setHP: function(hp, maxhp){
        if( hp != null ){
            this.HP = hp;
        }
        if( maxhp != null ){
            this.MAXHP = maxhp;
        }
        if( this.MAXHP == null ){
            this.MAXHP = 1;
        }
        if( this.HP == null ){
            this.HP = this.MAXHP;
        }
        if( this.HP > this.MAXHP ){
            this.MAXHP = this.HP;
        }
        if( this.PROGRESS != null ){
            this.PROGRESS.setProgress(this.HP/this.MAXHP);
            //喷射particle
            this.PAR.setPosition(cc.p(this.PROGRESS.length, this.PROGRESS.height/2));
            this.PAR.resetSystem();
            //shock
            var mv1 = cc.MoveTo.create(0.05, cc.p(0, -5));
            var mv2 = cc.MoveTo.create(0.05, cc.p(0, 5));
            var mv3 = cc.MoveTo.create(0.05, cc.p(0, -3));
            var mv4 = cc.MoveTo.create(0.05, cc.p(0, 0))
            var thiz = this;
            var cal = cc.CallFunc.create(function(){
                thiz.PROGRESS.node.setPosition(cc.p(0, 0));
            }, this.PROGRESS.node);
            var sq = cc.Sequence.create(mv1, mv2, mv3, mv4, cal);
            this.PROGRESS.node.runAction(sq);
        }
    },
    getHP: function(){
        return this.HP;
    },
    getMaxHP: function(){
        return this.MAXHP;
    }
});

BossHP.create = function(max){
    var ret = new BossHP();
    ret.init();
    ret.show(max);
    return ret;
}

exports.BossHP = BossHP;

//*** UISlider ***

var UISlider = cc.Layer.extend({
    init: function(){
        if( !this._super()) return false;
        //init code here
        this.MIN = 0;
        this.MAX = 100;
        this.NOW = 0;
        this.MARGIN = 50;
        this.EXRANGE = 50;
        this.CALLBACK = null;
        return true;
    },
    //--- cfg values ---
    // start: ccpoint
    // end: ccpoint
    // sthumb: string-sprite
    // * min: int 最小值
    // * max: int 最大值
    // * def: int 默认值
    // * margin: float 高度
    // * psbegin: string-sprite
    // * psmiddle: string-sprite
    // * psend: string-sprite
    // * exrange: float
    // * callback: callback function func(val)
    setup: function(cfg){
        if( cfg.callback != null ) this.CALLBACK = cfg.callback;
        this.START = cfg.start;
        this.END = cfg.end;
        if( cfg.margin != null ){
            this.MARGIN = cfg.margin;
        }
        var ldp = cc.pAdd(this.START, cc.p(-this.MARGIN, -this.MARGIN));
        var rup = cc.pAdd(this.END, cc.p(this.MARGIN, this.MARGIN));
        var size = cc.size(rup.x - ldp.x, rup.y - ldp.y);
        this.setPosition(ldp);
        this.setContentSize(size);
        this.RECT = cc.rect(ldp.x, ldp.y, size.width, size.height);
        this.START = cc.p(this.START.x - ldp.x, this.START.y - ldp.y);
        this.END = cc.p(this.END.x - ldp.x, this.END.y - ldp.y);
        var psbegin = "index-jy1.png";
        var psmiddle = "index-jy2.png";
        var psend = "index-jy3.png";
        if( cfg.psbegin != null ) psbegin = cfg.psbegin;
        if( cfg.psmiddle != null ) psmiddle = cfg.psmiddle;
        if( cfg.psend != null ) psend = cfg.psend;
        this.PROGRESSLEN = this.END.x - this.START.x;
        this.PROGRESS = new ProgressBar(this.PROGRESSLEN, psbegin, psmiddle, psend);
        this.PROGRESS.node.setPosition(cc.pAdd(this.START, cc.p(0, -this.PROGRESS.height/2)));
        this.addChild(this.PROGRESS.node);
        if( cfg.min != null ) this.MIN = cfg.min;
        if( cfg.max != null ) this.MAX = cfg.max;
        if( cfg.def != null ) this.NOW = cfg.def;
        this.PROGRESS.setProgress((this.NOW-this.MIN)/(this.MAX-this.MIN));
        this.THUMB = cc.Sprite.createWithSpriteFrameName(cfg.sthumb);
        this.THUMB.setPosition(this.START);
        this.addChild(this.THUMB);
        this.setMeter(this.NOW);

        this.setTouchPriority(1);
        this.setTouchMode(cc.TOUCH_ONE_BY_ONE);
        this.setTouchEnabled(true);
    },
    getMeter: function(){
        return this.NOW;
    },
    setMeter: function(val){
        var old = this.NOW;
        if( val < this.MIN ) val = this.MIN;
        if( val > this.MAX ) val = this.MAX;
        this.NOW = val;
        var alpha = (this.NOW-this.MIN)/(this.MAX-this.MIN);
        if( alpha > 1 ) alpha = 1;
        if( alpha < 0 ||  alpha != alpha ) alpha = 0;
        this.PROGRESS.setProgress(alpha);
        this.THUMBPOS = cc.pLerp(this.START, this.END, alpha);
        this.THUMB.setPosition(this.THUMBPOS);
        if( this.CALLBACK != null ){
            this.CALLBACK(this.NOW);
        }
    },
    setBoundary: function(min, max, now){
        this.MIN = min;
        this.MAX = max;
        if( now != null ) this.NOW = now;
        this.setMeter(this.NOW);
    },
    onTouchBegan: function(touch, event){
        var pos = touch.getLocation();
        var rpos = this.convertToNodeSpace(pos);
        if( !cc.rectContainsPoint(cc.rect(0, 0, this.RECT.width, this.RECT.height), rpos) )
        {
            return false;
        }
        var dis = cc.pDistance(rpos, this.THUMBPOS);
        if( dis >  this.EXRANGE ){
            return false;
        }
        this.TOUCHPOS = pos;
        this.OFFX = this.THUMBPOS.x - this.START.x;
        return true;
    },
    onTouchMoved: function(touch, event){
        var pos = touch.getLocation();
        var off = pos.x - this.TOUCHPOS.x + this.OFFX;
        var range = this.MAX - this.MIN;
        var alpha = off/this.PROGRESSLEN;
        if( alpha < 0 ) alpha = 0;
        if( alpha > 1 ) alpha = 1;
        var val = this.MIN + alpha*range;
        this.setMeter(val);
    },
    onTouchEnded: function(touch, event){
    }
});

UISlider.create = function(cfg){
    var ret = new UISlider();
    ret.init();
    ret.setup(cfg);
    return ret;
}

exports.UISlider = UISlider;