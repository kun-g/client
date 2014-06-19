/**
 * User: hammer
 * Date: 13-11-25
 * Time: 下午2:22
 */

var libWhisper = loadModule("Whisper.js");

var MAX_CHAT = 50;

function Session(){
    this.chats = [];
    this.whisper = new libWhisper.Whisper();
    this.team = [];
    this.deliver = [];//系统信息
    this.invite = [];//好友邀请
    this.MessageCount = 0;
    this.ABTestSeed = 0;

    this.accountName = null;
    this.accountId = null;
    this.accountType = null;
    this.zoneId = 0;
    this.roleCache = {};
    this.dataBounty = [];
    this.MonthCardAvaiable = false;
    this.PkInfo = {};
}

Session.prototype.pushFriendApply = function(msg){
    for(var k in this.invite){
        var obj = this.invite[k];
        if( obj.sid == msg.sid ){
            this.invite.splice(k, 1);
            this.MessageCount--;
        }
    }
    this.invite.push(msg);
    this.MessageCount++;
}

Session.prototype.pushSystemDeliver = function(msg){
    for(var k in this.deliver){
        var obj = this.deliver[k];
        if( obj.sid == msg.sid || (msg.typ == 0 && obj.typ == msg.typ) ){
            this.deliver.splice(k, 1);
            this.MessageCount--;
        }
    }
    this.deliver.push(msg);
    this.MessageCount++;
}

Session.prototype.pushChat = function(chat){
    this.chats.push(chat);
    if( this.chats.length > MAX_CHAT ){
        this.chats.splice(0, 1);//remove the head
    }
    engine.event.processNotification(Message_NewChat, chat);
}

Session.prototype.set = function(key, value){
    this[key] = value;
}

Session.prototype.queryStore = function(cid, stc){
    var ret = null;
    do{
        if( this.shop == null ) break;
        for(var k in this.shop.items){
            var itm = this.shop.items[k];
            if( itm.cnt == null ){
                itm.cnt = 1;
            }
            if( itm.cid == cid &&
                ( (stc != null && itm.cnt == stc) || (stc == null) ) ){
                ret = itm;
                break;
            }
        }
    }while(false);
    return ret;
}

Session.prototype.clearTeam = function(){
    this.team = [];
}

Session.prototype.cacheRoleInfo = function(info){
    if( Array.isArray(info) ){
        for(var k in info){
            var role = info[k];
            if( role.nam != null ){
                this.roleCache[role.nam] = role;
            }
        }
    }
    else{
        if( info.nam != null ){
            this.roleCache[info.nam] = info;
        }
    }
}

Session.prototype.queryRoleInfo = function(name){
    return this.roleCache[name];
}

Session.prototype.updatePVPInfo = function() {
    var libUIKit = loadModule("uiKit.js");
    libUIKit.waitRPC(Request_PVPInfoUpdate, {}, function (rsp) {
        if( rsp.RET == RET_OK ){
            if( rsp.pki != null ){
                this.PkInfo = rsp.pki;
            }else{
                debug("*updatePVPInfo error: pki is null");
            }
        }else{
            debug("*updatePVPInfo error: RET is not OK");
        }
    }, this);
}

var singleton = new Session();

exports.instance = singleton;