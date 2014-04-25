/**
 * User: hammer
 * Date: 13-10-15
 * Time: 下午4:21
 */

var util = loadModule("util.js");

var item = loadModule("xitem.js");
var stage = loadModule("stage.js");
var quest = loadModule("quest.js");
var bounty = loadModule("bounty.js");
var player = loadModule("player.js");
var role = loadModule("role.js");

function UPM(){
    this.SYNC = {};
    this.inited = false;
}

UPM.prototype.isInited = function(){
    return this.inited;
}

UPM.prototype.initProfile = function(profile)
{
    this.PROFILE = String(profile);
    var doc = file.getDocumentPath();
    var profilePath = doc+PATH_USER+profile;
    if( file.exist(profilePath) )
    {//载入Profile
        debug("load Profile("+profile+")");
        var data = file.read(profilePath);
        var user = util.load(data);
        copyProperties(this, user);
    }
    else
    {//创建新的Profile
        debug("new Profile("+profile+")");
        this.setData(CACHE_ACTOR, new role.Role());
        this.setData(CACHE_INVENTORY, new item.Inventory());
        this.setData(CACHE_PLAYER, new player.Player());
        this.setData(CACHE_STAGE, new stage.Stage());
        this.setData(CACHE_QUEST, new quest.QuestLog());
        this.setData(CACHE_BOUNTY, new bounty.BountyLog());
        this.setData(CACHE_FRIEND, new role.FriendList());
        this.setData(CACHE_ACTIVITY, {
            list: [],//活动列表
            dailyPrize: false,//每日奖励标记
            dailyPrizeDay: 1//每日奖励日期
        });
    }

    this.inited = true;
}

UPM.prototype.setProfile = function(profile)
{
    this.PROFILE = String(profile);
}

UPM.prototype.clearProfile = function()
{
    var doc = file.getDocumentPath();
    var profilePath = doc+PATH_USER+this.PROFILE;
    file.remove(profilePath);
}

UPM.prototype.clearAllProfiles = function()
{
    var doc = file.getDocumentPath();
    var profilePath = doc+PATH_USER+"new";
    file.remove(profilePath);
}

UPM.prototype.saveProfile = function()
{
    if( this.PROFILE != null )
    {
        var data = util.save(this);
        var doc = file.getDocumentPath();
        var profilePath = doc+PATH_USER+this.PROFILE;
        file.write(profilePath, data);
    }
    else
    {
        error("UPM.saveProfile: Profile is not initialized.");
    }
}

UPM.prototype.setData = function(key, obj, sid)
{
    if( sid == null )
    {
        sid = 0;
    }
    this[key] = obj;
    this.SYNC[key] = sid;
}

UPM.prototype.setSyncId = function(key, sid)
{
    this.SYNC[key] = sid;
}

UPM.prototype.unsetData = function(key){
    if( this[key] != null ){
        delete this[key];
        if( this.SYNC[key] != null ){
            delete this.SYNC[key];
        }
    }
}

var singleton = new UPM();

exports.instance = singleton;