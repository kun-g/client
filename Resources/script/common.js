/**
 * User: hammer
 * Date: 13-7-30
 * Time: 上午10:23
 */

function copyProperties(dst, src)
{
    if( src != null && dst != null )
    {
        for(var k in src)
        {
            dst[k] = src[k];
        }
    }
}

function linkPrototype(subType, superType)
{
    subType.prototype = new superType();
    subType.prototype.constructor = subType;
}

function mergeRoleProperties(dst, src){
    if( src != null ){
        for(var k in src){
            if( dst[k] == null ){
                dst[k] = src[k];
            }
            else{
                dst[k] += src[k];
            }
        }
    }
}

function propertyString(properties){
    var strProperty = "";
    for(var k in properties){
        var value = properties[k];
        if( value > 0 ){
            strProperty += ServerPropertyTable[k];
            strProperty += "+";
            strProperty += value;
            strProperty += "  ";
        }
        else if( value < 0 ){
            strProperty += ServerPropertyTable[k];
            strProperty += "-";
            strProperty += -value;
            strProperty += "  ";
        }
    }
    strProperty.trim();
    return strProperty;
}

function syncItemData(item){
    if( item.ServerId >= 0 ){
        var id = engine.user.inventory.queryItem(item.ServerId);
        return engine.user.inventory.Items[id];
    }
    return item;
}

function cacheSprite(file){
    var tex = cc.TextureCache.getInstance().addImage(file);
    if( tex != null ){
        var sz = tex.getContentSize();
        var sp = cc.SpriteFrame.createWithTexture(tex, cc.rect(0, 0, sz.width, sz.height));
        cc.SpriteFrameCache.getInstance().addSpriteFrame(sp, file);
    }
}

function configParticle(owner){
    owner.pReset = function(){
        if( this.p != null ) this.p.resetSystem();
    };
    owner.pStop = function(){
        if( this.p != null ) this.p.stopSystem();
    };
}

var TIME_ACTION_POP = 0.3;

function actionWait(delay, action)
{
    var dy = cc.DelayTime.create(delay);
    var sq = cc.Sequence.create(dy, action);
    return sq;
}

function actionPopIn(func, obj)
{
    var scale1 = cc.ScaleTo.create(0.2, 1.1);
    var scale2 = cc.ScaleTo.create(0.1, 1);
    var call = null;
    if( func != null )
    {
        call = cc.CallFunc.create(func, obj);
    }
    if( call == null )
    {
        return cc.Sequence.create(scale1, scale2);
    }
    else
    {
        return cc.Sequence.create(scale1, scale2, call);
    }
}

function actionPopOut(func, obj)
{
    var scale1 = cc.ScaleTo.create(0.1, 1.1);
    var scale2 = cc.ScaleTo.create(0.2, 0);
    var call = null;
    if( func != null )
    {
        call = cc.CallFunc.create(func, obj);
    }
    if( call == null )
    {
        return cc.Sequence.create(scale1, scale2);
    }
    else
    {
        return cc.Sequence.create(scale1, scale2, call);
    }
}

function actionBounce(func, obj)
{
    var scale1 = cc.ScaleTo.create(0.1, 1.15);
    var scale2 = cc.ScaleTo.create(0.1, 1);
    var call = null;
    if( func != null ){
        call = cc.CallFunc.create(func, obj);
    }
    if( call == null ){
        return cc.Sequence.create(scale1, scale2);
    }
    else{
        return cc.Sequence.create(scale1, scale2, call);
    }
}

var BUTTONTYPE_NORMAL = 0;
var BUTTONTYPE_DEFAULT = 1;
var BUTTONTYPE_PAY = 2;
var BUTTONTYPE_SYSTEM = 3;

function buttonNode(flag, label, offset, shell, shadow){
    if( flag ){//normal
        var normal = cc.Sprite.create(shell);
        normal.setAnchorPoint(cc.p(0.5, 0.5));
        normal.setPosition(cc.p(0, 0));

        var size = normal.getContentSize();
        var label1 = cc.Sprite.create(label);
        label1.setAnchorPoint(cc.p(0.5, 0.5));
        label1.setPosition(cc.p(size.width/2+offset.x, size.height/2+offset.y));
        normal.addChild(label1);

        return normal;
    }
    else{//selected / disabled
        var selected = cc.Sprite.create(shell);
        selected.setAnchorPoint(cc.p(0.5, 0.5));
        selected.setPosition(cc.p(0, 0));

        var size = selected.getContentSize();
        var label2 = cc.Sprite.create(label);
        label2.setAnchorPoint(cc.p(0.5, 0.5));
        label2.setPosition(cc.p(size.width/2+offset.x, size.height/2+offset.y));
        var mask2 = cc.Sprite.create(shadow);
        mask2.setAnchorPoint(cc.p(0.5, 0.5));
        mask2.setPosition(cc.p(size.width/2, size.height/2));

        selected.addChild(label2);
        selected.addChild(mask2);

        return selected;
    }
    return null;
}

