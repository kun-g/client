/**
 * User: hammer
 * Date: 13-7-17
 * Time: 下午5:52
 */

/*** POPNUM ***/
var PopNum_Miss = 0;
var PopNum_Damage = 1;
var PopNum_Critical = 2;
var PopNum_Block = 3;
var PopNum_Heal = 4;

var sPopNumColors = [
    [232,  55, 55],
    [232,  55, 55],
    [232,  55, 55],
    [232,  55, 55],
    [133, 222, 44]
];

var JUMPUPTIME = 0.1;
var JUMPHEIGHT = 50;
var JUMPDOWNTIME = 0.1;
var BOUNCEHEIGHT = 20;
var BOUNCEUPTIME = 0.07;
var BOUNCEDOWNTIME = 0.05;
var JUMPDELAY = 0.1;
var DELAYTIME = 0.1;
var STAYTIME = 0.5;
var FADETIME = 0.5;

function attachEffectPopNum(node, offset, number, style)
{
    var batch = cc.SpriteBatchNode.create("popnum.png");
    var color = cc.c3b(sPopNumColors[style][0], sPopNumColors[style][1], sPopNumColors[style][2]);
    var str = number.toString();
    if( style == PopNum_Miss )
    {
        str = "miss";
    }
    else if( style == PopNum_Block )
    {
        str = "block";
    }
    var length = 0;
    for(var i=0; i<str.length; ++i)
    {
        var n = str.charAt(i);
        var sp = cc.Sprite.createWithSpriteFrameName(n+".png");
        sp.setAnchorPoint(cc.p(0, 0.5));
        sp.setPosition(cc.p(length, 0));
        sp.setColor(color);
        batch.addChild(sp);
        length += sp.getContentSize().width;
    }
    var mid = length/2;
    var children = batch.getChildren();
    for(var k in children)
    {
        var i = Number(k);
        var sp = children[i];
        var pos = sp.getPosition();
        pos.x -= mid;
        sp.setPosition(pos);
        sp.setVisible(false);

        var dt = cc.DelayTime.create(i*DELAYTIME);
        var sh = cc.Show.create();
        var mb0 = cc.MoveBy.create(JUMPUPTIME, cc.p(0, JUMPHEIGHT));
        var mb1 = cc.MoveBy.create(JUMPDOWNTIME, cc.p(0, -JUMPHEIGHT));
        var mb2 = cc.MoveBy.create(BOUNCEUPTIME, cc.p(0, BOUNCEHEIGHT));
        var mb3 = cc.MoveBy.create(BOUNCEDOWNTIME, cc.p(0, -BOUNCEHEIGHT));
        var dt2 = cc.DelayTime.create(STAYTIME + (str.length-i)*DELAYTIME);
        var fo = cc.FadeOut.create(FADETIME);
        var seq = cc.Sequence.create(dt, sh, mb0, mb1, mb2, mb3, dt2, fo);

        sp.runAction(seq);
    }
    batch.setPosition(offset);
    node.addChild(batch);

    var dt = cc.DelayTime.create(5);
    var rm = cc.CallFunc.create(batch.removeFromParent, batch);
    var seq = cc.Sequence.create(dt, rm);
    batch.runAction(seq);

    if( style == PopNum_Critical )
    {
        var st = cc.ScaleTo.create(0.2, 1, 1.3);
        var st2 = cc.ScaleTo.create(0.3, 1.3, 0.8);
        var st3 = cc.ScaleTo.create(0.2, 0.8, 1);
        var seq2 = cc.Sequence.create(st, st2, st3);
        batch.runAction(seq2);
    }

    return batch;
}

var EFFECTMODE_AUTO = 0;
var EFFECTMODE_LOOP = 1;
var EFFECTMODE_STAY = 2;

function onEffectCompleted(name)
{
    switch(this.MODE)
    {
        case EFFECTMODE_LOOP:
            //似乎jsb版本不能正确的传入结束动画的名称
            this.animationManager.runAnimationsForSequenceNamed("effect");
            return;
        case EFFECTMODE_STAY://do nothing
            if( this.FUNC != null ){
                this.FUNC.apply(this.OBJ, this.ARGS);
            }
            return;
        case EFFECTMODE_AUTO:
        default :
        {
            if( this.FUNC != null ){
                this.FUNC.apply(this.OBJ, this.ARGS);
            }
            this.removeFromParent();
        }

    }
}

