/**
 * User: hammer
 * Date: 13-8-26
 * Time: 下午3:31
 */
var SCROLL_HORIZONTAL = 0;
var SCROLL_VERTICAL = 1;
var SCROLL_BOTH = 2;

var ALIGNMENT_TOPLEFT = 0;
var ALIGNMENT_TOPRIGHT = 1;
var ALIGNMENT_BOTTOMLEFT = 2;
var ALIGNMENT_BOTTOMRIGHT = 3;
var ALIGNMENT_CENTER = 4;

function Scroller()
{
    this.layer = cc.Layer.create();
    this.clip = cc.RectClip.create();
    this.layer.addChild(this.clip);
    this.content = cc.Node.create();
    this.clip.addChild(this.content);

    this.layer.setTouchMode(cc.TOUCHES_ONE_BY_ONE);
    this.layer.setTouchEnabled(true);
    this.layer.scheduleUpdate();

    this.layer.update = this.update;
    this.layer.onTouchBegan = this.onTouchBegan;
    this.layer.onTouchMoved = this.onTouchMoved;
    this.layer.onTouchEnded = this.onTouchEnded;
    this.layer.onTouchCancelled = this.onTouchCancelled;

    this.layer.thiz = this;
    this.fly = false;

    this.setScrollMode(SCROLL_BOTH);
    updateMotionBound(this);
}

function accumulateSpeed(scroller, pos, time)
{
    var obj = {};
    obj.pos = pos;
    obj.time = time;
    scroller.acc.push(obj);

    var gap = scroller.acc[scroller.acc.length-1].time - scroller.acc[0].time;
    while( gap > 0.5 )
    {
        scroller.acc.pop();
        gap = scroller.acc[scroller.acc.length-1].time - scroller.acc[0].time;
    }
}

function updateMotionBound(scroller)
{
    var clipsize = scroller.clip.getClipRect();
    var contentsize = scroller.content.getContentSize();
    scroller.bound = {};
    //calc x
    scroller.bound.leftX = contentsize.width/2;
    scroller.bound.rightX = clipsize.width - contentsize.width/2;
    scroller.bound.minX = scroller.bound.leftX < scroller.bound.rightX ? scroller.bound.leftX : scroller.bound.rightX;
    scroller.bound.maxX = scroller.bound.leftX < scroller.bound.rightX ? scroller.bound.rightX : scroller.bound.leftX;

    //calc y
    scroller.bound.topY = clipsize.height - contentsize.height/2;
    scroller.bound.bottomY = contentsize.height/2;
    scroller.bound.minY = scroller.bound.topY < scroller.bound.bottomY ? scroller.bound.topY : scroller.bound.bottomY;
    scroller.bound.maxY = scroller.bound.topY < scroller.bound.bottomY ? scroller.bound.bottomY : scroller.bound.topY;
}

Scroller.prototype.setPressCallback = function(obj, func)
{
    this.callback = {};
    this.callback.obj = obj;
    this.callback.func = func;
}

Scroller.prototype.getContentNode = function()
{
    return this.content;
}

Scroller.prototype.getLayerNode = function()
{
    return this.layer;
}

Scroller.prototype.setScrollMode = function(mode)
{
    this.mode = mode;
}

Scroller.prototype.setContentSize = function(size)
{
    this.content.setContentSize(size);
    updateMotionBound(this);
}

Scroller.prototype.setClipSize = function(size)
{
    var rect = cc.rect(0, 0, size.width, size.height);
    this.clip.setClipRect(rect);
    updateMotionBound(this);
    this.setAlignment(ALIGNMENT_TOPLEFT);
}

Scroller.prototype.setAlignment = function(align)
{
    switch(align)
    {
        case ALIGNMENT_TOPLEFT:
            this.content.setPosition(cc.p(this.bound.leftX, this.bound.topY));
            break;
        case ALIGNMENT_TOPRIGHT:
            this.content.setPosition(cc.p(this.bound.rightX, this.bound.topY));
            break;
        case ALIGNMENT_BOTTOMLEFT:
            this.content.setPosition(cc.p(this.bound.leftX, this.bound.bottomY));
            break;
        case ALIGNMENT_BOTTOMRIGHT:
            this.content.setPosition(cc.p(this.bound.rightX, this.bound.bottomY));
            break;
        case ALIGNMENT_CENTER:
            this.content.setPosition(cc.p((this.bound.minX+this.bound.maxX)/2, (this.bound.minY+this.bound.maxY)/2));
            break;
    }
}

Scroller.prototype.setFriction = function(friction)
{
    this.friction = friction;
}

Scroller.prototype.setBounce = function(bounce)
{
    this.bounce = bounce;
}

Scroller.prototype.setBackfade = function(backfade)
{
    this.backfade = backfade;
}

