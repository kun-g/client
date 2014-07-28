/**
 * User: hammer
 * Date: 13-7-16
 * Time: 下午4:01
 */

var AGUID = 0;

function Action(pace, isKey)
{
    if( isKey == null ){
        isKey = false;
    }
    if( pace != null )
    {
        this.pace = pace;
    }
    else
    {
        this.pace = 0;
    }
    this.AGUID = AGUID++;
    this.KACT = isKey;
}

Action.prototype.onStart = function(dungeon, layer)
{
    //to override
}

Action.prototype.onUpdate = function(delta, dungeon, layer)
{
    //to override
    return false;
}

//action manager
function Actions()
{
    this.pending = [];
    this.running = [];
    this.keyList = [];
    this.working = false;
    this.pace = 0;
    this.batchIndex = 0;
}

Actions.prototype.setEnvironment = function(dungeon, layer)
{
    this.dungeon = dungeon;
    this.layer = layer;
}

Actions.prototype.batch = function()
{
    var found = false;
    this.batchIndex = 0;
    for(var r in this.running)
    {
        var act = this.running[r];
        if( act.pace > this.batchIndex )
        {
            this.batchIndex = act.pace;
        }
        found = true;
    }
    for(var p in this.pending)
    {
        var act = this.pending[p];
        if( act.pace > this.batchIndex )
        {
            this.batchIndex = act.pace;
        }
        found = true;
    }
    if( found )
    {
        this.batchIndex++;
    }
}

Actions.prototype.pushAction = function(action)
{
    if( Array.isArray(action) ){
        for( var k in action ){
            this.pushAction(action[k]);
        }
    }else{
        action.pace += this.batchIndex;
        if( action.KACT ){
            this.keyList.push(action.AGUID);
        }
        //debug("push -> "+JSON.stringify(action));
        if( action.pace <= this.pace )
        {
            //debug("start -> "+JSON.stringify(action));
            action.onStart(this.dungeon, this.layer);
            this.running.push(action);
        }
        else
        {
            this.pending.push(action);
        }
        this.working = true;
    }
}

Action.prototype.startAction = function(action)
{
    //debug("start -> "+JSON.stringify(action));
    action.onStart(this.dungeon, this.layer);
    this.running.push(action);
    this.working = true;
}

Actions.prototype.isAllKeyActionsDone = function()
{
    return !this.working;
    //return (this.keyList.length == 0);//暂时关闭关键节拍控制
}

Actions.prototype.updateActions = function(delta)
{
    //run every action
    {
        var thiz = this;
        this.running = this.running.filter(function (action)
        {
            var ret = action.onUpdate(delta, thiz.dungeon, thiz.layer);
//            if( ret == false ){
//                debug("end -> ID="+JSON.stringify(action.ID)+" ACT="+action.act+" NAME="+action.NAME);
//            }
            if( ret == false && action.KACT ){
                thiz.keyList.splice(thiz.keyList.indexOf(action.AGUID), 1);
            }
            return ret;
        });
    }

    //pace forward
    while( this.running.length == 0 && this.pending.length != 0 )
    {
        this.pace++;
        var thiz = this;

        //临时替换pending，防止在onStart时插入新的action丢失
        var list = this.pending;
        this.pending = [];
        list = list.filter(function(action)
        {
            if( action.pace <= thiz.pace )
            {
                thiz.running.push(action);
                //debug("start -> "+JSON.stringify(action));
                action.onStart(thiz.dungeon, thiz.layer);
                return false;
            }
            return true;
        });
        this.pending = list.concat(this.pending);
    }

    if( this.running.length == 0 && this.working )
    {
        this.pace = 0;
        this.working = false;
        this.batchIndex = 0;
    }
}

exports.Action = Action;
exports.Actions = Actions;