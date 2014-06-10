/**
 * User: hammer
 * Date: 13-7-10
 * Time: 下午9:50
 */

var libTable = loadModule("table.js");

var RoleScheme = {
    sid : "ServerId",
    nam : "Name",
    cid : "ClassId",
    gen : "Gender",
    lev : "Level",
    exp : "Experience",
    hst : "HairStyle",
    hcl : "HairColor",
    hp : "Health",
    at : "Attack",
    cr : "Critical",
    st : "Strong",
    ac : "Accuracy",
    ra : "Reactivity",
    sp : "Speed",
    bst: "BlueStar",//蓝星
    ifn: "IsFriend",//好友标记
    vip: "vip",
    scr: "scr"
};

function Role(source)
{
    this.ServerId = -1;
    this.Name = "Unnamed";
    this.ClassId = -1;

    if( source != null )
    {//using scheme values
        this.parse(source);
    }
}

Role.prototype.parse = function(source, withArmor)
{
    if( withArmor == null ){
        withArmor = true;
    }

    loadModule("util.js").applyScheme(this, RoleScheme, source);
    //apply Armors
    if( withArmor ){
        if( source.itm != null )
        {
            var item = loadModule("xitem.js");
            this.Armors = [];
            for( var i in source.itm )
            {
                var itm = new item.Item(source.itm[i]);
                this.setArmor(itm);
            }
        }
    }

    //apply Skills
    if( source.ski != null )
    {
        var skill = loadModule("skill.js");
        this.Skills = [];
        for( var i in source[ski] )
        {
            var ski = new skill.Skill(source.ski[i]);
            this.setSkill(ski);
        }
    }
}

Role.prototype.update = function(event)
{
    debug("UPDATE ROLE = \n"+JSON.stringify(event));
    var vibrate = true;

    if( event.clr ){
        vibrate = false;
    }

    var oldLevel = 0;
    if( this.Level != null ){
        oldLevel = this.Level;
    }
    this.parse(event.act, false);
    if( this.ClassId >= 0 ){//有可能只更新vip数据后更新完整的角色数据
        this.fix();
        var newLevel = this.calcExp().level;
    }

    if( vibrate && event.act.exp != null && oldLevel != newLevel ){
        loadModule("pops").setLevelUpAnimation();
    }
}

//translate to server format
Role.prototype.internal = function(){
    var oRole = {};
    oRole.class = this.ClassId;
    oRole.xp = this.Experience;
    oRole.equipment = [];
    for(var k in this.Armors){
        var eq = this.Armors[k];
        if( eq != null ){
            oRole.equipment.push(eq.internal());
        }
    }
    return oRole;
}

Role.prototype.calcExp = function()
{
    var ret = {};
    ret.level = 0;
    ret.now = 0;
    ret.total = 0;
    ret.max = false;

    var RoleClass = libTable.queryTable(TABLE_ROLE, this.ClassId);
    var LevelClass = libTable.queryTable(TABLE_LEVEL, RoleClass.levelId);
    if( LevelClass == null ){
        return ret;
    }
    var levels = LevelClass.levelData;
    if( this.Experience >= levels[levels.length-1].xp )
    {//full level
        ret.level = levels.length;
        ret.now = levels[levels.length-1].xp;
        ret.total = ret.now;
        ret.max = true;
    }
    else
    {
        for(var i=0; i<levels.length; ++i)
        {
            if( this.Experience < levels[i].xp )
            {
                ret.level = i;
                ret.now = this.Experience - levels[i-1].xp;
                ret.total = levels[i].xp - levels[i-1].xp;
                break;
            }
        }
    }
    return ret;
}

Role.prototype.getPower = function()
{
    return engine.box.calcHeroPower(this);
}

Role.prototype.setArmor = function(item)
{
    if( this.Armors == null )
    {
        this.Armors = [];
    }

    var ItemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
    var slot = ItemClass.subcategory;
    //Armors 以槽位作为装备的索引
    //debug("* Armors["+slot+"] = "+JSON.stringify(item));
    this.Armors[slot] = item;
}

Role.prototype.removeArmor = function(slot)
{
    if( this.Armors != null )
    {
        this.Armors[slot] = null;
    }
}

Role.prototype.queryArmor = function(slot, nodefault)
{
    if( nodefault == null ) nodefault = false;
    if( this.Armors == null )
    {
        return null;
    }
    var ret = this.Armors[slot];
    if( ret != null && nodefault ){
        var ItemClass = libTable.queryTable(TABLE_ITEM, ret.ClassId);
        if( ItemClass.label == null ){
            ret = null;
        }
    }
    return ret;
}

