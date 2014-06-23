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

Stage.prototype.queryStageInfo = function(stageId)
{
    var ret = {};
    var tables = libTable.readTable(TABLE_STAGE);
    var found = false;
    for(var k in tables){
        if( found ) break;
        var chap = tables[k];
        if( chap.stage != null ){
            for(var m in chap.stage){
                var stage = chap.stage[m];
                if( stage.stageId == stageId ){
                    found = true;
                    ret.chapterClass = chap;
                    ret.stageClass = stage;
                }
            }
        }
    }
    if( found ){
        if( this.Chapters[ret.chapterClass.chapterId] != null ){
            var stageData = this.Chapters[ret.chapterClass.chapterId][ret.stageClass.stageId];
            if( stageData != null ){
                ret.stageData = stageData;
            }
        }
        //update team size
        if( ret.stageClass.isInfinite === true ){
            var team = 3;
            var level = 0;
            if( ret.stageData != null ){
                level =ret.stageData.Level;
            }
            if( Math.floor(level%10 == 0 )){
                team = 1;
            }
            else if( Math.floor(level%5) == 0 ){
                team = 2;
            }
            ret.teamSize = team;
        }
        else{
            if( ret.stageClass.team != null ){
                ret.teamSize = ret.stageClass.team;
            }
        }
        return ret;
    }
    else{
        return null;
    }
}

exports.Stage = Stage;