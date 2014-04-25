/**
 * Created by tringame on 14-4-23.
 */

var libTable = loadModule("table.js");

var BountyScheme = {
    bid: "bountyId",
    sta: "status",
    cnt: "count",
    lev: "level",
    prz: "prize",
    typ: "type"
};

function Bounty(source){
    this.BountyId = -1;
    this.Status = BOUNTYSTATUS_ONGOING;
    this.Count = [];
    this.Poped = false;
    this.bountyData = [];

    if( source != null ){
        this.parse(source);
    }
}

Bounty.prototype.parse = function(source){
    loadModule("util.js").applyScheme(this, BountyScheme, source);
    bountyData[source.bountyId] = source;
    //this.fixState();
};

Bounty.prototype.fixState = function(){
    //debug("* BOUNTY fixState == "+JSON.stringify(this));
    var completed = true;
    var BountyData = libTable.queryTable(TABLE_BOUNTY, this.BountyId);
    for(var k in BountyData.objects){
        var obj = BountyData.objects[k];
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
        this.State = BOUNTYSTATUS_COMPLETE;
        //debug("* BOUNTY COMPLETE");
    }
    else{
        this.State = BOUNTYSTATUS_ONGOING;
        //debug("* BOUNTY ONGOING");
    }
    return completed;
};

function BountyLog(){
    this.Bountys = {};
    this.Count = 0;
    this.CompleteCount = 0;
    this.bountyData = [];
}

BountyLog.prototype.getBountyList = function(){
    var ret = {};
    var k = 0;
    do
    {
        var qst = {};
        var bountyData = libTable.queryTable(TABLE_BOUNTY, k);
        if( bountyData != null && bountyData.hidden != true ){
            qst.BountyId = bountyData.bountyId;
            ret[k] = qst;
        }
        k++;
    }while(bountyData != null && bountyData.hidden != true);
    return ret;
};

BountyLog.prototype.getBountyListCount = function(){
    var ret = 0;
    var k = 0;
    do
    {
        var bountyData = libTable.queryTable(TABLE_BOUNTY, k);
        if( bountyData != null && bountyData.hidden != true ){
            ret++;
        }
        k++;
    }while(bountyData != null && bountyData.hidden != true);
    return ret;
};

BountyLog.prototype.checkLevel = function(bountyId, level){
    var ret = false;

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if( bountyData != null && bountyData.hidden != true ){
        if (bountyData.level[level].levelLimit == undefined || bountyData.level[level].levelLimit <= engine.user.actor.Level){
            ret = true;
        }
    }

    return ret;
};

BountyLog.prototype.checkPower = function(bountyId, level){
    var ret = false;

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if( bountyData != null && bountyData.hidden != true ){
        if (bountyData.level[level].powerLimit == undefined || bountyData.level[level].powerLimit <= engine.user.actor.getPower()){
            ret = true;
        }
    }

    return ret;
};

BountyLog.prototype.checkClass = function(bountyId, level){
    var ret = false;

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if( bountyData != null && bountyData.hidden != true ){
        if (bountyData.level[level].classLimit == undefined){
            ret = true;
        }
        else{
            for (var k in bountyData.level[level].classLimit){
                if (bountyData.level[level].classLimit[k] == engine.user.actor.Level){
                    ret = true;
                }
            }
        }
    }

    return ret;
};

BountyLog.prototype.checkLimit = function(bountyId, level){
    var str = "";
    if (!engine.user.bounty.checkLevel(bountyId, level)){
        str += "等级不够";
    }
    if (!engine.user.bounty.checkPower(bountyId, level)){
        str += "，战力太低";
    }
    if (!engine.user.bounty.checkClass(bountyId, level)){
        str += "，职业不符合";
    }
    if (str.length > 0){
        str += "。";
    }
    return str;
}

BountyLog.prototype.checkProcess = function(bountyId, segId){
    var str = -1;
    if (segId == undefined){
        segId = 0;
    }
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if (bountyData.begin == 0){
        str = 4;
    }
    else{
        var nowtime = new Date();
        var sttime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),
            Number(bountyData.date.segment[segId].start.substr(0,2)), Number(bountyData.date.segment[segId].start.substr(3,2)), 0, 0);
        var edtime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),
            Number(bountyData.date.segment[segId].end.substr(0,2)), Number(bountyData.date.segment[segId].end.substr(3,2)), 0, 0);

        if (sttime - nowtime >= 0){
            str = 1;
        }
        else if(edtime - nowtime >= 0){
            str = 0;
        }
        else{
            str = 2;
        }
    }

    return str;
}

BountyLog.prototype.cacultime = function(bountyId, segId, theSecFlag){
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if (segId == undefined){
        segId = 0;
    }
    if (theSecFlag == undefined){
        theSecFlag = true;
    }
    var secFlag = "";
    if (theSecFlag == true){
        secFlag = "-";
    }
    else{
        secFlag = " )";
    }
    var nowtime = new Date();
    //debug("nowtime = " + nowtime);
    var sttime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),
        Number(bountyData.date.segment[segId].start.substr(0,2)), Number(bountyData.date.segment[0].start.substr(3,2)), 0, 0);
    var edtime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),
        Number(bountyData.date.segment[segId].end.substr(0,2)), Number(bountyData.date.segment[0].end.substr(3,2)), 0, 0);

    var datetime = 0;
    var ret = "";
    var min = "";
    var sec = "";
    //debug("sttime.getTime() = " + sttime.getTime());
    if (sttime - nowtime >= 0){
        datetime = sttime.getTime() / 60000 - nowtime.getTime() / 60000;
        datetime = Math.floor(datetime);
        //debug("1datetime = " + datetime);
        if (Math.floor(datetime / 60) < 10){
            min = "0" + Math.floor(datetime / 60);
        }
        else{
            min = Math.floor(datetime / 60);
        }
        if (datetime % 60 < 10){
            sec = "0" + datetime % 60;
        }
        else{
            sec = datetime % 60;
        }
        ret = min + secFlag + sec;
    }
    else if(edtime - nowtime >= 0){
        datetime = edtime.getTime() / 60000 - nowtime.getTime() / 60000;
        datetime = Math.floor(datetime);
        //debug("2datetime = " + datetime);
        if (Math.floor(datetime / 60) < 10){
            min = "0" + Math.floor(datetime / 60);
        }
        else{
            min = Math.floor(datetime / 60);
        }
        if (datetime % 60 < 10){
            sec = "0" + datetime % 60;
        }
        else{
            sec = datetime % 60;
        }
        ret = min + secFlag + sec;
    }
    else{
        datetime = sttime.getTime() / 60000 - nowtime.getTime() / 60000 + 24 * 60;
        datetime = Math.floor(datetime);
        //debug("3datetime = " + datetime);
        if (Math.floor(datetime / 60) < 10){
            min = "0" + Math.floor(datetime / 60);
        }
        else{
            min = Math.floor(datetime / 60);
        }
        if (datetime % 60 < 10){
            sec = "0" + datetime % 60;
        }
        else{
            sec = datetime % 60;
        }
        ret = min + secFlag + sec;
    }
    //debug("ret = " + ret);
    return ret;
}

BountyLog.prototype.dump = function(){
    debug("DUMP BOUNTY");
    for(var k in this.Bountys){
        debug("Bounty["+k+"]=\n"+JSON.stringify(this.Bountys[k]));
    }
};

exports.Bounty = Bounty;
exports.BountyLog = BountyLog;