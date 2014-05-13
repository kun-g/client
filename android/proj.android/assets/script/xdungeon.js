/**
 * User: hammer
 * Date: 13-7-15
 * Time: 下午2:29
 */

function Dungeon(source)
{
    this.Level = 0;
    this.Blocks = [];
    this.Cards = [];
    this.Units = [];
    this.Heroes = [];
    this.HeroCount = 0;
    this.SkillCd = 0;
    this.KeyFound = false;
    this.ExitPos = -1;
    this.TeamShiftPos = [];
    this.TutorialFlag = false;
    this.UpdateAccessFlag = false;

    if( source != null )
    {
        this.parse(source);
    }
}

//NOTE : call this function whenever the team member changes their pos
Dungeon.prototype.updateTeamShiftPos = function()
{
    this.TeamShiftPos = [];
    for(var i=0; i<this.HeroCount; ++i)
    {
        var unit = this.getHero(i);
        this.TeamShiftPos.push(unit.pos);
    }
}

Dungeon.prototype.parse = function(source)
{
    for(var k in source)
    {
        this.k = source[k];
    }
}

Dungeon.prototype.resetBlocks = function()
{
    for(var i=0; i<DG_BLOCKCOUNT; ++i)
    {
        this.Blocks[i] = {};
        this.Blocks[i].explored = false;
        this.Blocks[i].type = BLOCK_EMPITY;
        this.Blocks[i].pass = [];
        for(var j=0; j<4; ++j)
        {
            this.Blocks[i].pass[j] = false;
        }
        this.Blocks[i].ref = -1;
        this.Blocks[i].access = false;
    }
}

//此函数会对玩家的order进行重排
Dungeon.prototype.getHero = function(order)
{
    var toSort = [];
    for(var k in this.Heroes)
    {
        toSort.push(this.Heroes[k]);
    }
    toSort.sort(function(a, b)
    {
        return a.order - b.order;
    });
    return toSort[order];
}

//此函数不会对玩家的order进行重排
Dungeon.prototype.getHeroByOrder = function(order){
    for(var k in this.Heroes){
        if( this.Heroes[k].order == order ){
            return this.Heroes[k];
        }
    }
    return null;
}

Dungeon.prototype.queryUnit = function(ref)
{
    if( ref >= UNIT_TAG )
    {
        return this.Units[ref-UNIT_TAG];
    }
    else
    {
        return this.Heroes[ref-HERO_TAG];
    }
}

Dungeon.prototype.removeUnit = function(ref)
{
    if( ref >= UNIT_TAG ){
        delete this.Units[ref - UNIT_TAG];
    }
    else{
        delete this.Heroes[ref - HERO_TAG];
    }
}

Dungeon.prototype.queryCardIndex = function(sid)
{
    for(var k in this.Cards)
    {
        var card = this.Cards[k];
        if( card.ServerId == sid )
        {
            return Number(k);
        }
    }
    return -1;
}

/*** ROUTE FUNCTION ***/

Dungeon.prototype.updateAccess = function()
{
    //close all access
    for(var i=0; i<DG_BLOCKCOUNT; ++i)
    {
        this.Blocks[i].access = false;
    }
    list = [];
    close = [];

    //setup initial
    var hero = this.getHero(0);
    if( hero == null )
    {
        return;
    }

    var start = hero.pos;
    list.push(start);
    this.Blocks[start].access = true;

    while ( list.length != 0 )
    {
        var pos = list[0];
        list.splice(0, 1);
        close.push(pos);

        var x = Math.floor(pos%DG_LEVELWIDTH);
        var y = Math.floor(pos/DG_LEVELWIDTH);
        for(var j=0; j<4; ++j)
        {
            if( this.Blocks[pos].pass[j] )
            {
                var nx = x;
                var ny = y;
                switch (j) {
                    case 0:
                    {
                        ny--;
                    }
                        break;
                    case 1:
                    {
                        nx++;
                    }
                        break;
                    case 2:
                    {
                        ny++;
                    }
                        break;
                    case 3:
                    {
                        nx--;
                    }
                        break;
                }
                if( nx < 0 || nx > 4 || ny < 0 || ny > 5 ){
                    continue;
                }
                var n = nx + ny*DG_LEVELWIDTH;
                this.Blocks[n].access = true;

                //check if in closed
                var closed = false;
                for(var k in close)
                {
                    var tp = close[k];
                    if(tp == n)
                    {
                        closed = true;
                        break;
                    }
                }

                var blocked = false;
                if( this.Blocks[n].type == BLOCK_ENEMY
                    || this.Blocks[n].type == BLOCK_NPC ){
                    blocked = true;
                }
                if( this.Blocks[n].explored &&
                    !blocked &&
                    !closed )
                {
                    list.push(n);
                }
            }
        }
    }
}

function _route_calcH(from, to)
{
    var fx = Math.floor(from%DG_LEVELWIDTH);
    var fy = Math.floor(from/DG_LEVELWIDTH);
    var tx = Math.floor(to%DG_LEVELWIDTH);
    var ty = Math.floor(to/DG_LEVELWIDTH);
    return (tx-fx)*(tx-fx)+(ty-fy)*(ty-fy);
}

