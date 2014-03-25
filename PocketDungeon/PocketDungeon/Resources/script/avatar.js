/**
 * User: hammer
 * Date: 13-7-9
 * Time: 下午6:34
 */

var LABEL_OFFSET = 20;
var LABEL_SINK = -35;
var BLINK_CYCLE = 2;
var FLASH_TIME = 0.5;

function setNodeColor(node, color)
{
    if( node.setColor != null )
    {
        node.setColor(color);
    }
    var children = node.getChildren();
    for(var k in children)
    {
        setNodeColor(children[k], color);
    }
}

function setNodeOpacity(node, opacity)
{
    if( node.setOpacity != null )
    {
        node.setOpacity(opacity);
    }
    var children = node.getChildren();
    for(var k in children)
    {
        setNodeOpacity(children[k], opacity);
    }
}

function pReset()
{
    if( this.p != null ) this.p.resetSystem();
}

function pStop()
{
    if( this.p != null ) this.p.stopSystem();
}

/**
 * CCBox Wrapper of CocosBuilder Node
 */
function CCBox(name, file)
{
    this.name = name;
    this.owner = {};
    this.owner.pReset = pReset;
    this.owner.pStop = pStop;
    this.stop = true;
    this.color = cc.c3b(255, 255, 255);
    this.defaultAnimation = null;
    this.node = cc.BuilderReader.load(file, this.owner);
    if( checkNull(this.node, "CCBox: file("+file+") is not loaded.") ) return;
    this.node.animationManager.setCompletedAnimationCallback(this, this.onAnimationComplete);
    //play default animation
    this.node.animationManager.runAnimationsForSequenceNamed("effect");
}

CCBox.prototype.onAnimationComplete = function(name)
{
    if( this.loop )
    {
        this.playAnimation(this.anim, this.loop);
    }
    this.stop = true;
    //play default animation
    if( this.defaultAnimation != null ){
        this.node.animationManager.runAnimationsForSequenceNamed(this.defaultAnimation);
        this.loop = true;
    }
}

CCBox.prototype.setColor = function(color)
{
    setNodeColor(this.node, color);
    this.color = color;
}

CCBox.prototype.blendColor = function(color, alpha)
{
    setNodeColor(this.node, cc.c3bLerp(this.color, color, alpha));
}

CCBox.prototype.setOpacity = function(opacity)
{
    setNodeOpacity(this.node, opacity);
}

CCBox.prototype.setDefaultAnimation = function(defaultAnimation)
{
    this.defaultAnimation = defaultAnimation;
}

CCBox.prototype.playAnimation = function(name, loop)
{
    if( loop == null )
    {
        loop = false;
    }
    this.loop = loop;
    this.anim = name;
    if( this.node != null ) this.node.animationManager.runAnimationsForSequenceNamed(name);
    this.stop = false;
}

CCBox.prototype.stopAnimation = function()
{
    this.node.stopAllActions();
    this.loop = false;
    this.stop = true;
}

CCBox.prototype.getAnimation = function()
{
    return this.node.animationManager.getRunningSequenceName();
}

function findBox(avatar, name)
{
    if( avatar.boxes != null )
    {
        for(var k in avatar.boxes)
        {
            if( avatar.boxes[k].name == name )
            {
                return avatar.boxes[k];
            }
        }
    }
    return null;
}

//create an avatar
function Avatar(role, lazyLoad)
{
    //default arguments
    if( lazyLoad == null ) lazyLoad = false;

    this.node = cc.Node.create();
    this.node.update = this.tick;
    this.node.thiz = this;
    this.SCALE = 1;
    this.FLIPX = false;
    this.color = cc.c3b(255, 255, 255);
    this.node.scheduleUpdate();
    this.BOSSFLAG = false;
    this.LAZY_LOAD = lazyLoad;

    if( typeof(role) != "number" )
    {
        this.ROLE = role;
        if( !this.LAZY_LOAD ) this.update(this.ROLE);
    }
    else
    {
        var moduleRole = loadModule("role.js");
        var ro = new moduleRole.Role();
        ro.ClassId = role;
        ro.fix();
        this.ROLE = ro;
        if( !this.LAZY_LOAD ) this.update(this.ROLE);
    }
}

Avatar.prototype.doLoad = function(){
    if( this.LAZY_LOAD ){//prevent from loading twice
        this.update(this.ROLE);
        this.LAZY_LOAD = false;
    }
}

Avatar.prototype.getNode = function()
{
    return this.node;
}

Avatar.prototype.setPosition = function(pos)
{
    this.node.setPosition(pos);
}

