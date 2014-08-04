/**
 * User: hammer
 * Date: 13-7-16
 * Time: 下午5:59
 */

var action = loadModule("action.js");
var effects = loadModule("effect.js");
var table = loadModule("table.js");
var meta = [];

//static variables
var sWalkEffectId = -1;

function attachAction(actor, action, priority){
    if( actor == null ){
        warn("attachAction: actor not found.");
        return false;
    }
    if( actor.APRIO != null
        && actor.APRIO > priority ){
        debug("IGNORED ACTION PR = "+priority);
        return false;
    }
    else{
        actor.AGUID = action.AGUID;
        actor.APRIO = priority;
        return true;
    }
}

function detachAction(actor){
    delete actor.AGUID;
    delete actor.APRIO;
}

function isActionAlive(action, actor){
    return actor.AGUID == action.AGUID;
}

//tar, path
function makeMoveTo(pace, act)
{
    var ret = new action.Action(pace, true);
    ret.path = act.path;
    ret.target = act.target;

    ret.onStart = function(dungeon, layer)
    {
        this.pathIndex = 0;

        this.count = dungeon.HeroCount;
        this.ref = [];
        this.mark = [];
        this.flag = [];
        this.actor = [];

        //alert check
        this.alert = false;
        if( this.count == 3 && this.path.length == 2 )
        {
            if( this.path[1] == dungeon.getHero(1).pos )
            {
                this.alert = true;
            }
        }

        for(var i=0; i<this.count; ++i)
        {
            this.ref[i] = dungeon.getHero(i).ref;
            this.mark[i] = -1;//not marked
            this.flag[i] = true;//step completed
            this.actor[i] = layer.getActor(this.ref[i]);
            this.actor[i].playAnimation("walk", true);
        }

        if( sWalkEffectId == -1 )
        {
            sWalkEffectId = cc.AudioEngine.getInstance().playEffect("footstep.mp3", true);
        }
    }
    ret.onUpdate = function(delta, dungeon, layer)
    {
        var completed = true;
        for(var i=0; i<this.count; ++i)
        {
            if(!this.flag[i])
            {
                completed = false;
                break;
            }
        }
        if( completed )
        {
            this.pathIndex++;
            if( this.pathIndex >= this.path.length )
            {
                //stop sound
                if( sWalkEffectId != -1 )
                {
                    cc.AudioEngine.getInstance().stopEffect(sWalkEffectId);
                    sWalkEffectId = -1;
                }
                //change face
                var face = this.actor[0].getFlipX();
                var targetx = Math.floor(this.target%DG_LEVELWIDTH);
                var currentx = Math.floor(dungeon.Heroes[this.ref[0]-HERO_TAG].pos%DG_LEVELWIDTH);
                if( targetx < currentx )
                {
                    face = false;
                }
                else if(targetx > currentx )
                {
                    face = true;
                }
                for(var i=0; i<this.count; ++i)
                {
                    this.actor[i].setFlipX(face);
                }

                return false;
            }

            //set actor 0
            this.mark[0] = this.path[this.pathIndex];
            this.actor[0].playAnimation("walk", true);
            this.flag[0] =false;

            for(var i=1; i<this.count; ++i)
            {
                //mark pos
                this.mark[i] = dungeon.getHero(i-1).pos;
                this.actor[i].playAnimation("walk", true);
                this.flag[i] = false;

                //to special
                if( this.alert && i==2 )
                {
                    this.flag[i] = true;
                    this.mark[i] = dungeon.Heroes[this.ref[i]-HERO_TAG].pos;
                }
            }
        }
        else
        {
            for(var i=0; i<this.count; ++i)
            {
                var markpos = this.mark[i];

                //prevent shortcut
                if( !isNearGrid(dungeon.getHero(i).pos, markpos) )
                {
                    markpos = this.mark[i-1];
                }

                var target = calcPosInGrid(markpos);
                var dis = cc.pSub(target, this.actor[i].getPosition());
                var step = delta*RUN_SPEED;

                if( cc.pLengthSQ(dis) <= step*step )
                {
                    dungeon.getHero(i).pos = markpos;
                    if( markpos == this.mark[i] )
                    {
                        this.flag[i] = true;
                        this.actor[i].playAnimation("stand", true);
                    }
                }
                else
                {
                    dis = cc.pNormalize(dis);
                    var np = cc.pAdd(this.actor[i].getPosition(), cc.pMult(dis, step));
                    this.actor[i].setPosition(np);

                    //set flip
                    var flip = this.actor[i].getFlipX();
                    if( dis.x < 0 )
                    {//to left
                        flip = false;
                    }
                    else if( dis.x > 0 )
                    {//to right
                        flip = true;
                    }
                    if( flip != this.actor[i].getFlipX() )
                    {
                        this.actor[i].setFlipX(flip);
                    }
                }
            }
        }
        dungeon.updateTeamShiftPos();
        return true;
    }
    return ret;
}