function buttonNormalL(label, offset, node, callback, type)
{
    var shell = "button-small1.png";
    var shadow = "button-smallm.png";
    if( type != null ){
        switch(type){
            case BUTTONTYPE_DEFAULT:
                shell = "button-small3.png";
                break;
            case BUTTONTYPE_PAY:
                shell = "button-small2.png";
                break;
            case BUTTONTYPE_SYSTEM:
                shell = "button-blue.png";
                shadow = "button-bluemask.png";
                break;
        }
    }

    return cc.MenuItemSprite.create(
        buttonNode(true, label, offset, shell, shadow),
        buttonNode(false, label, offset, shell, shadow),
        buttonNode(false, label, offset, shell, shadow),
        callback, node
    );
}

function buttonTextNormalL(label, node, callback)
{
    var offset = BUTTON_OFFSET;
    var normal = cc.Sprite.create("button-small1.png");
    normal.setAnchorPoint(cc.p(0.5, 0.5));
    normal.setPosition(cc.p(0, 0));

    var size = normal.getContentSize();
    var label1 = cc.LabelTTF.create(label, UI_FONT, UI_SIZE_XL);
    label1.setAnchorPoint(cc.p(0.5, 0.5));
    label1.setPosition(cc.p(size.width/2+offset.x, size.height/2+offset.y));
    normal.addChild(label1);

    var selected = cc.Sprite.create("button-small1.png");
    selected.setAnchorPoint(cc.p(0.5, 0.5));
    selected.setPosition(cc.p(0, 0));

    var label2 = cc.LabelTTF.create(label, UI_FONT, UI_SIZE_XL);
    label2.setAnchorPoint(cc.p(0.5, 0.5));
    label2.setPosition(cc.p(size.width/2+offset.x, size.height/2+offset.y));
    var mask2 = cc.Sprite.create("button-smallm.png");
    mask2.setAnchorPoint(cc.p(0.5, 0.5));
    mask2.setPosition(cc.p(size.width/2, size.height/2));

    selected.addChild(label2);
    selected.addChild(mask2);

    return cc.MenuItemSprite.create(normal, selected, callback, node);
}

function buttonNodeXL(flag, label, offset){
    return buttonNode(
        flag, label, offset,
        "button-big1.png",
        "button-bigm.png"
    );
}

function buttonNormalXL(label, offset, node, callback)
{
    var shell = "button-big1.png";
    var shadow = "button-bigm.png";

    return cc.MenuItemSprite.create(
        buttonNode(true, label, offset, shell, shadow),
        buttonNode(false, label, offset, shell, shadow),
        buttonNode(false, label, offset, shell, shadow),
        callback, node
    );
}

var BLACKBACK_WIDTH = 250;
var BLACKBACK_HEIGHT = 250;

function blackMask(width, height)
{
    //auto complete
    if( height == null || width == null )
    {
        var screen = cc.Director.getInstance().getWinSize();
        if( width == null )
        {
            width = screen.width;
        }
        if( height == null )
        {
            height = screen.height;
        }
    }

    return cc.LayerColor.create(cc.c4b(0, 0, 0, 204), width, height);
}

/*** progress bar ***/
function ProgressBar(length, begin, middle, end)
{
    this.node = cc.RectClip.create();
    var begin = cc.Sprite.create(begin);
    begin.getTexture().setAliasTexParameters();
    begin.setAnchorPoint(cc.p(0, 0));
    begin.setPosition(cc.p(0, 0));
    var end = cc.Sprite.create(end);
    end.getTexture().setAliasTexParameters();
    end.setAnchorPoint(cc.p(0, 0));
    var mlen = length - begin.getContentSize().width - end.getContentSize().width;
    end.setPosition(cc.p(mlen, 0));
    var middle = cc.Sprite.create(middle);
    middle.getTexture().setAliasTexParameters();
    middle.setAnchorPoint(cc.p(0, 0));
    middle.setPosition(cc.p(begin.getContentSize().width, 0));
    var mrate = mlen/middle.getContentSize().width;
    middle.setScaleX(mrate);
    this.node.addChild(begin);
    this.node.addChild(middle);
    this.node.addChild(end);
    this.width = length;
    this.height = begin.getContentSize().height;
    this.setProgress(1);
}