Avatar.prototype.getPosition = function()
{
    return this.node.getPosition();
}

Avatar.prototype.setPositionGrid = function(grid)
{
    var pos = calcPosInGrid(grid);
    this.setPosition(pos);
}

Avatar.prototype.setTag = function(tag)
{
    this.node.setTag(tag);
}

Avatar.prototype.getTag = function()
{
    return this.node.getTag();
}

Avatar.prototype.setZOrder = function(z)
{
    this.node.setZOrder(z);
}

Avatar.prototype.setHealth = function(health, color)
{
    if( this.hideHealth == true ) return;

    if( this.health == null )
    {
        this.health = cc.Sprite.createWithSpriteFrameName("hpicon.png");
        this.health.setPosition(cc.p(0, LABEL_SINK));
        this.node.addChild(this.health);
    }
    if( this.BOSSHP != null ){
        this.BOSSHP.setHP(health);
        return;
    }
    if( health > 0 )
    {
        this.health.setVisible(true);
        this.health.removeAllChildren(true);
        var label = cc.LabelBMFont.create(health, "font26.fnt");
        label.setAnchorPoint(cc.p(0, 0.5));
        label.setPosition(cc.p(LABEL_OFFSET, this.health.getContentSize().height/2));
        this.health.addChild(label);

        var length = label.getContentSize().width + LABEL_OFFSET;
        length /= 2;
        var np = this.health.getPosition();
        np.x = LO_GRID/4 - length;
        this.health.setPosition(np);

        if( color != null )
        {
            switch(color)
            {
                case 1:
                    label.setColor(COLOR_VALUEDOWN);
                    break;
                case 2:
                    label.setColor(COLOR_VALUEUP);
                    break;
            }
        }
    }
    else
    {
        this.health.setVisible(false);
    }
}

Avatar.prototype.setAttack = function(attack, color)
{
    if( this.hideAttack == true ) return;

    if( this.attack == null )
    {
        this.attack = cc.Sprite.createWithSpriteFrameName("attackicon.png");
        this.attack.setPosition(cc.p(0, LABEL_SINK));
        this.node.addChild(this.attack);
    }
    if( this.BOSSHP != null ){
        return;
    }
    if( attack > 0 )
    {
        this.attack.setVisible(true);
        this.attack.removeAllChildren(true);
        var label = cc.LabelBMFont.create(attack, "font26.fnt");
        label.setAnchorPoint(cc.p(0, 0.5));
        label.setPosition(cc.p(LABEL_OFFSET, this.attack.getContentSize().height/2));
        this.attack.addChild(label);

        var length = label.getContentSize().width + LABEL_OFFSET;
        length /= 2;
        var np = this.attack.getPosition();
        np.x = -length - LO_GRID/4;
        this.attack.setPosition(np);

        if( color != null )
        {
            switch(color)
            {
                case 1:
                    label.setColor(COLOR_VALUEDOWN);
                    break;
                case 2:
                    label.setColor(COLOR_VALUEUP);
                    break;
            }
        }
    }
    else
    {
        this.attack.setVisible(false);
    }
}

