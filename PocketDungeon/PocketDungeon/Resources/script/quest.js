/**
 * User: hammer
 * Date: 13-11-20
 * Time: 下午6:21
 */

var libTable = loadModule("table.js");

var QuestScheme = {
    qid: "QuestId",
    sta: "Status",
    cnt: "Count"
}

function Quest(source){
    this.QuestId = -1;
    this.Status = QUESTSTATUS_ONGOING;
    this.Count = [];
    this.Poped = false;

    if( source != null ){
        this.parse(source);
    }
}

Quest.prototype.parse = function(source){
    loadModule("util.js").applyScheme(this, QuestScheme, source);
    this.fixState();
}

Quest.prototype.fixState = function(){
    //debug("* QUEST fixState == "+JSON.stringify(this));
    var completed = true;
    var QuestData = libTable.queryTable(TABLE_QUEST, this.QuestId);
    for(var k in QuestData.objects){
        var obj = QuestData.objects[k];
        if( this.Count[k] == null ){
            this.Count[k] = 0;
        }
        var count = this.Count[k];
        //debug("* OBJ ["+k+"] BEFORE "+count+"/"+obj.count);
        switch(obj.type){
            case 0:{//collect npc
                if( count < obj.count ){
                    completed = false;
                }
            }
                break;
            case 1:{//collect item
                this.Count[k] = engine.user.inventory.countItem(obj.collect);
                if( this.Count[k] < obj.count ){
                    completed = false;
                }
            }
                break;
            case 2:{//collect gold
                this.Count[k] = engine.user.inventory.Gold;
                if( this.Count[k] < obj.count ){
                    completed = false;
                }
            }
                break;
            case 3:{//collect diamond
                this.Count[k] = engine.user.inventory.Diamond;
                if( this.Count[k] < obj.count ){
                    completed = false;
                }
            }
                break;
            case 4:{//collect level
                this.Count[k] = engine.user.actor.Level;
                if( this.Count[k] < obj.count ){
                    completed = false;
                }
            }
                break;
            case 5:{//collect power
                this.Count[k] = engine.user.actor.getPower();
                if( this.Count[k] < obj.count ){
                    completed = false;
                }
            }
                break;
        }
        //debug("* OBJ ["+k+"] AFTER "+this.Count[k]+"/"+obj.count);
    }
    if( completed ){
        this.State = QUESTSTATUS_COMPLETE;
        //debug("* QUEST COMPLETE");
    }
    else{
        this.State = QUESTSTATUS_ONGOING;
        //debug("* QUEST ONGOING");
    }
    return completed;
}

function QuestLog(){
    this.Quests = {};
    this.Count = 0;
    this.CompleteCount = 0;
}

QuestLog.prototype.update = function(event){
    debug("* Update Quest = \n"+JSON.stringify(event));
    var vibrate = true;

    if( event.arg.clr ){
        this.Quests = {};
        this.CompleteCount = 0;
        vibrate = false;
    }
    if( event.arg.qst != null ){
        var npcCountUpdateList = [];//label,now,total
        for(var k in event.arg.qst){
            var raw = event.arg.qst[k];
            var QuestData = libTable.queryTable(TABLE_QUEST, raw.qid);
            var quest = this.Quests[raw.qid];
            if( quest != null ){//modify state
                var NpcList = {};
                for(var m in QuestData.objects){
                    var obj = QuestData.objects[m];
                    if( obj.type == 0 ){
                        NpcList[m] = quest.Count[m];//old value
                    }
                }
                quest.parse(raw);
                if( quest.State == QUESTSTATUS_ONGOING
                    && quest.fixState()
                    && QuestData.hidden != true ){
                    this.CompleteCount++;
                }
                for(var m in NpcList){
                    {
                        npcCountUpdateList.push({
                            label: QuestData.objects[m].label,
                            now: quest.Count[m],
                            total: QuestData.objects[m].count
                        });
                        debug("任务更新："+QuestData.objects[m].label+"  "+quest.Count[m]+"/"+QuestData.objects[m].count);
                    }
                }
            }
            else{//new quest
                this.Quests[raw.qid] = new Quest(raw);
                this.Count++;
                if( this.Quests[raw.qid].fixState()
                    && QuestData.hidden != true ){
                    this.CompleteCount++;
                }
                if( QuestData.startDialogue != null && vibrate ){
                    engine.dialogue.startDialogue(QuestData.startDialogue);
                }
                //统计
                if( vibrate ){
                    tdga.questBegin("Q"+QuestData.questId);
                }
            }
        }
        if( vibrate ){
            engine.event.processNotification(Message_QuestUpdate, npcCountUpdateList);
        }
    }

    //this.dump();//debug
}

QuestLog.prototype.getQuestList = function(){
    var ret = {};
    for(var k in this.Quests){
        var qst = this.Quests[k];
        var questData = libTable.queryTable(TABLE_QUEST, qst.QuestId);
        if( questData != null && questData.hidden != true ){
            ret[k] = qst;
        }
    }
    return ret;
}

QuestLog.prototype.dump = function(){
    debug("DUMP QUEST");
    for(var k in this.Quests){
        debug("Quest["+k+"]=\n"+JSON.stringify(this.Quests[k]));
    }
}

exports.Quest = Quest;
exports.QuestLog = QuestLog;