ProgressBar.prototype.setProgress = function(p)
{
    if( p== null || p<0 || p!=p ) p = 0;//null, neg, nan
    if( p>1 ) p = 1;
    var rect = cc.rect(0, 0, this.width, this.height);
    rect.width *= p;
    this.node.setClipRect(rect);
    this.progress = p;
    this.length = rect.width;
}

ProgressBar.prototype.getProgress = function()
{
    return this.progress;
}

ProgressBar.make = function(thiz, args, parent)
{
    var ret = {};
    ret.id = new ProgressBar(args.length, args.begin, args.middle, args.end);
    ret.node = ret.id.node;
    return ret;
}

/*** Treasure Display ***/
function TreasureDisplay(gold, diamond)
{
    this.node = cc.Node.create();

    this.pSpGold = cc.Sprite.createWithSpriteFrameName("wood-coin.png");
    this.pSpDiamond = cc.Sprite.createWithSpriteFrameName("wood-jewel.png");
    this.pLabGold = cc.LabelBMFont.create(gold, "font1.fnt");
    this.pLabDiamond = cc.LabelBMFont.create(diamond, "font1.fnt");

    //arrange
    var offset = 0;
    this.pLabDiamond.setAnchorPoint(cc.p(1, 0.5));
    this.pLabDiamond.setPosition(cc.p(offset, 0));
    this.node.addChild(this.pLabDiamond);
    offset -= this.pLabDiamond.getContentSize().width;

    this.pSpDiamond.setAnchorPoint(cc.p(1, 0.5));
    this.pSpDiamond.setPosition(cc.p(offset, 0));
    this.node.addChild(this.pSpDiamond);
    offset -= this.pSpDiamond.getContentSize().width;

    offset -= 10;

    this.pLabGold.setAnchorPoint(cc.p(1, 0.5));
    this.pLabGold.setPosition(cc.p(offset, 0));
    this.node.addChild(this.pLabGold);
    offset -= this.pLabGold.getContentSize().width;

    this.pSpGold.setAnchorPoint(cc.p(1, 0.5));
    this.pSpGold.setPosition(cc.p(offset, 0));
    this.node.addChild(this.pSpGold);

    //offset -= this.pSpGold.getContentSize().width;
}

TreasureDisplay.prototype.setTreasure = function(gold, diamond)
{
    this.pLabGold.setString(gold);
    this.pLabDiamond.setString(diamond);

    //arrange
    var offset = 0;
    this.pLabDiamond.setPosition(cc.p(offset, 0));
    offset -= this.pLabDiamond.getContentSize().width;

    this.pSpDiamond.setPosition(cc.p(offset, 0));
    offset -= this.pSpDiamond.getContentSize().width;

    offset -= 10;

    this.pLabGold.setPosition(cc.p(offset, 0));
    offset -= this.pLabGold.getContentSize().width;

    this.pSpGold.setPosition(cc.p(offset, 0));
}

//--- ui components ---

function UIButtonL(thiz, args, offset)
{
    var type = BUTTONTYPE_NORMAL;
    if( args.type != null ){
        type = args.type;
    }
    var node = buttonNormalL(args.label, BUTTON_OFFSET, thiz, args.func, type);
    node.setPosition(offset);
    var menu = thiz.owner[args.menu];
    if( menu != null )
    {
        menu.addChild(node);
    }
    else
    {
        error("UIButtonL: menu node not found.");
    }
    return node;
}

UIButtonL.make = function(thiz, args, parent)
{
    var ret = {};
    ret.id = new UIButtonL(thiz, args, parent.getPosition());
    return ret;
}

function UIButtonXL(thiz, args, offset)
{
    var node = buttonNormalXL(args.label, BUTTON_OFFSET, thiz, args.func);
    node.setPosition(offset);
    var menu = thiz.owner[args.menu];
    if( menu != null )
    {
        menu.addChild(node);
    }
    else
    {
        error("UIButtonXL: menu node not found.");
    }
    return node;
}

