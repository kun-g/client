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
    this.zoneId = 0;

    this.roleCache = {};
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
        if( obj.sid == msg.sid ){
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
            if( itm.cid == cid && itm.cnt == stc ){
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

var singleton = new Session();

exports.instance = singleton;