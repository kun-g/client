/**
 * Created by tringame on 14-4-23.
 */

var libTable = loadModule("table.js");

function BountyLog(){
    this.dataBounty = [];
}

BountyLog.prototype.getBountyList = function(){
    var ret = {};
    var k = 0;
    do
    {
        var qst = {};
        var bountyData = libTable.queryTable(TABLE_BOUNTY, k);
        if( bountyData != null){
            qst.BountyId = bountyData.bountyId;
            ret[k] = qst;
        }
        k++;
    }while(bountyData != null);
    return ret;
};

BountyLog.prototype.getBountyListCount = function(){
    var ret = 0;
    var k = 0;
    do
    {
        var bountyData = libTable.queryTable(TABLE_BOUNTY, k);
        if( bountyData != null){
            ret++;
        }
        k++;
    }while(bountyData != null);
    return ret;
};

BountyLog.prototype.checkLevel = function(bountyId, level){
    var ret = false;

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if( bountyData != null){
        if (bountyData.level[level].levelLimit == undefined || bountyData.level[level].levelLimit <= engine.user.actor.Level){
            ret = true;
        }
    }

    return ret;
};

BountyLog.prototype.checkPower = function(bountyId, level){
    var ret = false;

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if( bountyData != null){
        if (bountyData.level[level].powerLimit == undefined || bountyData.level[level].powerLimit <= engine.user.actor.getPower()){
            ret = true;
        }
    }

    return ret;
};

BountyLog.prototype.checkClass = function(bountyId, level){
    var ret = false;

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if( bountyData != null){
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
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if (!engine.user.bounty.checkLevel(bountyId, level)){
        str = "需要等级" + bountyData.level[level].powerLimit + "。";
    };
    if (!engine.user.bounty.checkPower(bountyId, level)){
        str = "需要战斗力" + bountyData.level[level].powerLimit + "。";
    }
    if (!engine.user.bounty.checkClass(bountyId, level)){
        str = "只有";
        for (var k in bountyData.level[level].classLimit) {
            switch (bountyData.level[level].classLimit[k]) {
                case 0:
                    str += "战士、";
                    break;
                case 1:
                    str += "法师、";
                    break;
                case 2:
                    str += "牧师、";
                    break;

            }
        }
        str=str.substring(0,str.length-1);
        str += "职业可以做。";
    }
    return str;
}

BountyLog.prototype.checkProcess = function(bountyId, segId){
    var str = -1;
    if (segId == undefined){
        segId = 0;
    }

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);

    var remainFlag = bountyData.count;
//    debug("113: remainFlag = " + remainFlag);
//    debug("114: engine.user.bounty.dataBounty[" + bountyId + "] = " + JSON.stringify(engine.user.bounty.dataBounty[bountyId]));
    if ((remainFlag != undefined &&
        remainFlag > 0) &&
        (engine.user.bounty.dataBounty[bountyId] == undefined ||
            engine.user.bounty.dataBounty[bountyId].cnt == undefined ||
            engine.user.bounty.dataBounty[bountyId].cnt <= 0)){
        str = 3;
        return str;
    }

    var nowtime = new Date();
    //////////年/////////////
    if (bountyData.date.year != undefined){
        var boolflag = false;
        for (var k in bountyData.date.year){
            if (bountyData.date.year[k] == nowtime.getFullYear()){
                boolflag = true;
                break;
            }
        }
        if (boolflag == false){
            str = 2;
            return str;
        }
    }
    //////////月/////////////
    if (bountyData.date.month != undefined){
        var boolflag = false;
        for (var k in bountyData.date.month){
            if (bountyData.date.month[k] == nowtime.getMonth()){
                boolflag = true;
                break;
            }
        }
        if (boolflag == false){
            str = 2;
            return str;
        }
    }
    //////////日/////////////
    if (bountyData.date.date != undefined){
        var boolflag = false;
        for (var k in bountyData.date.date){
            if (bountyData.date.date[k] == nowtime.getDate()){
                boolflag = true;
                break;
            }
        }
        if (boolflag == false){
            str = 2;
            return str;
        }
    }
    //////////周/////////////
    if (bountyData.date.day != undefined){
        var boolflag = false;
        for (var k in bountyData.date.day){
            if (bountyData.date.day[k] == nowtime.getDay()){
                boolflag = true;
                break;
            }
        }
        if (boolflag == false){
            str = 2;
            return str;
        }
    }

    var starttime = bountyData.date.segment[segId].start.split(":");
    var endtime = bountyData.date.segment[segId].end.split(":");

    var sthour = 0;
    if (starttime[0] != undefined){
        sthour = starttime[0];
    }
    var stmin = 0;
    if (starttime[1] != undefined){
        stmin = starttime[1];
    }
    var endhour = 0;
    if (endtime[0] != undefined){
        endhour = endtime[0];
    }
    var endmin = 0;
    if (endtime[1] != undefined){
        endmin = endtime[1];
    }

    var sttime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),sthour, stmin, 0, 0);
    var edtime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),endhour, endmin, 0, 0);

    if (sttime - nowtime >= 0){
        str = 1;
    }
    else if(edtime - nowtime >= 0){
        var datetime = edtime.getTime() / 60000 - nowtime.getTime() / 60000;
        datetime = Math.ceil(datetime);
        if (Math.floor(datetime / 60) < 1)
            str = 0;
        else
            str = 4;
    }
    else{
        str = 2;
    }

    return str;
}