function _route_findMinCost(src)
{
    var cost = -1;
    var ret = null;

    for(var k in src)
    {
        var node = src[k];
        if( cost < 0 || node.f < cost )
        {
            cost = node.f;
            ret = node;
        }
    }
    return node;
}

function _route_removeNode(src, node)
{
    var index = src.indexOf(node);
    if( index>=0 )
    {
        src.splice(index, 1);
    }
}

function _route_findNode(src, pos)
{
    for(var k in src)
    {
        var node = src[k];
        if( node.pos == pos )
        {
            return node;
        }
    }
    return null;
}

Dungeon.prototype.route = function(from, to)
{//using A*
    //some setup
    var open = [];
    var close = [];

    //insert the start point
    var start = {};
    start.pos = from;
    start.g = 0;
    start.h = _route_calcH(from, to);
    start.f = start.g + start.h;
    start.parent = null;
    open.push(start);

    var ret = null;

    var width = DG_LEVELWIDTH;
    var height = DG_LEVELHEIGHT;
    var found = false;

    //begin the main process
    while ( open.length != 0 && !found ) {
        var node = _route_findMinCost(open);
        _route_removeNode(open, node);
        close.push(node);

        for(var i=0; i<4; ++i)
        {
            var nx = Math.floor(node.pos%DG_LEVELWIDTH);
            var ny = Math.floor(node.pos/DG_LEVELWIDTH);
            var pass = this.Blocks[node.pos].pass[i];
            switch (i) {
                case 0:
                    ny -= 1;
                    break;
                case 1:
                    nx += 1;
                    break;
                case 2:
                    ny += 1;
                    break;
                case 3:
                    nx -= 1;
                    break;
            }
            if( nx >= 0 && ny >= 0 && nx < width && ny < height && pass )
            {
                var near = nx + ny*width;

                if( near == to )
                {//find the result
                    ret = [];
                    var temp = node;
                    while(temp != null)
                    {
                        ret.push(temp.pos);
                        temp = temp.parent;
                    }
                    ret = ret.reverse();
                    found = true;
                    break;
                }

                if( this.Blocks[near].explored && this.Blocks[near].ref<0 )
                {
                    if( _route_findNode(close, near) != null )
                    {
                        continue;
                    }

                    var nearNode = _route_findNode(open, near);
                    if( nearNode == null )
                    {
                        nearNode = {};
                        nearNode.pos = near;
                        nearNode.g = node.g + 1;
                        nearNode.h = _route_calcH(near, to);
                        nearNode.f = nearNode.g + nearNode.h;
                        nearNode.parent = node;
                        open.push(nearNode);
                    }
                    else
                    {
                        var ng = node.g + 1;
                        if( ng < nearNode.g )
                        {
                            nearNode.parent = node;
                            nearNode.g = ng;
                            nearNode.f = nearNode.g + nearNode.h;
                        }
                    }
                }
            }
        }
    }

    return ret;
}

Dungeon.prototype.route2 = function(from, to)
{
    //some setup
    var open = [];
    var close = [];

    //insert the start point
    var start = {};
    start.pos = from;
    start.g = 0;
    start.h = _route_calcH(from, to);
    start.f = start.g + start.h;
    start.parent = null;
    open.push(start);

    var ret = null;

    //begin the main process
    while ( open.length != 0 )
    {
        var node = _route_findMinCost(open);

        if( node.pos == to )
        {//find the result
            ret = [];
            var temp = node;
            while(temp != null)
            {
                ret.push(temp.pos);
                temp = temp.parent;
            }
            ret = ret.reverse();
            break;
        }

        _route_removeNode(open, node);
        close.push(node);

        for(var i=0; i<4; ++i)
        {
            var nx = Math.floor(node.pos%DG_LEVELWIDTH);
            var ny = Math.floor(node.pos/DG_LEVELWIDTH);
            var pass = this.Blocks[node.pos].pass[i];
            switch (i) {
                case 0:
                    ny -= 1;
                    break;
                case 1:
                    nx += 1;
                    break;
                case 2:
                    ny += 1;
                    break;
                case 3:
                    nx -= 1;
                    break;
            }
            if( nx >= 0 && ny >= 0 && nx < DG_LEVELWIDTH && ny < DG_LEVELHEIGHT && pass )
            {
                var near = nx + ny*DG_LEVELWIDTH;
                if( this.Blocks[near].explored && this.Blocks[near].ref<0 )
                {
                    if( _route_findNode(close, near) != null )
                    {
                        continue;
                    }

                    var xnear = _route_findNode(open, near);
                    if(  xnear == null )
                    {
                        xnear = {};
                        xnear.pos = near;
                        xnear.g = node.g + 1;
                        xnear.h = _route_calcH(near, to);
                        xnear.f = xnear.g + xnear.h;
                        xnear.parent = node;
                        open.push(xnear);
                    }
                    else{
                        var ng = node.g + 1;
                        if( ng < xnear.g )
                        {
                            xnear.parent = node;
                            xnear.g = ng;
                            xnear.f = xnear.g + xnear.h;
                        }
                    }
                }
            }
        }
    }

    return ret;
}

exports.Dungeon = Dungeon;