UIButtonXL.make = function(thiz, args, parent)
{
    var ret = {};
    ret.id = new UIButtonXL(thiz, args, parent.getPosition());
    return ret;
}

function makeButton(obj){
    if( obj.state == null ){
        obj.state = true;
    }
    if( obj.type == null ){
        obj.type = BUTTONTYPE_NORMAL;
    }
    var ret = buttonNormalL(obj.label, BUTTON_OFFSET, obj.obj, obj.func, obj.type);
    if( obj.state == false )
    {
        ret.setEnabled(false);
    }
    return ret;
}

function UIScrollView(args, contentsize)
{
    this.node = cc.ScrollView.create();
    this.node.setViewSize(contentsize);
    switch(args.dir)
    {
        case 0:
            this.node.setDirection(cc.SCROLLVIEW_DIRECTION_HORIZONTAL);
            break;
        case 1:
            this.node.setDirection(cc.SCROLLVIEW_DIRECTION_VERTICAL);
            break;
        case 2:
            this.node.setDirection(cc.SCROLLVIEW_DIRECTION_BOTH);
            break;
        default :
            error("UIScrollView: wrong args (dir)");
            break;
    }
}

UIScrollView.make = function(thiz, args, parent)
{
    var ret = {};
    var sc = new UIScrollView(args, parent.getContentSize());
    ret.id = sc.node;
    ret.node = sc.node;
    return ret;
}

function UITreasure()
{
    this.treasure = new TreasureDisplay(0, 0);
}

UITreasure.make = function(thiz, args, parent)
{
    var ret = {};
    var tr = new UITreasure();
    ret.id = tr.treasure;
    ret.node = tr.treasure.node;
    return ret;
}

//--- Cost Node

var PRICE_GAP = 10;

var UIPrice = cc.Node.extend({
    init: function(){
        if( !this._super()) return false;
        //init code here
        this.LENGTH = 0;
        return true;
    },
    //argument sample:
    //{ gold: 1000, diamond: 200 }
    setPrice: function(price){
        this.removeAllChildren();
        var offset = cc.p(0, 0);
        for(var k in price)
        {
            switch(k)
            {
                case "gold":
                {
                    if( offset.x != 0 )
                    {
                        offset.x += PRICE_GAP;
                    }
                    var sp = cc.Sprite.createWithSpriteFrameName("wood-coin.png");
                    sp.setAnchorPoint(cc.p(0, 0.5));
                    sp.setPosition(offset);
                    this.addChild(sp);
                    offset.x += sp.getContentSize().width;
                    var lb = cc.LabelBMFont.create(price[k], "font1.fnt");
                    lb.setAnchorPoint(cc.p(0, 0.5));
                    lb.setPosition(offset);
                    this.addChild(lb);
                    offset.x += lb.getContentSize().width;
                    break;
                }
                case "diamond":
                {
                    if( offset.x != 0 )
                    {
                        offset.x += PRICE_GAP;
                    }
                    var sp = cc.Sprite.createWithSpriteFrameName("wood-jewel.png");
                    sp.setAnchorPoint(cc.p(0, 0.5));
                    sp.setPosition(offset);
                    this.addChild(sp);
                    offset.x += sp.getContentSize().width;
                    var lb = cc.LabelBMFont.create(price[k], "font1.fnt");
                    lb.setAnchorPoint(cc.p(0, 0.5));
                    lb.setPosition(offset);
                    this.addChild(lb);
                    offset.x += lb.getContentSize().width;
                    break;
                }
            }
        }
        this.LENGTH = offset.x;
    },
    getLength: function()
    {
        return this.LENGTH;
    }
});

UIPrice.create = function(price)
{
    var ret = new UIPrice();
    ret.init();
    if( price != null )
    {
        ret.setPrice(price);
    }
    return ret;
}

UIPrice.make = function(thiz, args)
{
    var ret = {};
    ret.id = UIPrice.create(args);
    ret.node = ret.id;
    return ret;
}

//--- Text Area

var regH1 = /^\*\*\*/;
var regH2 = /^\*\*/;
var regPz = /^\#\#/;