function readEffectNode(effectId, dropCid)
{
    var scheme = loadModule("table.js").queryTable(TABLE_EFFECT, effectId);
    if( scheme != null )
    {
        var owner = {};
        configParticle(owner);
        var eff = cc.BuilderReader.load(scheme.file, owner);
        eff.owner = owner;

        //process attach
        if( scheme.attach != null )
        {
            for(var k in scheme.attach)
            {
                var attachment = scheme.attach[k];
                if( owner[attachment.name] != null )
                {
                    var anode = cc.BuilderReader.load(attachment.file);
                    owner[attachment.name].addChild(anode);
                    anode.animationManager.runAnimationsForSequenceNamed("effect");
                }
                else
                {
                    error("attachEffect: Attach name not found.");
                }
            }
        }

        if( scheme.rotate )
        {
            eff.setRotation(360*Math.random());
        }

        if( dropCid != null ){
            if( dropCid >= 0 ){
                var libItem = loadModule("xitem.js");
                var spItem = cc.Sprite.create(libItem.getItemIcon(dropCid));
            }else if( dropCid = -1 ){
                var spItem = cc.Sprite.create("mission-coin.png");
            }else{
                var spItem = cc.Sprite.create("wenhao.png");
            }
            spItem.setScale(0.6);
            var a1 = cc.DelayTime.create(1.3);
            var a2 = cc.FadeOut.create(0.2);
            var seq = cc.Sequence.create(a1, a2);
            if( owner.nodeItem != null){
                owner.nodeItem.addChild(spItem);
            }else{
                debug("owner.nodeItem is null");
            }
            spItem.runAction(seq);
        }

        eff.animationManager.runAnimationsForSequenceNamed("effect");
        if( scheme.z != null ){
            eff.setZOrder(scheme.z);
        }

        return eff;
    }
    else
    {
        error("attachEffect: No such effect ("+effectId+")");
        return null;
    }
}

function setEffectCallback(func, obj, args){
    this.FUNC = func;
    this.OBJ = obj;
    this.ARGS = args;
}

function attachEffectCCBI(parent, pos, file, mode, z, scale){
    if( mode == null ){
        mode = EFFECTMODE_AUTO;
    }
    var owner = {};
    configParticle(owner);
    var node = cc.BuilderReader.load(file, owner);
    node.owner = owner;
    node.MODE = mode;
    node.animationManager.setCompletedAnimationCallback(node, onEffectCompleted);
    node.animationManager.runAnimationsForSequenceNamed("effect");
    node.setPosition(pos);
    if( z != null ){
        node.setZOrder(z);
    }
    if( scale != null){
        node.setScale(scale);
    }
    parent.addChild(node);

    node.setCompleteCallback = setEffectCallback;
    return node;
}

function attachEffect(node, offset, effectId, mode, dropCid)
{
    if( mode == null )
    {
        mode = EFFECTMODE_AUTO;
    }
    var eff = readEffectNode(effectId, dropCid);
    eff.MODE = mode;
    eff.animationManager.setCompletedAnimationCallback(eff, onEffectCompleted);
    eff.setPosition(offset);
    node.addChild(eff);

    node.setCompleteCallback = setEffectCallback;
    return eff;
}

function onMissileEffectUpdate(delta){
    var eff = this;
//    var pPrevious = eff.getPosition();
    eff.TIMER += delta;
    var alpha = eff.TIMER / eff.FLYTIME;
    var pNext = cc.pBezier1(eff.V1, eff.V2, eff.V3, alpha);
    var oNext = missileOpacCtrl(alpha);
//    var radians = cc.pAngle(eff.V1, eff.V3);
    if( alpha > 1 ){
        this.unscheduleUpdate();
        eff.removeFromParent();
    }
    else{
        for (var k in eff.getChildren() ){
            eff.getChildren()[k].setOpacity(oNext);
        }
        eff.setPosition(pNext);
    }
}

function missileOpacCtrl(x) {
    var y = - Math.pow(x-1, 2) + 1;
    y *= 255;
    return y;
}