//tar, path
function makeMoveOver(pace, act)
{
    var ret = new action.Action(pace, true);
    ret.path = act.path;

    ret.onStart = function(dungeon, layer)
    {
        this.pathIndex = 0;
        this.final = this.path[this.path.length-1];
        this.count = dungeon.HeroCount;
        this.mark = [];
        this.flag = [];
        this.actor = [];
        this.ref = [];
        for(var i=0; i<this.count; ++i)
        {
            this.mark[i] = -1;//not marked
            this.flag[i] = true;//step completed
            this.ref[i] = dungeon.getHero(i).ref;
            this.actor[i] = layer.getActor(this.ref[i]);

            this.actor[i].playAnimation("walk", true);
        }

        if( sWalkEffectId == -1 )
        {
            sWalkEffectId = cc.AudioEngine.getInstance().playEffect("footstep.mp3", true);
        }
    }
    ret.onUpdate = function(delta, dungeon, layer)
    {
        var completed = true;
        for(var i=0; i<this.count; ++i)
        {
            if(!this.flag[i])
            {
                completed = false;
                break;
            }
        }
        if( completed )
        {
            this.pathIndex++;
            if( this.pathIndex >= this.path.length )
            {
                var mainpos = dungeon.Heroes[this.ref[0]-HERO_TAG].pos;
                var finish = true;
                for(var i=1; i<this.count; ++i)
                {
                    if( dungeon.Heroes[this.ref[i]-HERO_TAG].pos != mainpos )
                    {
                        finish = false;
                        break;
                    }
                }
                if( finish )
                {
                    //stop sound
                    if( sWalkEffectId != -1 )
                    {
                        cc.AudioEngine.getInstance().stopEffect(sWalkEffectId);
                        sWalkEffectId = -1;
                    }
                    //change face
                    var face = this.actor[0].getFlipX();
                    var targetx = Math.floor(this.target%DG_LEVELWIDTH);
                    var currentx = Math.floor(dungeon.getHero(0).pos%DG_LEVELWIDTH);
                    if( targetx < currentx )
                    {
                        face = false;
                    }
                    else if(targetx > currentx )
                    {
                        face = true;
                    }
                    for(var i=0; i<this.count; ++i)
                    {
                        this.actor[i].setFlipX(face);
                    }

                    return false;
                }
            }
            else
            {
                //set actor 0
                this.mark[0] = this.path[this.pathIndex];
                this.actor[0].playAnimation("walk", true);
                this.flag[0] =false;
            }

            for(var i=1; i<this.count; ++i)
            {
                var newmark = dungeon.getHero(i-1).pos;
                //mark pos
                this.mark[i] = newmark;
                this.actor[i].playAnimation("walk", true);
                this.flag[i] = false;
            }
        }
        else
        {
            for(var i=0; i<this.count; ++i)
            {
                var markpos = this.mark[i];

                //prevent shortcut
                if( !isNearGrid(dungeon.getHero(i).pos, markpos) )
                {
                    markpos = this.mark[i-1];
                }

                var target = calcPosInGrid(markpos);
                var dis = cc.pSub(target, this.actor[i].getPosition());
                var step = delta*RUN_SPEED;

                if( cc.pLengthSQ(dis) <= step*step )
                {
                    dungeon.getHero(i).pos = markpos;
                    if( markpos == this.mark[i] )
                    {
                        this.flag[i] = true;
                        //this.actor[i].playAnimation("stand", true);

                        //fade out
                        if( markpos == this.final && !this.actor[i].isRunningFadeOut() )
                        {
                            this.actor[i].setFadeOut(1);
                        }
                    }
                }
                else
                {
                    dis = cc.pNormalize(dis);
                    var np = cc.pAdd(this.actor[i].getPosition(), cc.pMult(dis, step));
                    this.actor[i].setPosition(np);

                    //set flip
                    var flip = this.actor[i].getFlipX();
                    if( dis.x < 0 )
                    {//to left
                        flip = false;
                    }
                    else if( dis.x > 0 )
                    {//to right
                        flip = true;
                    }
                    if( flip != this.actor[i].getFlipX() )
                    {
                        this.actor[i].setFlipX(flip);
                    }
                }
            }
        }
        dungeon.updateTeamShiftPos();
        return true;
    }
    return ret;
}

//act, spl
function makeSpell(pace, act)
{
    var isKey = isHero(act.act);
    var ret = new action.Action(pace, isKey);
    ret.tar = act.act;
    ret.spl = act.spl;

    ret.onStart = function(dungeon, layer)
    {
        var actor = layer.getActor(this.tar);

        if( !attachAction(actor, this, 7) ){
            return;//cant attach action
        }

        var animation = "spell-" + this.spl;
        //debug("ON SPELL ANIMATION");//debug
        actor.playAnimation(animation);
    }
    ret.onUpdate = function(delta, dungeon, layer)
    {
        var actor = layer.getActor(this.tar);
        if( actor != null )
        {
            //terminate by other high priority action
            if( !isActionAlive(this, actor) ){
                return false;
            }

            if( actor.isAnimationDone() )
            {
                detachAction(actor);
                return false;
            }
            return true;
        }
        else
        {
            error("ActionSpell: Actor not found!");
            return false;
        }
    }
    return ret;
}

//sod
function makeSound(pace, act)
{
    var ret = new action.Action(pace);
    ret.sound = act.sod;

    ret.onStart = function(dungeon, layer)
    {
        cc.AudioEngine.getInstance().playEffect(this.sound);
    }
    return ret;
}

//mus, rep
function makeMusic(pace, act)
{
    var ret = new action.Action(pace);
    ret.music = act.mus;
    ret.repeat = act.rep;

    ret.onStart = function(dungeon, layer){
        var loop = true;
        if( this.repeat != null ){
            loop = this.repeat;
        }
        if( this.music != null ){
            debug("PLAY MUSIC ("+this.music+")");
            cc.AudioEngine.getInstance().playMusic(this.music, loop);
        }
        else{
            cc.AudioEngine.getInstance().stopMusic();
        }
    }

    return ret;
}