var DCTextArea = cc.Layer.extend({
    init: function(){
        if( !this._super() ) return false;
        //init code here
        this.FONT = UI_FONT;
        this.SIZE = UI_SIZE_L;
        this.COLOR = cc.c3b(255, 255, 255);
        this.OPACITY = 255;
        this.DIMENSION = cc.size(0, 0);
        this.TEXT_DIMENSION = cc.size(0, 0);
        this.ALIGN = cc.TEXT_ALIGNMENT_LEFT;
        this.TEXT_HEIGHT = 0;
        this.TEXT_WIDTH = 0;
        this.CONTENTS = [];
        return true;
    },
    setFontName: function(name){
        this.FONT = name;
    },
    setFontSize: function(size){
        this.SIZE = size;
    },
    setDimension: function(dimension){
        this.DIMENSION = dimension;
        //calc TEXT_DIMENSION
        this.TEXT_DIMENSION.width = this.DIMENSION.width;
        this.TEXT_DIMENSION.height = 0;
    },
    setTextColor: function(color){
        this.COLOR = color;
    },
    setTextAligment: function(align){
        this.ALIGN = align;
    },

    /*
    A content is an object with given KVs:
    {
        text: "The Printable Text", //Vital
        font: "Arial", //Optional
        color: a cc.c3b object, //Optional
        align: cc.TEXT_ALIGNMENT_* //Optional
        size: 18 //Optional
     */
    pushText: function(content){
        //auto complete
        if( content.font == null ){
            content.font = this.FONT;
        }
        if( content.size == null ){
            content.size = this.SIZE;
        }
        if( content.color == null ){
            content.color = this.COLOR;
        }
        if( content.align == null ){
            content.align = this.ALIGN;
            //debug("default align");
        }
        //create label
        var label = cc.LabelTTF.create(
            content.text,
            content.font,
            content.size,
            this.TEXT_DIMENSION,
            content.align,
            cc.VERTICAL_TEXT_ALIGNMENT_TOP);
        label.setColor(content.color);
        label.setOpacity(this.OPACITY);
        var height = label.getContentSize().height;
        if( label.getContentSize().width > this.TEXT_WIDTH )
        {
            this.TEXT_WIDTH = label.getContentSize().width;
        }
        for(var k in this.CONTENTS)
        {
            var old = this.CONTENTS[k];
            var oldpos = old.getPosition();
            oldpos.y += height;
            old.setPosition(oldpos);
        }
        label.setAnchorPoint(cc.p(0, 0));
        label.setPosition(cc.p(0, 0));
        this.addChild(label);
        this.CONTENTS.push(label);
        this.TEXT_HEIGHT += height;
        //check dimension
        if( this.DIMENSION.height > 0 )
        {
            while(this.TEXT_HEIGHT > this.DIMENSION.height)
            {
                var rm = this.CONTENTS[0];
                this.TEXT_HEIGHT -= rm.getContentSize().height;
                this.removeChild(rm);
                this.CONTENTS.splice(0, 1);
            }
        }

        //recalc size
        this.setContentSize(cc.size(this.TEXT_WIDTH, this.TEXT_HEIGHT));
    },
    pushMarkdown: function(content){
        content = content.replace("\n\r", "\n");
        content = content.replace("\r", "\n");
        var segments = content.split("\n\n");
        for(var k in segments){
            var seg = segments[k];
            //判断分段类型
            if( regH1.test(seg) ){//大标题
                var strTitle = seg.substring(3, seg.length);
                this.pushText({text: "  "});
                this.pushText({//push desc
                    text: strTitle,
                    size: UI_SIZE_XL,
                    color: cc.c3b(236, 199, 101)
                });
                this.pushText({text: "  "});
            }
            else if( regH2.test(seg) ){//小标题
                var strTitle = seg.substring(2, seg.length);
                this.pushText({//push desc
                    text: strTitle,
                    size: UI_SIZE_L,
                    color: cc.c3b(95, 187, 38)
                });
            }
            else if( regPz.test(seg) ){//奖励
                var strPrize = seg.substring(2, seg.length);
                var prz = null;
                try{
                    var prz = JSON.parse(strPrize);
                }
                catch(e){
                    error("Markdown: Parse failed: \n"+strPrize);
                }
                var libItem = loadModule("xitem.js");
                var prize = libItem.ItemPreview.create(prz, cc.size(this.DIMENSION.width, 0));
                var height = prize.getContentSize().height;
                if( prize.getContentSize().width > this.TEXT_WIDTH )
                {
                    this.TEXT_WIDTH = prize.getContentSize().width;
                }
                for(var k in this.CONTENTS)
                {
                    var old = this.CONTENTS[k];
                    var oldpos = old.getPosition();
                    oldpos.y += height;
                    old.setPosition(oldpos);
                }
                prize.setPosition(cc.p(0, 0));
                this.addChild(prize);
                this.CONTENTS.push(prize);
                this.TEXT_HEIGHT += height;
                //check dimension
                if( this.DIMENSION.height > 0 )
                {
                    while(this.TEXT_HEIGHT > this.DIMENSION.height)
                    {
                        var rm = this.CONTENTS[0];
                        this.TEXT_HEIGHT -= rm.getContentSize().height;
                        this.removeChild(rm);
                        this.CONTENTS.splice(0, 1);
                    }
                }

                //recalc size
                this.setContentSize(cc.size(this.TEXT_WIDTH, this.TEXT_HEIGHT));
            }
            else{//普通文本
                if( k != segments.length-1 ){
                    seg+="\n\n";
                }
                this.pushText({//push desc
                    text: seg,
                    size: UI_SIZE_L
                });
            }
        }
    },
    clearText: function(){
        for(var k in this.CONTENTS)
        {
            this.removeChild(this.CONTENTS[k]);
        }
        this.CONTENTS = [];
        this.TEXT_HEIGHT = 0;
        this.setContentSize(cc.size(0, 0));
    },
    setOpacity: function(op){
        for(var k in this.CONTENTS)
        {
            this.CONTENTS[k].setOpacity(op);
        }
        this.OPACITY = op;
    }
});