Scroller.prototype.update = function(delta)
{
    var thiz = this.thiz;
    if( thiz.fly )
    {
        var np = thiz.content.getPosition();
        var dis = cc.pMult(thiz.speed, delta);
        np = cc.pAdd(np, dis);
        thiz.content.setPosition(np);

        //friction
        var slow = delta*thiz.friction;
        var len = cc.pLength(thiz.speed);
        if( len < slow )
        {
            thiz.speed = cc.p(0, 0);
        }
        else
        {
            var nlen = len - slow;
            var dir = cc.pNormalize(thiz.speed);
            thiz.speed = cc.pMult(dir, nlen);
        }

        //bounce
        if( thiz.mode == SCROLL_HORIZONTAL || thiz.mode == SCROLL_BOTH )
        {
            var target = 0;
            if( np.x < thiz.bound.minX )
            {
                target = (thiz.bound.minX - np.x)*thiz.bounce;
                if( target < 50 )
                {
                    target = 50;
                }
            }
            if( np.x > thiz.bound.maxX )
            {
                target = -(np.x - thiz.bound.maxX)*thiz.bounce;
                if( target > -50 )
                {
                    target = -50;
                }
            }
            if( target != 0 )
            {
                thiz.speed.x = target;
            }
        }
        if( thiz.mode == SCROLL_VERTICAL || thiz.mode == SCROLL_BOTH )
        {
            var target = 0;
            if( np.y < thiz.bound.minY )
            {
                target = (thiz.bound.minY - np.y)*thiz.bounce;
                if( target < 50 )
                {
                    target = 50;
                }
            }
            if( np.y > thiz.bound.maxY )
            {
                target = -(np.y - thiz.bound.maxY)*thiz.bounce;
                if( target > -50 )
                {
                    target = -50;
                }
            }
            if( target != 0 )
            {
                thiz.speed.y = target;
            }
        }
    }
}

Scroller.prototype.onTouchBegan = function(touch, event)
{
    var thiz = this.thiz;
    var pos = touch.getLocation();
    var rpos = thiz.clip.convertToNodeSpace(pos);
    if( cc.rectContainsPoint(thiz.clip.getClipRect(), rpos) )
    {
        thiz.lastPoint = pos;
        thiz.fly = false;
        thiz.acc = [];
        accumulateSpeed(thiz, pos, Date.now()/1000);
        thiz.beginTouch = pos;
        return true;
    }
    return false;
}

Scroller.prototype.onTouchMoved = function(touch, event)
{
    var thiz = this.thiz;
    var pos = touch.getLocation();
    var dis = cc.pSub(pos, thiz.lastPoint);
    var np = thiz.content.getPosition();

    if( thiz.mode == SCROLL_HORIZONTAL || thiz.mode == SCROLL_BOTH )
    {//move x
        if( np.x < thiz.bound.minX && dis.x < 0 )
        {
            var fade = 1 - (thiz.bound.minX - np.x)/thiz.backfade;
            dis.x *= fade;
        }
        else if( np.x > thiz.bound.maxX && dis.x > 0 )
        {
            var fade = 1 - (np.x - thiz.bound.maxX)/thiz.backfade;
            dis.x *= fade;
        }
        np.x += dis.x;
    }
    if( thiz.mode == SCROLL_VERTICAL || thiz.mode == SCROLL_BOTH )
    {//move y
        if( np.y < thiz.bound.minY && dis.y < 0 )
        {
            var fade = 1 - (thiz.bound.minY - np.y)/thiz.backfade;
            dis.y *= fade;
        }
        else if( np.y > thiz.bound.maxY && dis.y > 0 )
        {
            var fade = 1 - (np.y - thiz.bound.maxY)/thiz.backfade;
            dis.y *= fade;
        }
        np.y += dis.y;
    }

    thiz.content.setPosition(np);
    thiz.lastPoint = pos;
    accumulateSpeed(thiz, pos, Date.now()/1000);
}

Scroller.prototype.onTouchEnded = function(touch, event)
{
    var pos = touch.getLocation();
    var thiz = this.thiz;

    var dis = cc.pSub(pos, thiz.beginTouch);
    if( cc.pLengthSQ(dis) < CLICK_RANGESQ )
    {
        var rpos = thiz.content.convertToNodeSpace(pos);
        debug("HIT RPOS = "+JSON.stringify(rpos));
        if( thiz.callback != null )
        {
            thiz.callback.obj.func(rpos);
        }
    }
    else
    {
        if( thiz.acc.length > 1 )
        {
            var dis = cc.pSub(thiz.acc[thiz.acc.length-1].pos, thiz.acc[0].pos);
            var duration = thiz.acc[thiz.acc.length-1].time - thiz.acc[0].time;
        }
        else
        {
            var dis = cc.p(0, 0);
            var duration = 1;
        }

        var speed = cc.p(0, 0);

        if( thiz.mode == SCROLL_HORIZONTAL || thiz.mode == SCROLL_BOTH )
        {//move x
            speed.x = dis.x/duration;
        }
        if( thiz.mode == SCROLL_VERTICAL || thiz.mode == SCROLL_BOTH )
        {//move y
            speed.y = dis.y/duration;
        }

        thiz.fly = true;
        thiz.speed = speed;
    }
}

Scroller.prototype.onTouchCancelled = function(touch, event)
{
    this.onTouchEnded(touch, event);
}

exports.ALIGNMENT_TOPLEFT = ALIGNMENT_TOPLEFT;
exports.ALIGNMENT_TOPRIGHT = ALIGNMENT_TOPRIGHT;
exports.ALIGNMENT_BOTTOMLEFT = ALIGNMENT_BOTTOMLEFT;
exports.ALIGNMENT_BOTTOMRIGHT = ALIGNMENT_BOTTOMRIGHT;
exports.ALIGNMENT_CENTER = ALIGNMENT_CENTER;
exports.SCROLL_HORIZONTAL = SCROLL_HORIZONTAL;
exports.SCROLL_VERTICAL = SCROLL_VERTICAL;
exports.SCROLL_BOTH = SCROLL_BOTH;
exports.Scroller = Scroller;