function attachMissileEffect(node, effectId, startPoint, endPoint)
{
    var eff = readEffectNode(effectId);
    eff.MODE = EFFECTMODE_LOOP;
    eff.animationManager.setCompletedAnimationCallback(eff, onEffectCompleted);
    eff.setPosition(startPoint);
    node.addChild(eff);
    //setup arguments
    var scheme = loadModule("table.js").queryTable(TABLE_EFFECT, effectId);
    eff.V1 = startPoint;
    eff.V3 = endPoint;
    var dist = cc.pDistance(startPoint, endPoint);
    var hoff = dist*scheme.radian;
    eff.V2 = cc.pMidpoint(startPoint, endPoint);
    eff.V2.y += hoff;
    eff.setRotation(cc.angleOfLine(eff.V1, eff.V3));
    eff.TIMER = 0;
    eff.FLYTIME = scheme.flytime;
    eff.update = onMissileEffectUpdate;
    eff.scheduleUpdate();

    return eff;
}


function attachBubbleEffect(node, effectId, type, content, duration, grid) {
    if( node == null || effectId == null ){
        error("attachBubbleEffect: node or effectId is null");
        return;
    }
    var eff = readEffectNode(effectId);
    node.addChild(eff);
    if( grid != null ){ //add to pos
        var position = calcPosInGrid(grid);
        eff.setPosition(position);
    }
    if( eff.owner.nodeContent == null){
        error("attachBubbleEffect: eff.owner.nodeContent is null");
        return;
    }
    switch (Number(type)){
        case 0: //Picture
            var sp = cc.Sprite.create(content);
            eff.owner.nodeContent.addChild(sp);
            break;
        case 1: //Text
            var lab = eff.owner.labContent;
            var bubble = eff.owner.spBubble;
            lab.setString(content);
            var labSize = lab.getContentSize();
            var bubbleSize = bubble.getContentSize();
            if( labSize.width > 70 ){
                bubbleSize.width += (labSize.width-70)*1.25;
                bubble.setContentSize(bubbleSize);
                var labPos = lab.getPosition();
                labPos.x += -(labSize.width-70)*0.625;
                lab.setPosition(labPos);
            }
            if( labSize.height > 36 ){
                bubbleSize.height += (labSize.height-36);
                bubble.setContentSize(bubbleSize);
            }
            break;
        case 2: //Effect(CCB)
            attachEffectCCBI(eff.owner.nodeContent, cc.p(0, 0), content);
            break;
        default:
            break;
    }

    eff.flipCtrl = bubbleFlipController;
    eff.flipCtrl();

    eff.animationManager.runAnimationsForSequenceNamed("open");

    if( duration == null || duration < 0 ){
        duration = 2;
    }
    var act1 = cc.DelayTime.create(duration);
    var act2 = cc.CallFunc.create(function() {
        eff.animationManager.setCompletedAnimationCallback(eff, function(){
            eff.removeFromParent();
        });
        eff.animationManager.runAnimationsForSequenceNamed("close");
    });
    var seq = cc.Sequence.create(act1, act2);
    node.runAction(seq);
//    eff.update = bubbleEffectUpdate;
//    eff.scheduleUpdate();
}

function bubbleFlipController() {
    var worldPos = this.owner.nodeContent.getParent().convertToWorldSpace(this.owner.nodeContent.getPosition());
    if( worldPos.x-30 < 0 ){
        this.setScaleX(-1);
        this.owner.labContent.setScaleX(-1);
    }else{
        this.setScaleX(1);
        this.owner.labContent.setScaleX(1);
    }
}

exports.PopNum_Damage = PopNum_Damage;
exports.PopNum_Heal = PopNum_Heal;
exports.PopNum_Miss = PopNum_Miss;
exports.PopNum_Block = PopNum_Block;
exports.PopNum_Critical = PopNum_Critical;
exports.attachEffectPopNum = attachEffectPopNum;
exports.attachEffect = attachEffect;
exports.attachEffectCCBI = attachEffectCCBI;
exports.attachMissileEffect = attachMissileEffect;
exports.attachBubbleEffect = attachBubbleEffect;
exports.readEffectNode = readEffectNode;
exports.EFFECTMODE_AUTO = EFFECTMODE_AUTO;
exports.EFFECTMODE_LOOP = EFFECTMODE_LOOP;
exports.EFFECTMODE_STAY = EFFECTMODE_STAY;