DCTextArea.create = function(){
    var ret = new DCTextArea();
    ret.init();
    return ret;
}

DCTextArea.make = function(thiz, args, parent)
{
    var ret = {};
    ret.id = DCTextArea.create();
    ret.node = ret.id;
    ret.id.setDimension(parent.getContentSize());
    return ret;
}

var UIScrollBar = cc.Node.extend({
    init: function(top, bottom, sprite, scrollView){
        if( !this._super()) return false;
        //init code here
        this.SPRITE = cc.Sprite.create(sprite);
        this.SPMLEN = this.SPRITE.getContentSize().height/2;
        ptop = top.getPosition().y - this.SPMLEN;
        pbottom = bottom.getPosition().y + this.SPMLEN;
        this.SCROLLVIEW = scrollView;

        this.setPosition(top.getPosition());
        this.SPRITE.setPosition(cc.p(0, -this.SPMLEN));
        this.SPRITE.setVisible(false);
        this.addChild(this.SPRITE);

        //calc fast values
        this.TOTAL = ptop - pbottom;
        this.MAX = -this.SPMLEN;
        this.MIN = -this.TOTAL - this.SPMLEN;
        this.VIEWSIZE = scrollView.getViewSize();

        this.updateScrollBar();
        return true;
    },
    updateScrollBar: function()
    {
        var contentSize = this.SCROLLVIEW.getContainer().getContentSize();
        if( contentSize.height <= this.VIEWSIZE.height )
        {
            this.SPRITE.setVisible(false);
        }
        else
        {
            this.SPRITE.setVisible(true);
            var offset = this.SCROLLVIEW.getContentOffset();
            var total = contentSize.height - this.VIEWSIZE.height;
            var curr = total + offset.y;
            var soff = curr/total*this.TOTAL;
            var ny = -soff-this.SPMLEN;
            if( ny > this.MAX )
            {
                ny = this.MAX;
            }
            if( ny < this.MIN )
            {
                ny = this.MIN;
            }
            this.SPRITE.setPosition(cc.p(0, ny));
        }
    }
});

UIScrollBar.create = function(top, bottom, sprite, scrollview)
{
    var ret = new UIScrollBar();
    ret.init(top, bottom, sprite, scrollview);
    return ret;
}