Role.prototype.setSkill = function(skill)
{
    if( this.Skills == null )
    {
        this.Skills = [];
    }

    var SkillClass = libTable.queryTable(TABLE_SKILL, skill.ClassId);
    var slot = SkillClass.slotId;
    //Skills 以槽位为技能的索引
    this.Skills[slot] = skill;
}

Role.prototype.querySkill = function(slot)
{
    if( this.Skills == null )
    {
        return null;
    }
    return this.Skills[slot];
}

Role.prototype.fix = function()
{
    var RoleClass = libTable.queryTable(TABLE_ROLE, this.ClassId);

    //fix player attribute
    if( RoleClass.classType == 0 )
    {
        engine.box.fixHeroProperty(this);

        if( this.Level == null )
        {
            this.Level = 1;
        }
        if( this.Health == null )
        {
            this.Health = 0;
        }
        if( this.Attack == null )
        {
            this.Attack = 0;
        }
        if( this.Critical == null )
        {
            this.Critical = 0;
        }
        if( this.Strong == null )
        {
            this.Strong = 0;
        }
        if( this.Accuracy == null )
        {
            this.Accuracy = 0;
        }
        if( this.Reactivity == null )
        {
            this.Reactivity = 0;
        }
        if( this.Speed == null )
        {
            this.Speed = 0;
        }
        if( this.Experience == null )
        {
            this.Experience = 0;
        }
        if( this.Score == null )
        {
            this.Score = 0;
        }
    }

    //填补默认装备
    var defaultArmors = RoleClass.defaultArmors;
    if( defaultArmors != null )
    {
        var item = loadModule("xitem.js");

        for(var index in defaultArmors)
        {
            var classId = defaultArmors[index];
            var ItemClass = libTable.queryTable(TABLE_ITEM, classId);
            var slot = ItemClass.subcategory;
            var exist = this.queryArmor(slot);
            if( exist == null )
            {
                var armor = new item.Item();
                armor.ClassId = classId;
                this.setArmor(armor);
            }
        }

        //修正发型
        if( this.HairStyle == null )
        {
            this.HairStyle = 0;
        }
        var hair = new item.Item();
        hair.ClassId = HAIR_STYLE[this.HairStyle];

        this.setArmor(hair);
    }

    this.Level = this.calcExp().level;
}

//----------- query functions ----------
Role.prototype.getArmorRank = function(slot){
    var item = this.queryArmor(slot);
    if( item != null ){
        var itemClass = libTable.queryTable(TABLE_ITEM, item.ClassId);
        if( itemClass.rank != null ) return itemClass.rank;
        else return -1;
    }
    else return -1;
}

exports.Role = Role;

/*** FriendList ***/
function FriendList(){
    this.Friends = [];
    this.Capacity = 20;
    this.Count = 0;
}

FriendList.prototype.update = function(event){
    var vibrate = true;
    if( event.arg.clr ){
        this.Friends = [];
        this.Capacity = 20;
        this.Count = 0;
    }

    //prepare update arguments
    var notify = {
        add:[],
        update:[]
    };

    for(var k in event.arg.fri){
        var role = new Role(event.arg.fri[k]);
        var exist = this.queryFriend(role.Name);
        if( exist >= 0 ){
            //modify
            role.ServerId = exist;
            this.Friends[exist] = role;

            notify.update.push(role);
        }
        else{
            //add
            role.ServerId = this.Friends.length;
            this.Friends.push(role);
            this.Count++;

            notify.add.push(role);
        }
    }

    if( event.arg.cap != null ){
        this.Capacity = event.arg.cap;
    }

    if( vibrate ){
        engine.event.processNotification(Message_UpdateFriend, notify);
    }
}

FriendList.prototype.queryFriend = function(name){
    for(var k in this.Friends){
        if( this.Friends[k].Name == name ){
            return Number(k);
        }
    }
    return -1;
}

FriendList.prototype.addFriend = function(role){
    role.ServerId = this.Friends.length;
    this.Friends.push(role);
    this.Count++;
}

FriendList.prototype.removeFriend = function(name){
    var exist = this.queryFriend(name);
    if( exist >= 0 ){
        this.Friends.splice(exist, 1);
        this.Count--;
    }
}

FriendList.prototype.sort = function(){
    this.Friends = this.Friends.sort(function(a, b){
        a.fix();
        b.fix();
        var PA = a.getPower();
        var PB = b.getPower();
        return PB - PA;
    });
}

exports.FriendList = FriendList;