//act, ref, res(0=miss, 1=hit 2=critical 3=block 4=heal)
function makeAttack(pace, act)
{
    var isKey = isHero(act.act);
    var ret = new action.Action(pace, isKey);
    ret.act = act.act;
    ret.tar = act.ref;
    ret.res = act.res;

    ret.onStart = function(dungeon, layer)
    {
        var actor = layer.getActor(this.act);
        var target = layer.getActor(this.tar);
        if(actor == null || target == null )
        {
            error("ActionAttack: Actor not found on Start!");
            return;
        }

        if( !attachAction(actor, this, 8) ){
            return;
        }

        if( actor.getPosition().x > target.getPosition().x )
        {
            target.setFlipX(true);
            actor.setFlipX(false);
        }
        else if(actor.getPosition().x < target.getPosition().x )
        {
            target.setFlipX(false);
            actor.setFlipX(true);
        }
        //debug("ON ATTACK ANIMATION");//debug
        actor.playAnimation("attack");

        var mainWeapon = null;
        //play sound
        if( !isHero(this.act) )
        {
            var monster = table.queryTable(TABLE_ROLE, dungeon.Units[this.act-UNIT_TAG].uuid);
            if( monster.soundAttack != null )
            {
                cc.AudioEngine.getInstance().playEffect(monster.soundAttack);
            }
            this.hit = monster.effectAttack;//assign hit effect
            if( dungeon.Units[this.act-UNIT_TAG].role != null ){
                var role = loadModule("role.js");
                var monsterRole = new role.Role(dungeon.Units[this.act-UNIT_TAG].role);
                mainWeapon = monsterRole.queryArmor(EquipSlot_MainHand);
            }
        }
        else
        {
            var ro = engine.user.dungeon.party[this.act-HERO_TAG];
            var sound = null;
            mainWeapon = ro.queryArmor(EquipSlot_MainHand);
        }
        if( mainWeapon != null ){
            if( mainWeapon != null )
            {
                var itemClass = table.queryTable(TABLE_ITEM, mainWeapon.ClassId);
                if( itemClass != null )
                {
                    sound = itemClass.soundAttack;
                    this.hit = itemClass.effectAttack;//assign hit effect
                }
                else
                {
                    error("no such item ("+mainWeapon.ClassId+")");
                }
            }
            if( sound != null )
            {
                cc.AudioEngine.getInstance().playEffect(sound);
            }
        }

        this.timer = 0;
        this.effected = false;
    }
    ret.onUpdate = function(delta, dungeon, layer)
    {
        var actor = layer.getActor(this.act);
        var target = layer.getActor(this.tar);

        if( !isActionAlive(this, actor) ){
            return false;
        }

        if( target != null )
        {
            this.timer += delta;
            if( !this.effected && this.timer >= ACTION_DELAY )
            {
                this.effected = true;
                var pos = cc.pAdd(target.getPosition(), cc.p(0, 20));
                switch(this.res)
                {
                    case 0://miss
                        effects.attachEffectPopNum(layer.effects, pos, 0, effects.PopNum_Miss);
                        break;
                    case 1://hit
                    case 2://critical
                    {//play hit effect
                        if( this.hit != null )
                        {
                            effects.attachEffect(layer.effects, target.getPosition(), this.hit);
                        }
                    }
                        break;
                    case 3://blocked
                        effects.attachEffectPopNum(layer.effects, pos, 0, effects.PopNum_Block);
                        break;
                    default ://do nothing
                        break;
                }
            }
        }
        else
        {
            error("ActionAttack: Target not found.");
            return false;
        }
        if( actor != null )
        {
            if( actor.isAnimationDone() )
            {
                //debug("ON ATTACK ANIMATION2");//debug
                actor.playAnimation("stand", true);
                detachAction(actor);
                return false;
            }
        }
        else
        {
            error("ActionAttack: Actor not found.");
            return false;
        }
        return true;
    }
    return ret;
}

//act, dey
function makeHurt(pace, act)
{
    var ret = new action.Action(pace);
    ret.act = act.act;
    ret.delay = act.dey;

    ret.onStart = function(dungeon, layer)
    {
        var actor = layer.getActor(this.act);

        if( !attachAction(actor, this, 6) ){
            return;
        }

        this.timer = 0;
        this.played = false;
    }
    ret.onUpdate = function(delta, dungeon, layer)
    {
        var actor = layer.getActor(this.act);

        if( actor == null )
        {
            error("ActionHurt: Actor Not found.");
            return false;
        }

        if( !isActionAlive(this, actor) ){
            return false;
        }

        this.timer += delta;

        if( !this.played )
        {
            if( this.timer >= this.delay )
            {
                if( actor.getAnimation() != "wounded" )
                {
                    actor.playAnimation("wounded");
                }
                this.played = true;
                //play sound
                {
                    var unit = dungeon.queryUnit(this.act);
                    var monster = table.queryTable(TABLE_ROLE, unit.uuid);
                    if( monster.soundWound != null )
                    {
                        cc.AudioEngine.getInstance().playEffect(monster.soundWound);
                    }
                }
            }
        }
        else
        {
            if( actor.isAnimationDone() )
            {
                actor.playAnimation("stand", true);
                detachAction(actor);
                return false;
            }
        }
        return true;
    }
    return ret;
}

//
function makeDead(pace, act)
{
    var isKey = isHero(act.act);
    var ret = new action.Action(pace, isKey);
    ret.act = act.act;

    ret.onStart = function(dungeon, layer)
    {
        var unit = dungeon.queryUnit(this.act);
        if( isHero(this.act) )
        {//kill hero
            //if main hero dies, set skill cd to -1
            if( this.act == HERO_TAG ){
                layer.setCardCd(0, -1);
                dungeon.SkillCd = -1;
            }
            dungeon.HeroCount--;
        }
        else
        {//kill monster
            if( checkNull(unit, "ACT = "+this.act) ) return;
            var pos = unit.pos;

            dungeon.Blocks[pos].type = BLOCK_EMPITY;
            dungeon.Blocks[pos].ref = -1;
            dungeon.updateAccess();
            layer.syncAccess();
        }
        var actor = layer.getActor(this.act);
        var roleData = table.queryTable(TABLE_ROLE, unit.uuid);
        dungeon.removeUnit(this.act);

        if( roleData.soundDie != null ){
            cc.AudioEngine.getInstance().playEffect(roleData.soundDie);
        }
        var effDeath = 5;
        if( roleData.effectDeath != null ){
            effDeath = roleData.effectDeath;
        }
        if( effDeath >= 0 ){
            effects.attachEffect(layer.effects, actor.getPosition(), effDeath);
        }

        layer.removeActor(this.act);
    }
    return ret;
}