//--- RoleBox
var RoleBox = cc.Node.extend({
    init: function()
    {
        if( !this._super() ) return false;
        //init code here
        this.FRAME = cc.Sprite.create("friendbox.png");
        this.FRAME.setAnchorPoint(cc.p(0, 0));
        this.FRAME.setPosition(cc.p(0, 0));
        this.FRAME.setZOrder(1);
        this.addChild(this.FRAME);

        this.RECT = cc.RectClip.create();
        this.RECT.setClipRect(cc.rect(3, 3, this.FRAME.getContentSize().width-6, this.FRAME.getContentSize().height-6));
        this.RECT.setPosition(cc.p(0, 0));
        this.addChild(this.RECT);

        var libAvatar = loadModule("avatar.js");
        this.AVATAR = new libAvatar.Avatar();
        this.AVATAR.setScale(0.75);
        this.AVATAR.node.setPosition(cc.p(40, 0));
        this.RECT.addChild(this.AVATAR.node);

        return true;
    },
    setRole: function(role){
        this.AVATAR.update(role);
        if( role != null )
        {
            this.AVATAR.playAnimation("stand");
        }
    }
});

RoleBox.create = function(role)
{
    var ret = new RoleBox();
    ret.init();
    if( role != null )
    {
        ret.setRole(role);
    }
    return ret;
}

//--- InputField ---
function makeInput(thiz, args, parent){
    var ret = {};

    if( args.size == null ){
        args.size = UI_SIZE_XL;
    }
    if( args.color == null ){
        args.color = cc.c3b(0, 0, 0);
    }
    if( args.length == null ){
        args.length = 50;
    }
    if( args.type == null ){
        args.type = cc.KEYBOARD_RETURNTYPE_DEFAULT;
    }
    if( args.mode == null ){
        args.mode = cc.EDITBOX_INPUT_MODE_ANY | cc.EDITBOX_INPUT_MODE_SINGLELINE;
    }

    var rect = parent.getContentSize();
    var sprite = cc.Scale9Sprite.create("empity.png");
    var theInput = cc.EditBox.create(rect, sprite);
    theInput.setAnchorPoint(cc.p(0, 0));
    theInput.setPlaceholderFontName(UI_FONT);
    theInput.setPlaceholderFontSize(args.size);
    if( args.hold != null ){
        theInput.setPlaceHolder(args.hold);
    }
    theInput.setFontName(UI_FONT);
    theInput.setFontSize(args.size);
    theInput.setFontColor(args.color);
    theInput.setMaxLength(args.length);
    theInput.setReturnType(args.type);
    theInput.setInputMode(args.mode);

    if( args.center == true ){
        theInput.makeTextAlignCenter();
    }

    ret.id = theInput;
    ret.node = theInput;
    return ret;
}

//--- PopMsg
var POPTYPE_INFO = 0;
var POPTYPE_WARN = 1;
var POPTYPE_ERROR = 2;

var PopMsg = cc.Node.extend({
    init: function(){
        if( !this._super() ) return false;
        //init code here
        this.LIST = [];
        return true;
    },
    pushMsg: function(msg, type){
        var text = cc.LabelTTF.create(msg, UI_FONT, UI_SIZE_L);
        text.setColor(MSGPOP_COLORS[type]);

        var label = cc.Scale9Sprite.create("infoboard.png");
        label.setPreferredSize(cc.size(text.getContentSize().width+30, text.getContentSize().height+30));
        text.setAnchorPoint(cc.p(0, 0));
        text.setPosition(cc.p(15, 15));
        label.addChild(text);
        label.setAnchorPoint(cc.p(0.5, 0));
        label.setScale(0);

        var off = label.getContentSize().height + 5;
        var children = this.getChildren();
        for(var k in children){
            var old = children[k].getPosition();
            old.y += off;
            var mv = cc.MoveTo.create(0.2, old);
            children[k].runAction(mv);
        }
        this.addChild(label);
        label.TEXT = text;
        this.LIST.push(label);

        //run action
        label.THIZ = this;
        var tdelay = cc.DelayTime.create(3.3);
        var tfade = cc.FadeOut.create(3);
        var tseq = cc.Sequence.create(tdelay, tfade);
        var lscale = cc.ScaleTo.create(0.2, 1.2);
        var lscale2= cc.ScaleTo.create(0.1, 1);
        var ldelay = cc.DelayTime.create(3);
        var lfade = cc.FadeOut.create(3);
        var lcall = cc.CallFunc.create(function(){
            this.removeFromParent();
            this.THIZ.LIST.shift();
        }, label);
        var lseq = cc.Sequence.create(lscale, lscale2, ldelay, lfade, lcall);
        text.runAction(tseq);
        label.runAction(lseq);
    }
});

PopMsg.create = function(){
    var ret = new PopMsg();
    ret.init();
    return ret;
}

