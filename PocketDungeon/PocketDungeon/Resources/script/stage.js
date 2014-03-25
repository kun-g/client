/**
 * User: hammer
 * Date: 13-8-21
 * Time: 下午5:52
 */

var libTable = loadModule("table.js");

function Stage(source)
{
    this.Chapters = {};
    this.UnlockedChapters = [];

    if( source != null )
    {
        this.parse(source);
    }
}

Stage.prototype.parse = function(source)
{
    for(var k in source)
    {
        this[k] = source[k];
    }
}

Stage.prototype.update = function(event, notify)
{
    for(var k in event.arg.stg)
    {
        var stage =  event.arg.stg[k];

        var chp = stage.chp;
        var stg = stage.stg;
        var sta = stage.sta;
        var lvl = 0;
        if( stage.lvl != null ){
            lvl = stage.lvl;
        }

        if( this.Chapters[chp] == null )
        {
            //push new unlocked chapters for animation
            this.UnlockedChapters.push(chp);
            //create chapter
            this.Chapters[chp] = {};
            this.Chapters[chp].Stages = {};
        }
        if( notify )
        {
            var ev = {};
            ev.eid = Message_UpdateStage;
            ev.arg = {};
            ev.arg.chapter = chp;
            ev.arg.stage = stg;
            ev.arg.state = sta;
            engine.event.processNotification(ev);
        }
        var index = -1;
        var chClass = libTable.queryTable(TABLE_STAGE, stage.chp);
        for(var j in chClass.stage)
        {
            if( chClass.stage[j].stageId == stg )
            {
                index = Number(j);
                break;
            }
        }
        this.Chapters[chp].Stages[index] = {
            State: sta,
            Level: lvl
        };
    }
}

Stage.prototype.getChapterIdFromGrid = function(grid)
{
    for(var k in this.Chapters)
    {
        var ret = Number(k);
        var ChapterClass = libTable.queryTable(TABLE_STAGE, ret);
        if( ChapterClass.posX == grid.x
            && ChapterClass.posY == grid.y )
        {
            return ret;
        }
    }
    return -1;//not found
}

exports.Stage = Stage;