//act, dey
function makeEvade(pace, act)
{
    var isKey = isHero(act.act);
    var ret = new action.Action(pace, isKey);
    ret.delay = act.dey;
    ret.act = act.act;

    ret.onStart = function(dungeon, layer)
    {
        var actor =  layer.getActor(this.act);
        if( actor == null )
        {
            error("ActionEvade: Actor not found on start.");
            return;
        }
        if( !attachAction(actor, this, 5) ){
            return;
        }

        this.timer = -this.delay;
        this.origin = actor.box.node.getPosition();
        this.target = cc.p(this.origin.x, this.origin.y);
        if( actor.getFlipX() )
        {
            this.target.x -= LO_GRID/2;
        }
        else
        {
            this.target.x += LO_GRID/2;
        }
    }
    ret.onUpdate = function(delta, dungeon, layer)
    {
        var actor =  layer.getActor(this.act);
        if( actor != null )
        {
            if( !isActionAlive(this, actor) ){
                return false;
            }

            this.timer += delta;
            if( this.timer > 0 )
            {
                if( this.timer > 0.3)
                {
                    actor.box.node.setPosition(this.origin);
                    detachAction(actor);
                    return false;
                }
                if( this.timer > 0.15 )
                {
                    var alpha = (this.timer-0.15)/0.15;
                    var np = pLerp(this.origin, this.target, alpha);
                    actor.box.node.setPosition(np);
                }
            }
            return true;
        }
        else
        {
            error("ActionEvade: Actor not found.");
            return false;
        }
    }
    return ret;
}

//...
function makeShiftOrder(pace, act)
{
    var ret = new action.Action(pace, true);

    ret.onStart = function(dungeon, layer)
    {
        this.count = dungeon.HeroCount;
        if( this.count == 0 ){
            return;
        }

        this.refs = [];//assigned
        this.newpos = [];
        this.actor = [];//assigned
        this.midpos = [];
        //assign basic value
        for(var i=0; i<this.count; ++i)
        {
            this.refs[i] = dungeon.getHero(i);
            this.actor[i] = layer.getActor(this.refs[i].ref);
        }
        //init team shift pos
        if( dungeon.TeamShiftPos == null || dungeon.TeamShiftPos.length == 0 )
        {
            dungeon.updateTeamShiftPos();
        }
        //new algorithm
        var newOrder = [];
        for(var i=0; i<this.count; ++i)
        {
            if( this.refs[i].order == 0 ){
                newOrder[i] = this.count-1;
                this.newpos[i] = dungeon.TeamShiftPos[this.count-1];
            }
            else{
                var tar = 0;
                for(var m = this.refs[i].order -1; m>= 0; m--){
                    if( dungeon.getHeroByOrder(m) != null ){
                        tar = m;
                        break;
                    }
                }
                newOrder[i] = tar;
                this.newpos[i] = dungeon.TeamShiftPos[tar];
            }

            //midpos not changed
            var midindex = i+1;
            if( midindex >= this.count )
            {
                midindex -= this.count;
            }
            //midpos only used for heading hero
            this.midpos[i] = dungeon.TeamShiftPos[midindex];
            this.actor[i].playAnimation("walk", true);
        }
        //apply order
        for(var i=0; i<this.count; ++i){
            this.refs[i].order = newOrder[i];
        }
        //update team shift pos
        dungeon.TeamShiftPos = [];
        for(var i=0; i<this.count; ++i)
        {
            dungeon.TeamShiftPos[this.refs[i].order] = this.newpos[i];
        }

        if( sWalkEffectId == -1 )
        {
            sWalkEffectId = cc.AudioEngine.getInstance().playEffect("footstep.mp3", true);
        }
    }
    ret.onUpdate = function(delta, dungeon, layer)
    {
        if( this.count == 0 ){
            return false;
        }

        var completed = true;
        for(var i=0; i<this.count; ++i)
        {
            if( this.refs[i].pos != this.newpos[i] )
            {
                completed = false;
                break;
            }
            else
            {
                //debug("ON SHIFTORDER WALK ANIMATION2");//debug
                this.actor[i].playAnimation("stand", true);
            }
        }
        if( completed )
        {
            //stop sound
            if( sWalkEffectId != -1 )
            {
                cc.AudioEngine.getInstance().stopEffect(sWalkEffectId);
                sWalkEffectId = -1;
            }
            //set face
            var href = dungeon.getHero(0);
            var hact = layer.getActor(href.ref);
            var face = hact.getFlipX();
            layer.setTeamFace(face);

            //update z order
            for(var i=0; i<this.count; ++i)
            {
                var z = layer.baseZOrder(this.refs[i].pos);
                z += DG_PARTYCOUNT - this.refs[i].order;
                this.actor[i].setZOrder(z);
            }
            return false;
        }
        else
        {
            for(var i=0; i<this.count; ++i)
            {
                if( this.refs[i].pos != this.newpos[i] )
                {
                    var markpos = this.newpos[i];
                    if( !isNearGrid(this.refs[i].pos, markpos) )
                    {
                        markpos = this.midpos[i];
                    }

                    var target = calcPosInGrid(markpos);
                    var dis = cc.pSub(target, this.actor[i].getPosition());
                    var step = delta*RUN_SPEED;

                    if( cc.pLengthSQ(dis) <= step*step )
                    {
                        this.refs[i].pos = markpos;
                        if( markpos == this.newpos[i] )
                        {
                            //debug("ON SHIFTORDER ANIMATION 3");//debug
                            this.actor[i].playAnimation("stand", true);
                        }
                    }
                    else
                    {
                        dis = cc.pNormalize(dis);
                        var np = cc.pAdd(this.actor[i].getPosition(), cc.pMult(dis, step));
                        this.actor[i].setPosition(np);

                        //set flip
                        var flip = this.actor[i].getFlipX();
                        if( dis.x < 0 )
                        {//to left
                            flip = false;
                        }
                        else if( dis.x > 0 )
                        {//to right
                            flip = true;
                        }
                        if( flip != this.actor[i].getFlipX() )
                        {
                            this.actor[i].setFlipX(flip);
                        }
                    }
                }
            }
        }
        return true;
    }
    return ret;
}