PopMsg.simpleInit = function(layer){
    var winSize = cc.Director.getInstance().getWinSize();
    var ret = PopMsg.create();
    ret.setPosition(cc.p(winSize.width/2, winSize.height*2/3));
    ret.setZOrder(2000);
    ret.setTag(2000);
    layer.addChild(ret);
    return ret;
}

PopMsg.pop = function(msg, typ){
    var top = engine.ui.curLayer;
    var node = top.getChildByTag(2000);
    if( node == null ){
        node = PopMsg.simpleInit(top);
    }
    node.pushMsg(msg, typ);
}

function requestBattle(stage, party){
    var libUIKit = loadModule("uiKit.js");
    //assign variables
    if( engine.user.dungeon == null ){
        engine.user.dungeon = {};
    }
    engine.user.dungeon.stage = stage;
    if( party != null ){
        engine.user.dungeon.party = party;
    }
    //go request
    if( FLAG_BLACKBOX ){
        libUIKit.waitRPC(Request_GameStartDungeon, {
            stg: stage,
            initialDataOnly: true
        }, function(rsp){
            if( rsp.RET == RET_OK ){
                engine.box.start(rsp.arg);
                engine.event.holdNotifications();
                engine.box.process({
                    CNF: Request_GameStartDungeon
                });

                //dump battle state
                engine.user.setData("ddump", engine.box.save());
                engine.user.saveProfile();

                engine.session.clearTeam();
                engine.ui.newScene(loadModule("sceneDungeon.js").scene());

                //统计
                tdga.questBegin("D"+stage);
            }
            else{
                libUIKit.showErrorMessage(rsp);
            }
        });
    }
    else{
        //send rpc request
        libUIKit.waitRPC(Request_GameStartDungeon, {stg: stage}, function(rsp){
            if( rsp.RET == RET_OK ){
                engine.event.holdNotifications();
                engine.session.clearTeam();
                engine.ui.newScene(loadModule("sceneDungeon.js").scene());

                //统计
                tdga.questBegin("D"+stage);
            }
            else{
                libUIKit.showErrorMessage(rsp);
            }
        });
    }
}

function appendVipIcon(label, vip){
    vip = +vip;
    label.removeAllChildren();
    if( vip != null && vip > 0 ){
        var file = "vipicon"+vip+".png";
        label.vip = cc.Sprite.create(file);
        label.vip.setAnchorPoint(cc.p(0, 0.5));
        var contentSize = label.getContentSize();
        var off = cc.p(contentSize.width+10, contentSize.height/2);
        label.vip.setPosition(off);
        label.addChild(label.vip);
    }
}

function filterUserInput(str){
    var ret = str;
    var bans = loadModule("table.js").readTable(TABLE_BAN);
    for(var k in bans){
        ret = ret.replace(bans[k], "*");
    }
    return ret;
}

function queryStage(stg){
    var chapters = loadModule("table.js").readTable(TABLE_STAGE);
    for(var k in chapters){
        for(var m in chapters[k].stage){
            if( chapters[k].stage[m].stageId == stg ) return chapters[k].stage[m];
        }
    }
    return null;
}

function matchDate(scheme, date){
    var boolflag = false;
    //////////年/////////////
    if (scheme.year != null){
        for (var k in scheme.year){
            if (scheme.year[k] == date.getFullYear()){
                boolflag = true;
                break;
            }
        }
    }
    else{
        boolflag = true;
    }
    if (boolflag == false){
        return false;
    }
    else{
        boolflag = false;
    }
    //////////月/////////////
    if (scheme.month != null){
        for (var k in scheme.month){
            if (scheme.month[k] == date.getMonth()){
                boolflag = true;
                break;
            }
        }
    }
    else{
        boolflag = true;
    }
    if (boolflag == false){
        return false;
    }
    else{
        boolflag = false;
    }
    //////////日/////////////
    if (scheme.date != null){
        for (var k in scheme.date){
            if (scheme.date[k] == date.getDate()){
                boolflag = true;
                break;
            }
        }
    }
    else{
        boolflag = true;
    }
    if (boolflag == false){
        return false;
    }
    else{
        boolflag = false;
    }
    //////////周/////////////
    if (scheme.day != null){
        for (var k in scheme.day){
            if (scheme.day[k] == date.getDay()){
                boolflag = true;
                break;
            }
        }
    }
    else{
        boolflag = true;
    }
    return boolflag;
}