Avatar.prototype.update = function(role)
{
    var table = loadModule("table.js");
    //清除旧数据
    if( this.box != null )
    {
        this.box.node.removeFromParent();
        delete this.box;
    }
    if( this.boxes != null )
    {
        delete this.boxes;
    }

    //允许空角色
    if( role == null )
    {
        return;
    }

    this.boxes = [];
    //骨架
    var RoleClass = table.queryTable(TABLE_ROLE, role.ClassId);
    this.box = new CCBox("avatar", RoleClass.avatar);

    //隐藏血量和攻击力的处理
    if( RoleClass.classType == 2 ){
        //npc默认开启
        if( RoleClass.hideHealth == null ){
            this.hideHealth = true;
        }
        else{
            this.hideHealth = RoleClass.hideHealth;
        }
        if( RoleClass.hideAttack == null ){
            this.hideAttack = true;
        }
        else{
            this.hideAttack = RoleClass.hideAttack;
        }
    }
    else{
        //其余角色默认关闭
        if( RoleClass.hideHealth == null ){
            this.hideHealth = false;
        }
        else{
            this.hideHealth = RoleClass.hideHealth;
        }
        if( RoleClass.hideAttack == null ){
            this.hideAttack = false;
        }
        else{
            this.hideAttack = RoleClass.hideAttack;
        }
    }

    //装备
    if( role.Armors != null ){
        if( this.boxes == null ){
            this.boxes = [];
        }

        var armorList = [];
        //copy
        for(var k in role.Armors){
            armorList[k] = role.Armors[k];
        }
        //replace
        if( armorList[EquipSlot_StoreMainHand] != null ){
            armorList[EquipSlot_MainHand] = null;
        }
        if( armorList[EquipSlot_StoreSecondHand] != null ){
            armorList[EquipSlot_SecondHand] = null;
        }
        if( armorList[EquipSlot_StoreHair] != null ){
            armorList[EquipSlot_Hair] = null;
        }
        if( armorList[EquipSlot_StoreSuit] != null ){
            armorList[EquipSlot_Chest] = null;
            armorList[EquipSlot_Legs] = null;
        }
        if( armorList[EquipSlot_StoreGear] != null ){
            armorList[EquipSlot_Eye] = null;
            armorList[EquipSlot_Brow] = null;
        }
        //suit up
        for(var index in armorList)
        {
            var item = armorList[index];
            if( item != null )
            {//可能某个槽位为空
                var ItemClass = table.queryTable(TABLE_ITEM, item.ClassId);

                var effects = null;
                if( ItemClass.effecta != null )
                {
                    effects = ItemClass.effecta;
                }
                else
                {
                    if( role.Gender == null || role.Gender == 0 )
                    {
                        if( ItemClass.effectf != null )
                        {
                            effects = ItemClass.effectf;
                        }
                    }
                    else
                    {
                        if( ItemClass.effectm != null )
                        {
                            effects = ItemClass.effectm;
                        }
                    }
                }
                if( effects != null )
                {
                    for(var k in effects)
                    {
                        var eff = effects[k];
                        var part = new CCBox(eff.part, eff.file);
                        this.boxes.push(part);
                        if( this.box.owner[eff.part] != null ){
                            if( part.node != null ){
                                this.box.owner[eff.part].addChild(part.node);
                            }
                            else{
                                error("Part ("+eff.part+": "+eff.file+") is not exist.");
                            }
                        }
                        else{
                            error("Attach point ("+eff.part+") is not found.");
                        }
                    }
                }
            }
        }
    }

    //设置头发色彩
    var colorIndex = role.HairColor;
    if( colorIndex == null )
    {
        colorIndex = 0;
    }
    var color = queryColor(colorIndex);
    this.setHairColor(color);

    //缩放
    if( RoleClass.scale != null )
    {
        this.setScale(RoleClass.scale);
    }

    this.box.node.setPosition(cc.p(0, -25));
    this.node.addChild(this.box.node);
}

Avatar.prototype.setHairColor = function(color)
{
    var hair = findBox(this, "hair");
    var hair2 = findBox(this, "hair2");
    var hair3 = findBox(this, "hair3");
    if( hair != null )
    {
        hair.setColor(color);
    }
    if( hair2 != null )
    {
        hair2.setColor(color);
    }
    if( hair3 != null )
    {
        hair3.setColor(color);
    }
}

Avatar.prototype.setColor = function(color)
{
    if( this.boxes != null )
    {
        for( var k in this.boxes )
        {
            var b = this.boxes[k];
            b.setColor(color);
        }
    }
    this.color = color;
}

Avatar.prototype.blendColor = function(color, alpha)
{
    this.box.blendColor(color, alpha);
    if( this.boxes != null )
    {
        for( var k in this.boxes )
        {
            var b = this.boxes[k];
            b.blendColor(color, alpha);
        }
    }
}

Avatar.prototype.tick = function(delta)
{
    var thiz = this.thiz;
    if( thiz.FLASH != null ){
        thiz.FLASH.timer += delta;
        var alpha = thiz.FLASH.timer/FLASH_TIME;
        if( alpha > 1 ){
            delete thiz.FLASH;
            thiz.blendColor(cc.c3b(255, 255, 255), 0);
        }
        else{
            thiz.blendColor(thiz.FLASH.color, 1-alpha);
        }
    }
    else if( thiz.blink != null )
    {
        thiz.blink.timer += delta;
        thiz.blink.timer %= BLINK_CYCLE;
        var alpha = 0;
        if( thiz.blink.timer < BLINK_CYCLE/2 )
        {
            alpha = thiz.blink.timer/(BLINK_CYCLE/2);
        }
        else
        {
            alpha = 1 - (thiz.blink.timer-BLINK_CYCLE/2)/(BLINK_CYCLE/2);
        }
        thiz.blendColor(thiz.blink.color, alpha);
    }
    if( thiz.fadeout != null )
    {
        thiz.fadeout.timer += delta;
        if( thiz.fadeout.timer > thiz.fadeout.duration )
        {
            thiz.setOpacity(0);
            delete thiz.fadeout;
        }
        else
        {
            var alpha = thiz.fadeout.timer/thiz.fadeout.duration;
            var opacity = 255 - 255*alpha;
            thiz.setOpacity(opacity);
            thiz.blendColor(cc.c3b(0, 0, 0), alpha);
        }
    }
}