//act, pos
function makeTeleport(pace, act)
{
    var ret = new action.Action(pace);
    ret.act = act.act;
    ret.pos = act.pos;

    ret.onStart = function(dungeon, layer)
    {
        var actor = layer.getActor(this.act);
        if( actor != null )
        {
            var unit = dungeon.queryUnit(this.act);
            dungeon.Blocks[this.pos].type = dungeon.Blocks[unit.pos].type;
            dungeon.Blocks[this.pos].ref = dungeon.Blocks[unit.pos].ref;
            dungeon.Blocks[unit.pos].type = BLOCK_EMPITY;
            dungeon.Blocks[unit.pos].ref = -1;
            unit.pos = this.pos;

            actor.setPositionGrid(this.pos);
            dungeon.updateAccess();
            layer.syncAccess();
        }
        else
        {
            error(" Action Teleport: NULL Actor");
        }
    }
    return ret;
}

//mod, tim, col
function makeFadeScene(pace, act)
{
    var ret = new action.Action(pace);
    ret.mode = act.mod;
    ret.time = act.tim;
    ret.color = act.col;

    ret.onStart = function(dungeon, layer)
    {
        debug("fadeScene("+JSON.stringify(this)+")");
        //设定颜色
        if( this.color == null ){
            layer.mask.setColor(cc.c3b(0, 0, 0));
        }
        else{
            layer.mask.setColor(cc.c3b(255, 255, 255));
        }
        layer.mask.stopAllActions();
        if( this.mode == 0 )
        {//FadeIn
            this.action = cc.FadeIn.create(this.time);
            layer.mask.runAction(this.action);
        }
        else
        {//FadeOut
            this.action = cc.FadeOut.create(this.time);
            layer.mask.runAction(this.action);
        }
    }
    return ret;
}

//tim
function makeDelay(pace, act)
{
    var ret = new action.Action(pace);
    ret.time = act.tim;
    ret.onStart = function(dungeon, layer){
        this.timer = 0;
    }
    ret.onUpdate = function(delta, dungeon, layer)
    {
        this.timer += delta;
        if( this.timer >= this.time ){
            return false;
        }
        return true;
    }
    return ret;
}

//dey, tim, rag
function makeShake(pace, act)
{
    var ret = new action.Action(pace);
    ret.delay = act.dey;
    ret.time = act.tim;
    ret.range = act.rag;
    ret.onStart = function(dungeon, layer){
        this.timer = 0;
        this.opos = layer.owner.nodeBlock.getPosition();
        if( this.range == null ){
            this.range = 10;
        }

        var scheduler = cc.Director.getInstance().getScheduler();
        var thiz = this;
        scheduler.scheduleCallbackForTarget(engine.ui.curScene, function(delta){
            thiz.timer += delta;
            if( thiz.timer < thiz.delay ){
                return;
            }
            if( thiz.timer >= thiz.time + thiz.delay ){
                layer.owner.nodeBlock.setPosition(thiz.opos);
                scheduler.unscheduleCallbackForTarget(engine.ui.curScene, arguments.callee);
                return;
            }
            var rx = -thiz.range + Math.random()*thiz.range*2;
            var ry = -thiz.range + Math.random()*thiz.range*2;
            var rpos = cc.pAdd(cc.p(rx, ry), thiz.opos);
            layer.owner.nodeBlock.setPosition(rpos);
        }, 0, cc.REPEAT_FOREVER, 0, false);
    }
    return ret;
}

//dey, tim, col
function makeBlink(pace, act)
{
    var ret = new action.Action(pace);
    ret.delay = act.dey;
    ret.time = act.tim;
    ret.color = act.col;

    ret.onStart = function(dungeon, layer)
    {
        //设定颜色
        if( this.color == null ){
            layer.mask.setColor(cc.c3b(255, 255, 255));
        }
        else{
            layer.mask.setColor(cc.c3b(0, 0, 0));
        }

        var fi = cc.FadeIn.create(0.04);
        var fo = cc.FadeOut.create(0.04);
        var ut = cc.Sequence.create(fi, fo);
        var count = Math.floor(this.time/0.08);
        var rp = cc.Repeat.create(ut, count);

        if( this.delay != null ){
            var dy = cc.DelayTime.create(this.delay);
            var final = cc.Sequence.create(dy, rp);
        }
        else{
            var final = rp;
        }

        layer.mask.stopAllActions();
        layer.mask.runAction(final);
    }
    return ret;
}

//tid
function makeTutorial(pace, act)
{
    var ret= new action.Action(pace, true);
    ret.tid = act.tid;
    ret.onStart = function(dungeon, layer)
    {
        loadModule("tutorialx.js").invokeTutorial(this.tid);
    }

    return ret;
}

//did
function makeDialogue(pace, act)
{
    var ret = new action.Action(pace, true);
    ret.dialogueId = act.did;
    ret.onStart = function(dungeon, layer){
        engine.dialogue.startDialogue(this.dialogueId);
    }
    ret.onUpdate = function(delta, dungeon, layer){
        return engine.dialogue.isPlaying();
    }
    return ret;
}