BountyLog.prototype.cacultime = function(bountyId, segId){
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if (segId == undefined){
        segId = 0;
    }

    var secFlag = ":";

    var remainFlag = bountyData.count;
//    debug("227: remainFlag = " + remainFlag);
//    debug("228: engine.user.bounty.dataBounty[" + bountyId + "] = " + JSON.stringify(engine.user.bounty.dataBounty[bountyId]));
    if ((remainFlag != undefined &&
        remainFlag > 0) &&
        (engine.user.bounty.dataBounty[bountyId] == undefined ||
        engine.user.bounty.dataBounty[bountyId].cnt == undefined ||
        engine.user.bounty.dataBounty[bountyId].cnt <= 0)){
        ret = "";
        return ret;
    }

    var nowtime = new Date();
    //////////年/////////////
    if (bountyData.date.year != undefined){
        var boolflag = false;
        for (var k in bountyData.date.year){
            if (bountyData.date.year[k] == nowtime.getFullYear()){
                boolflag = true;
                break;
            }
        }
        if (boolflag == false){
            ret = "";
            return ret;
        }
    }
    //////////月/////////////
    if (bountyData.date.month != undefined){
        var boolflag = false;
        for (var k in bountyData.date.month){
            if (bountyData.date.month[k] == nowtime.getMonth()){
                boolflag = true;
                break;
            }
        }
        if (boolflag == false){
            ret = "";
            return ret;
        }
    }
    //////////日/////////////
    if (bountyData.date.date != undefined){
        var boolflag = false;
        for (var k in bountyData.date.date){
            if (bountyData.date.date[k] == nowtime.getDate()){
                boolflag = true;
                break;
            }
        }
        if (boolflag == false){
            ret = "";
            return ret;
        }
    }
    //////////周/////////////
    if (bountyData.date.day != undefined){
        var boolflag = false;
        for (var k in bountyData.date.day){
            if (bountyData.date.day[k] == nowtime.getDay()){
                boolflag = true;
                break;
            }
        }
        if (boolflag == false){
            ret = "";
            return ret;
        }
    }

    var starttime = bountyData.date.segment[segId].start.split(":");
    var endtime = bountyData.date.segment[segId].end.split(":");

    var sthour = 0;
    if (starttime[0] != undefined){
        sthour = starttime[0];
    }
    var stmin = 0;
    if (starttime[1] != undefined){
        stmin = starttime[1];
    }
    var endhour = 0;
    if (endtime[0] != undefined){
        endhour = endtime[0];
    }
    var endmin = 0;
    if (endtime[1] != undefined){
        endmin = endtime[1];
    }

    var sttime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),sthour, stmin, 0, 0);
    var edtime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),endhour, endmin, 0, 0);

    var datetime = 0;
    var ret = "";
    var min = "";
    var sec = "";
    //debug("sttime.getTime() = " + sttime.getTime());
    if (sttime - nowtime >= 0){
        datetime = sttime.getTime() / 60000 - nowtime.getTime() / 60000;
        datetime = Math.ceil(datetime);
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
        datetime = Math.ceil(datetime);
        //debug("2datetime = " + datetime);
        if (Math.floor(datetime / 60) < 1){
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
            ret = "";
        }

    }
    else{
        ret = "";
    }
    //debug("ret = " + ret);
    return ret;
}

BountyLog.prototype.getProcess = function(bountyId){

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);

    var nowtime = new Date();
    var difftime = new Date();
    var selProc = 0;
    for (var k in bountyData.date.segment){
        var starttime = bountyData.date.segment[k].start.split(":");
        var endtime = bountyData.date.segment[k].end.split(":");

        var sthour = 0;
        if (starttime[0] != undefined){
            sthour = starttime[0];
        }
        var stmin = 0;
        if (starttime[1] != undefined){
            stmin = starttime[1];
        }
        var endhour = 0;
        if (endtime[0] != undefined){
            endhour = endtime[0];
        }
        var endmin = 0;
        if (endtime[1] != undefined){
            endmin = endtime[1];
        }

        var sttime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),sthour, stmin, 0, 0);
        var edtime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),endhour, endmin, 0, 0);

        if (edtime >= nowtime && edtime - nowtime < difftime){
            difftime = edtime - nowtime;
            selProc = k;
        }
    }


    return selProc;
}

BountyLog.prototype.getLimStartTimeHour = function(bountyId, segId){
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if (segId == undefined){
        segId = 0;
    }

    var starttime = bountyData.date.segment[segId].start.split(":");

    var sthour = 0;
    if (starttime[0] != undefined){
        sthour = starttime[0];
    }
    return sthour;
}

BountyLog.prototype.getLimStartTimeMin = function(bountyId, segId){
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if (segId == undefined){
        segId = 0;
    }

    var starttime = bountyData.date.segment[segId].start.split(":");

    var stmin = 0;
    if (starttime[1] != undefined){
        stmin = starttime[1];
    }
    return stmin
}

BountyLog.prototype.getScheduleLocalNotificationTime = function(bountyId, segId){
    var nowtime = new Date();
    var timebounty = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),
        engine.user.bounty.getLimStartTimeHour(bountyId, segId),
        engine.user.bounty.getLimStartTimeMin(bountyId, segId), 0, 0);
    return timebounty;
}

BountyLog.prototype.setScheduleLocalNotification = function(){
    var bountyCount = engine.user.bounty.getBountyListCount();
    if( bountyCount > 0 ){
        var list = engine.user.bounty.getBountyList();
        for (var k in list){
            var bountyData = libTable.queryTable(TABLE_BOUNTY, k);
            if (bountyData.notify != undefined && bountyData.notify >= 1){
                var segmentSel = engine.user.bounty.getProcess(k);

                system.unscheduleLocalNotification("bounty" + k);
                var timebounty = engine.user.bounty.getScheduleLocalNotificationTime(k, segmentSel);
                system.scheduleLocalNotification(
                        "bounty" + k,
                    timebounty,
                    bountyData.notifyText,
                    bountyData.notifyButton);
            }
        }
    }
}

exports.BountyLog = BountyLog;