Avatar.prototype.setFadeOut = function(duration)
{
    this.fadeout = {};
    this.fadeout.timer = 0;
    this.fadeout.duration = duration;
}

Avatar.prototype.isRunningFadeOut = function()
{
    return (this.fadeout != null);
}

Avatar.prototype.resetBlinkColor = function()
{
    delete this.blink;
    this.blendColor(cc.c3b(255, 255, 255), 0);
}

Avatar.prototype.setBlinkColor = function(color)
{
    this.blink = {};
    this.blink.color = color;
    this.blink.timer = 0;
}

Avatar.prototype.flash = function(color)
{
    this.FLASH = {};
    this.FLASH.color = color;
    this.FLASH.timer = 0;
}

Avatar.prototype.setOpacity = function(opacity)
{
    if( this.boxes != null )
    {
        for( var k in this.boxes )
        {
            var b = this.boxes[k];
            b.setOpacity(opacity);
        }
    }
}

Avatar.prototype.setBossFlag = function(flag)
{
    this.BOSSFLAG = flag;
    if( this.BOSSFLAG ){
        if( this.attack != null ) this.attack.setVisible(false);
        if( this.health != null ) this.health.setVisible(false);
    }
}

Avatar.prototype.linkBossHp = function(bossHp)
{
    this.BOSSHP = bossHp;
}

Avatar.prototype.setDefaultAnimation = function(name)
{
    if( this.box != null )
    {
        this.box.setDefaultAnimation(name);
        for(var k in this.boxes)
        {
            var b = this.boxes[k];
            b.setDefaultAnimation(name);
        }
    }
}

Avatar.prototype.playAnimation = function(name, loop)
{
    if( this.box != null )
    {
        this.box.playAnimation(name, loop);
        for(var k in this.boxes)
        {
            var b = this.boxes[k];
            b.playAnimation(name, loop);
        }
    }
}

Avatar.prototype.stopAnimation = function()
{
    if( this.box != null )
    {
        this.box.stopAnimation();
        for(var k in this.boxes)
        {
            var b = this.boxes[k];
            b.stopAnimation();
        }
    }
}

Avatar.prototype.isAnimationDone = function()
{
    if( this.box != null )
    {
        return this.box.stop;
    }
    else
    {
        return true;
    }
}

Avatar.prototype.getAnimation = function()
{
    if( this.box != null )
    {
        return this.box.getAnimation();
    }
    else
    {
        return null;
    }
}

Avatar.prototype.getFlipX = function()
{
    return this.FLIPX;
}

Avatar.prototype.setFlipX = function(flag)
{
    if( this.BOSSFLAG ) return;//exception

    if( this.FLIPX != flag ){
        this.FLIPX = flag;
        if( this.box != null )
        {
            this.box.node.setScaleX( flag ? -this.SCALE : this.SCALE );
            this.box.node.setScaleY(this.SCALE);
        }
    }
}

Avatar.prototype.setScale = function(scale){
    this.SCALE = scale;
    this.setFlipX(this.FLIPX);//update flip scale
}

//--- ui component ---
function UIAvatar(args){
    this.role = null;
    this.avatar = null;
    if( args != null && args.scale != null )
    {
        this.scale = args.scale;
    }
    this.node = cc.Node.create();
}

UIAvatar.prototype.setRole = function(role, lazyLoad)
{
    //default arguments
    if( lazyLoad == null ) lazyLoad = false;

    this.role = role;
    if( this.avatar == null )
    {
        this.avatar = new Avatar(role, lazyLoad);
        this.node.addChild(this.avatar.node);
    }
    else
    {
        this.avatar.update(role);
    }
    this.avatar.playAnimation("stand", true);
    if( this.scale != null )
    {
        this.avatar.setScale(this.scale);
    }
}

UIAvatar.prototype.doLoad = function(){
    this.avatar.doLoad();
}

UIAvatar.prototype.getRole = function()
{
    return this.role;
}

UIAvatar.make = function(thiz, args)
{
    var ret = {};
    ret.id = new UIAvatar(args);
    ret.node = ret.id.node;
    return ret;
}

exports.Avatar = Avatar;
exports.UIAvatar = UIAvatar;