//act, dey, num, flg
function makePopHP(pace, act)
{
    var ret = new action.Action(pace);
    ret.act = act.act;
    ret.num = act.num;
    ret.flg = act.flg;//0=MISS 1=HIT 2=CRITICAL 3=BLOCK 4=HEAL
    ret.dey = act.dey;
    ret.onStart = function(dungeon, layer)
    {
        var actor = layer.getActor(this.act);
        if( actor == null )
        {
            error("ActionPopHP: Actor not found on Start.");
            return;
        }
        var thiz = this;
        var actDelay = cc.DelayTime.create(this.dey);
        var actCallFunc = cc.CallFunc.create(function(){
            var pos = cc.pAdd(actor.getPosition(), cc.p(0, 20));
            var unit = null;
            if( isHero(thiz.act) )
            {
                unit = dungeon.Heroes[thiz.act-HERO_TAG];
            }
            else
            {
                unit = dungeon.Units[thiz.act-UNIT_TAG];
            }
            switch(thiz.flg)
            {
                case 0:
                    effects.attachEffectPopNum(layer.effects, pos, 0, effects.PopNum_Miss);
                    break;
                case 1:
                    unit.health -= thiz.num;
                    actor.setHealth(unit.health);
                    effects.attachEffectPopNum(layer.effects, pos, thiz.num, effects.PopNum_Damage);
                    actor.flash(cc.c3b(255, 0, 0));//flash red
                    break;
                case 2:
                    unit.health -= thiz.num;
                    actor.setHealth(unit.health);
                    effects.attachEffectPopNum(layer.effects, pos, thiz.num, effects.PopNum_Critical);
                    actor.flash(cc.c3b(255, 0, 0));//flash red
                    break;
                case 3:
                    effects.attachEffectPopNum(layer.effects, pos, 0, effects.PopNum_Block);
                    break;
                case 4:
                    unit.health += thiz.num;
                    actor.setHealth(unit.health);
                    effects.attachEffectPopNum(layer.effects, pos, thiz.num, effects.PopNum_Heal);
                    actor.flash(cc.c3b(0, 255, 0));//flash green
                    break;
            }
        });
        var actSeq = cc.Sequence.create(actDelay, actCallFunc);
        actor.node.runAction(actSeq);
    }
    return ret;
}

//act, dey, str, flg
function makePopString(pace, act)
{
    var ret = new action.Action(pace);
    ret.onStart = function(dungeon, layer)
    {
        debug("[warning] no more popstring support now.");
    }
    return ret;
}

//sid, typ, cnt
function makeUpdateCard(pace, act)
{
    var ret = new action.Action(pace);
    ret.card = {};
    ret.card.ServerId = act.sid;
    ret.card.Type = act.typ;
    ret.card.Count = act.cnt;

    ret.onStart = function(dungeon, layer)
    {
        var index = dungeon.queryCardIndex(this.card.ServerId);
        if( index < 0 )
        {//not existed
            if( this.card.Count > 0 )
            {
                if( dungeon.Cards.length < DG_CARDCOUNT )
                {
                    dungeon.Cards.push(this.card);
                    //update view
                    layer.synCard(dungeon.Cards.length-1);
                }
                else
                {
                    error("Action:UpdateCard: Too many cards.");
                }
            }
        }
        else
        {//existing card
            if( this.card.Count > 0 )
            {
                dungeon.Cards[index] = this.card;
                //update view
                layer.setCardCount(index+1, this.card.Count);
            }
            else
            {
                dungeon.Cards.splice(index, 1);
                //update view
                layer.card.nodeList.removeChildByTag(index+1);
                for(var i=index+1; i<dungeon.Cards.length+1; ++i)
                {//move i+1 to i
                    var node = layer.card.nodeList.getChildByTag(i+1);
                    node.setTag(i);
                    var move = cc.MoveTo.create(0.2, cc.p(i*CARD_SPACE, 0));
                    node.runAction(move);
                }
            }
        }
    }
    return ret;
}

//dey, eff, act
function makeEffect(pace, act)
{
    var ret = new action.Action(pace);
    ret.delay = act.dey;
    ret.effect = act.eff;
    ret.target = act.act;
    ret.grid = act.pos;
    ret.serverId = act.sid;
    ret.isRemove = act.rmf;
    debug("** makeEffect = "+JSON.stringify(ret));//test
    ret.onStart = function(dungeon, layer)
    {
        var delay = 0;
        if( this.delay != null ) delay = this.delay;
        var thiz = this;
        var actDelay = cc.DelayTime.create(delay);
        var actExec = cc.CallFunc.create(function(){
            if( thiz.isRemove === true ){//remove flag
                if( thiz.serverId != null ){
                    layer.removeEffect(thiz.serverId);
                }
                else{
                    error("Action Effect: Remove without serverId.");
                    return;
                }
            }
            else{//add
                layer.addEffect({
                    effectId: thiz.effect,
                    target: thiz.target,
                    grid: thiz.grid,
                    serverId: thiz.serverId
                });
            }
        });
        var actSeq = cc.Sequence.create(actDelay, actExec);
        layer.runAction(actSeq);
    }
    return ret;
}

//dey, eff, src, tar
function makeMissileEffect(pace, act)
{
    var ret = new action.Action(pace);
    ret.delay = act.dey;
    ret.effect = act.effect;
    ret.source = act.src;
    ret.target = act.tar;

    ret.onStart = function(dungeon, layer){
        var srcActor = layer.getActor(this.source);
        var tarActor = layer.getActor(this.target);

        if( srcActor == null ){
            error("Action Missile Effect: Source actor not found.");
            return;
        }
        if( tarActor == null ){
            error("Action Missile Effect: Target actor not found.");
            return;
        }

        if( this.delay > 0 )
        {
            var zffect = this.effect;
            var act1 = cc.DelayTime.create(this.delay);
            var act2 = cc.CallFunc.create(function()
            {
                effects.attachMissileEffect(layer.effects, zffect, srcActor.getPosition(), tarActor.getPosition());

            }, actor.getNode());
            var seq = cc.Sequence.create(act1, act2);
            actor.getNode().runAction(seq);
        }
        else
        {
            effects.attachMissileEffect(layer.effects, this.effect, srcActor.getPosition(), tarActor.getPosition());
        }
    }
    return ret;
}

function makeSkillCd(pace, act)
{
    var ret = new action.Action(pace);
    ret.cd = act.cd;

    ret.onStart = function(dungeon, layer)
    {
        dungeon.SkillCd = this.cd;
        layer.setCardCd(0, this.cd);
    }
    return ret;
}

