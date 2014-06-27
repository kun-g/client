/**
 * Created by tringame on 14-4-23.
 */

var libTable = loadModule("table.js");

function BountyLog(){
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
        if (bountyData.level[level].levelLimit == null || bountyData.level[level].levelLimit <= engine.user.actor.Level){
            ret = true;
        }
    }

    return ret;
};

BountyLog.prototype.checkPower = function(bountyId, level){
    var ret = false;

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if( bountyData != null){
        if (bountyData.level[level].powerLimit == null || bountyData.level[level].powerLimit <= engine.user.actor.getPower()){
            ret = true;
        }
    }

    return ret;
};

BountyLog.prototype.checkClass = function(bountyId, level){
    var ret = false;

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if( bountyData != null){
        if (bountyData.level[level].classLimit == null){
            ret = true;
        }
        else{
            for (var k in bountyData.level[level].classLimit){
                if (bountyData.level[level].classLimit[k] == engine.user.actor.ClassId){
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
        for (var k in bountyData.level[level].classLimit) {
            var roleClass = libTable.queryTable(TABLE_ROLE, bountyData.level[level].classLimit[k]);
            str += roleClass.className + "、";
        }
        if (str.length > 0){
            str=str.substring(0,str.length-1);
            str += "职业可以做。";
        }
    }
    return str;
}

BountyLog.prototype.checkProcess = function(bountyId, segId){
    var str = -1;
    if (segId == null){
        segId = 0;
    }

    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);

    var nowtime = new Date();
    if(!matchDate(bountyData.date, nowtime)){
        str = 2;
        return str;
    }

    var starttime = bountyData.date.segment[segId].start.split(":");
    var endtime = bountyData.date.segment[segId].end.split(":");

    var sthour = 0;
    if (starttime[0] != null){
        sthour = starttime[0];
    }
    var stmin = 0;
    if (starttime[1] != null){
        stmin = starttime[1];
    }
    var endhour = 0;
    if (endtime[0] != null){
        endhour = endtime[0];
    }
    var endmin = 0;
    if (endtime[1] != null){
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
        if (Math.floor(datetime / 60) < 1){
            str = 0;
        }
        else{
            str = 4;
        }
        //任务进行中，若次数使用完则显示已经完成
        var remainFlag = bountyData.count;
        if ((remainFlag != null &&
            remainFlag > 0) &&
            (engine.session.dataBounty[bountyId] == null ||
                engine.session.dataBounty[bountyId].cnt == null ||
                engine.session.dataBounty[bountyId].cnt <= 0)){
            str = 3;
            return str;
        }
    }
    else{
        str = 2;
    }

    return str;
}

BountyLog.prototype.cacultime = function(bountyId, segId){
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if (segId == null){
        segId = 0;
    }

    var secFlag = ":";

    var nowtime = new Date();
    if(!matchDate(bountyData.date, nowtime)){
        ret = "";
        return ret;
    }

    var starttime = bountyData.date.segment[segId].start.split(":");
    var endtime = bountyData.date.segment[segId].end.split(":");

    var sthour = 0;
    if (starttime[0] != null){
        sthour = starttime[0];
    }
    var stmin = 0;
    if (starttime[1] != null){
        stmin = starttime[1];
    }
    var endhour = 0;
    if (endtime[0] != null){
        endhour = endtime[0];
    }
    var endmin = 0;
    if (endtime[1] != null){
        endmin = endtime[1];
    }

    var sttime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),sthour, stmin, 0, 0);
    var edtime = new Date(nowtime.getFullYear(), nowtime.getMonth(), nowtime.getDate(),endhour, endmin, 0, 0);

    var datetime = 0;
    var ret = "";
    var min = "";
    var sec = "";
    if (sttime - nowtime >= 0){
        datetime = sttime.getTime() / 60000 - nowtime.getTime() / 60000;
        datetime = Math.ceil(datetime);
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
        //任务进行中，若次数使用完则显示已经完成
        var remainFlag = bountyData.count;
        if ((remainFlag != null &&
            remainFlag > 0) &&
            (engine.session.dataBounty[bountyId] == null ||
                engine.session.dataBounty[bountyId].cnt == null ||
                engine.session.dataBounty[bountyId].cnt <= 0)){
            ret = "";
            return ret;
        }
    }
    else{
        ret = "";
    }
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
        if (starttime[0] != null){
            sthour = starttime[0];
        }
        var stmin = 0;
        if (starttime[1] != null){
            stmin = starttime[1];
        }
        var endhour = 0;
        if (endtime[0] != null){
            endhour = endtime[0];
        }
        var endmin = 0;
        if (endtime[1] != null){
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
    if (segId == null){
        segId = 0;
    }

    var starttime = bountyData.date.segment[segId].start.split(":");

    var sthour = 0;
    if (starttime[0] != null){
        sthour = starttime[0];
    }
    return sthour;
}

BountyLog.prototype.getLimStartTimeMin = function(bountyId, segId){
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    if (segId == null){
        segId = 0;
    }

    var starttime = bountyData.date.segment[segId].start.split(":");

    var stmin = 0;
    if (starttime[1] != null){
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

BountyLog.prototype.checkAllLevelLimit = function(bountyId){
    var ret = false;
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    for (var k in bountyData.level){
        if (engine.user.bounty.checkLimit(bountyId, k).length <= 0){
            ret = true;
            break;
        }
    }
    return ret;
}

BountyLog.prototype.getNextActiveTime = function(bountyId){
    var ret = null;
    var boundyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    //load segments
    var segments = [];
    for(var k in boundyData.date.segment){
        var strTime = boundyData.date.segment[k].start;
        var strTimeParts = strTime.split(":");
        segments.push({
            hour: Number(strTimeParts[0]),
            minute: Number(strTimeParts[1])
        });
    }
    segments = segments.sort(function(a, b){
        var va = a.hour*60 + a.minute;
        var vb = b.hour*60 + b.minute;
        return va - vb;
    });

    var now = new Date();
    var oneDay = 1000*60*60*24;
    var found = false;
    for(var k = 0; k<=7; ++k){
        if( found ) break;
        var thatDate = new Date(now.valueOf() + k*oneDay);
        if( matchDate(boundyData.date, thatDate) ){
            for(var l in segments){
                thatDate.setHours(segments[l].hour);
                thatDate.setMinutes(segments[l].minute);
                if( now.valueOf() < thatDate.valueOf() ){
                    ret = thatDate;
                    found = true;
                    break;
                }
            }
        }
    }
    return ret;
}

BountyLog.prototype.setScheduleLocalNotification = function(){
    var bountyCount = engine.user.bounty.getBountyListCount();
    if (bountyCount > 0) {
        var list = engine.user.bounty.getBountyList();
        for (var k in list) {
            var bountyData = libTable.queryTable(TABLE_BOUNTY, k);
            if (bountyData.notify != null &&
                bountyData.notify >= 1 &&
                engine.session.dataBounty[k] != null &&
                engine.session.dataBounty[k].sta == 1 &&
                engine.user.bounty.checkAllLevelLimit(k)) {

                var nextActiveTime = this.getNextActiveTime(k);
                if( nextActiveTime != null ){
                    system.scheduleLocalNotification(
                        "bounty" + k,
                        nextActiveTime,
                        bountyData.notifyText,
                        bountyData.notifyButton);
                }
            }
        }
    }
}

exports.BountyLog = BountyLog;