function makeDungeonEvent(pace, act)
{
    var ret = new action.Action(pace, true);
    ret.type = act.typ;
    ret.pos = act.pos;

    ret.onStart = function(dungeon, layer)
    {
        dungeon.KeyFound = true;
        if( dungeon.ExitPos >= 0 )
        {
            layer.door.animationManager.runAnimationsForSequenceNamed("open-locked");
        }
        dungeon.Blocks[dungeon.ExitPos].type = BLOCK_EXIT;
    }
    return ret;
}

//pos, pas, typ 更新角色
function makeDungeonBlock(pace, act)
{
    var ret = new action.Action(pace);
    ret.pos = act.pos;
    ret.pas = act.pas;
    ret.typ = act.typ;
    ret.trs = act.trs;

    ret.onStart = function(dungeon, layer)
    {
        dungeon.Blocks[this.pos].type = this.typ;
        var pass = [];
        for(var i = 0; i<4; ++i)
        {
            var ch = this.pas.charAt(i);
            if( ch == "0" )
            {
                pass[i] = false;
            }
            else
            {
                pass[i] = true;
            }
        }
        dungeon.Blocks[this.pos].pass = pass;
        dungeon.Blocks[this.pos].explored = true;
        if( this.trs != null ){
            dungeon.Blocks[this.pos].trans = this.trs;
        }
        else{
            dungeon.Blocks[this.pos].trans = null;
        }

        var showEffect = false;
        var box = layer.blocks.getChildByTag(this.pos);
        if( box != null && box.isVisible() ){
            showEffect = true;
        }
        layer.updateBlock(this.pos);

        //mark the exitpos
        if( this.typ == BLOCK_EXIT
            || this.typ == BLOCK_LOCKEDEXIT )
        {
            dungeon.ExitPos = this.pos;
        }

        //optimize update access
        //dungeon.updateAccess();
        //layer.syncAccess();
        dungeon.UpdateAccessFlag = true;

        if( showEffect ){
            effects.attachEffect(layer.effects, calcPosInGrid(this.pos), 6);
            //play sound (anyway now)
            //if( layer.requestExplore )
            {
                var file = "tansuo"+Math.ceil(Math.random()*3)+".mp3";
                cc.AudioEngine.getInstance().playEffect(file);

                layer.requestExplore = false;
            }
        }
    }

    return ret;
}

//pos, id, hp, dc, typ, eff 创建角色
function makeDungeonEnemy(pace, act)
{
    var ret = new action.Action(pace);
    ret.arg = act;

    ret.onStart = function(dungeon, layer)
    {
        var unit = {};
        //assign new unit
        unit.health = this.arg.hp;
        unit.attack = this.arg.dc;
        unit.ref = this.arg.ref;
        unit.uuid = this.arg.rid;
        unit.type = this.arg.typ;
        unit.pos = this.arg.pos;
        unit.keyed = this.arg.keyed;

        //status color
        unit.hs = 0;
        unit.ds = 0;
        unit.rs = 0;

        if( unit.type == 0 ){
            /*** players ***/
            if( dungeon.Heroes[unit.ref] == null ){
                dungeon.Heroes[unit.ref - HERO_TAG] = unit;
                var actor = layer.addActor(unit);
                actor.setDefaultAnimation("stand");
                dungeon.HeroCount++;

                dungeon.updateTeamShiftPos();

                //update access
                dungeon.updateAccess();
                layer.syncAccess();
            }
            else{
                error("Action.makeDungeonEnemy: Hero existed.");
            }
        }
        else{
            /*** monsters and npcs ***/
            //link to grid
            dungeon.Blocks[unit.pos].ref = unit.ref;
            dungeon.Units[unit.ref - UNIT_TAG] = unit;

            //play spwan sound
            var monster = table.queryTable(TABLE_ROLE, unit.uuid);
            var boss = false;
            if( monster.bossFlag )
            {
                boss = true;
            }

            //应用额外的角色数据
            if( this.arg.role != null ){
                unit.role = this.arg.role;
            }
            //add to scene
            var actor = layer.addActor(unit, boss);

            if (unit.keyed != null) {
                effects.attachEffect(layer.effects, actor.getPosition(), 28);
            }

            if( monster.soundSpawn != null )
            {
                cc.AudioEngine.getInstance().playEffect(monster.soundSpawn);
            }
            if( monster.animSpawn != null ){
                actor.playAnimation(monster.animSpawn);
            }
            actor.setDefaultAnimation("stand");

            if( !boss ){
                //set face
                var facex = Math.floor(unit.pos%DG_LEVELWIDTH);
                if( facex < DG_LEVELWIDTH/2 )
                {
                    actor.setFlipX(true);
                }
            }
            else{
                actor.setBossFlag(true);
                actor.linkBossHp(layer.showBossHp(unit.health));
            }
        }
        //add effect
        if( this.arg.eff != null && this.arg.eff >= 0 ){
            effects.attachEffect(layer.effects, actor.getPosition(), this.arg.eff);
        }
    }
    return ret;
}

//ref, hp, dc
function makeUnitUpdate(pace, act)
{
    var ret = new action.Action(pace);
    ret.ref = act.ref;
    ret.hp = act.hp;
    ret.dc = act.dc;
    ret.od = act.od;
    ret.hs = act.hs;
    ret.ds = act.ds;
    ret.rs = act.rs;

    ret.onStart = function(dungeon, layer)
    {
        var unit = dungeon.queryUnit(this.ref);
        if( unit != null )
        {
            var actor = layer.getActor(this.ref);
            if( this.hs != null )
            {
                unit.hs = this.hs;
            }
            if( this.ds != null )
            {
                unit.ds = this.ds;
            }
            if( this.hp != null )
            {
                unit.health = this.hp;
                actor.setHealth(unit.health, unit.hs);
            }
            if( this.dc != null )
            {
                unit.attack = this.dc;
                actor.setAttack(unit.attack, unit.ds);
            }
            if( this.rs != null )
            {
                unit.rs = this.rs;
                switch(unit.rs){
                    case 0:{
                        actor.resetBlinkColor();
                        if( isHero(unit.ref) )
                        {
                            var role = engine.user.dungeon.party[unit.ref-HERO_TAG];
                            var haircolor = queryColor(role.HairColor);
                            actor.setHairColor(haircolor);
                        }
                    }break;
                    case 1:{
                        actor.setBlinkColor(COLOR_DEBUFF);
                    }break;
                    case 2:{
                        actor.setBlinkColor(COLOR_BUFF);
                    }break;
                    case 3:{
                        actor.setBlinkColor(COLOR_BUFF, COLOR_DEBUFF);
                    }break;
                }
            }
            //update character order
            if( this.od != null )
            {
                unit.order = this.od;
                //update z order
                var z = layer.baseZOrder(unit.pos);
                z += DG_PARTYCOUNT - unit.order;
                actor.setZOrder(z);
                //update team shift
                dungeon.TeamShiftPos[unit.order] = unit.pos;
            }
        }
    }
    return ret;
}

function makeDungeonResult(pace, act){
    var ret = new action.Action(pace, true);
    ret.win = act.win;

    ret.onStart = function(dungeon, layer){
        layer.doDungeonResult(this.win);
    }
    return ret;
}

function makeEnterLevel(pace, act){
    var ret = new action.Action(pace, true);
    ret.pos = act.pos;
    ret.pos1 = act.pos1;
    ret.pos2 = act.pos2;
    ret.lvl = act.lvl;

    ret.onStart = function(dungeon, layer){
        debug("EnterLevel = \n"+JSON.stringify(this));
        //clear
        dungeon.resetBlocks();
        dungeon.Units = [];
        layer.removeAllActors();
        layer.resetBlocks();
        if( dungeon.Level == 8 )
        {
            cc.AudioEngine.getInstance().playMusic("boss.mp3", true);
        }
        dungeon.KeyFound = false;
        dungeon.ExitPos = -1;

        //override stage
        if(this.lvl != null )
        {
            engine.user.dungeon.level = this.lvl;
            dungeon.Level = this.lvl;
        }
        layer.setLevel(dungeon.Level+1);

        //set heroes
        dungeon.HeroCount = 0;
        for(var k in dungeon.Heroes)
        {
            var unit = dungeon.Heroes[k];

            var pk = "pos";
            if(Number(k)>0)
            {
                pk+=k;
            }
            if( this[pk] != null )
            {//if contains the coordinates
                unit.pos = this[pk];

                var actor = layer.addActor(unit);
                dungeon.HeroCount++;
            }
            else
            {
                //remove hero from list
                delete dungeon.Heroes[k];
            }
        }
        //disable skill if main hero is dead
        if( dungeon.Heroes[0] == null ){
            layer.setCardCd(0, -1);
        }
        dungeon.updateTeamShiftPos();

        layer.waitResponse = false;
        layer.updateMode();

        layer.mask.runAction(cc.FadeOut.create(2));

        // BUG SNIPER: evade card pop bug
        layer.card.select = -1;
        layer.card.hover = false;
        layer.card.timer = 0;
        layer.updateCardDesc();
        layer.fadeCardPop();
        //-------------------------
        //dump battle state on every level
        engine.user.setData("ddump", engine.box.save());
        engine.user.saveProfile();
        //--- restore effects ---
        var retach = [];
        for(var k in layer.EffectList){
            var param = layer.EffectList[k];
            if( param.target != null ){
                retach.push(param);
            }
        }
        layer.EffectList = {};//clear
        for(var k in retach){
            var param = retach[k];
            layer.addEffect(param);
        }
    }
    return ret;
}

function makeAllDead(pace, act)
{
    var ret= new action.Action(pace, true);
    ret.count = act.cnt;
    ret.onStart = function(dungeon, layer)
    {
        layer.showRevive(this.count);
    }

    return ret;
}

//event
function makeEventAction(pace, act)
{
    var ret = new action.Action(pace, true);
    ret.event = act.event;

    ret.onStart = function(dungeon, layer)
    {
        debug("* Event Action = "+JSON.stringify(this.event));
        engine.event.processNotification(this.event.NTF, this.event.arg, true);
    }
    return ret;
}

//                          / priority
meta[0] = makeMoveTo;
meta[1] = makeAttack;       //8
meta[2] = makeHurt;         //6
meta[3] = makeDead;
meta[4] = makeMoveOver;
meta[5] = makeSpell;        //7
meta[6] = makeEvade;        //5
meta[7] = makeShiftOrder;
meta[8] = makeTeleport;
meta[9] = makeFadeScene;
meta[10] = makeDelay;
meta[11] = makeDialogue;

meta[101] = makePopHP;
meta[102] = makePopString;
meta[103] = makeUpdateCard;
meta[104] = makeEffect;
meta[105] = makeSkillCd;
meta[106] = makeDungeonEvent;
meta[107] = makeMissileEffect;
meta[108] = makeSound;
meta[109] = makeMusic;
meta[110] = makeShake;
meta[111] = makeBlink;
meta[112] = makeTutorial;

meta[201] = makeDungeonBlock;
meta[202] = makeDungeonEnemy;
meta[203] = makeUnitUpdate;
meta[204] = makeDungeonResult;
meta[205] = makeEnterLevel;
meta[206] = makeAllDead;

meta[300] = makeEventAction;

function make(pace, id, arg)
{
    if( meta[id] != null )
    {
        var ret = meta[id](pace, arg);
//        ret.ID = id;
//        ret.NAME = meta[id].name;
        return ret;
    }
    else
    {
        error(" No such action ("+id+")");
        traceStack();
    }
}
exports.make = make;
