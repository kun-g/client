/**
 * User: hammer
 * Date: 13-7-8
 * Time: 下午3:05
 */

/*** GAME CONSTANTS ***/
var INITIAL_STAGE = 104;

/*** Protect Flag ***/
var FLAG_PROTECT = true;
var FLAG_BLACKBOX = true;

var MUSIC_VOLUME = 0.75;
var SFX_VOLUME = 1;

var AccountTypeName = [
    "未定义",//0
    "设备",  //1
    "PP助手",//2
    "PP助手",//3
    "91助手",//4
    "GameCenter"//5
];

/*** FILE PATHS ***/
var PATH_UPDATE = "update/";
var PATH_DOWNLOAD = "download/";
var PATH_USER = "user/";
var PATH_LOG = "log/";

/*** UI DEFINES ***/
var UI_FONT = "Helvetica-Bold";
var UI_SIZE_S = 24;
var UI_SIZE_L = 28;
var UI_SIZE_XL = 32;
var UI_SIZE_XXL = 48;

var UI_ITEM_SIZE = 100;
var UI_ITEM_GAP = 16;
var UI_ITEM_FRAME = 112;

var UI_NAME_LENGTH = 10;
var UI_CHAT_LENGTH = 70;

//技能图片作为卡片时的缩放
var UI_SKILL_SCALE = 0.844;

var BUTTON_OFFSET = cc.p(0, 0);

/*** USER CACHE ***/
var CACHE_ACTOR = "actor";
var CACHE_INVENTORY = "inventory";
var CACHE_PLAYER = "player";
var CACHE_STAGE = "stage";
var CACHE_QUEST = "quest";
var CACHE_BOUNTY = "bounty";
var CACHE_FRIEND = "friend";
var CACHE_ACTIVITY = "activity";
var CACHE_DUNGEON = "dungeon";
var CACHE_SHORT = {
    act: CACHE_ACTOR,
    inv: CACHE_INVENTORY,
    qst: CACHE_QUEST,
    stg: CACHE_STAGE
};

/*** SYSTEM VARIABLES ***/
var CLICK_RANGE = 50;
var CLICK_RANGESQ = CLICK_RANGE*CLICK_RANGE;

//TCP STATE from tcp callbacks
var TCP_OK = 0;
var TCP_DISCONNECTED = 1;
var TCP_TIMEOUT = 2;
var TCP_FAIL_INIT = 3;
var TCP_FAIL_CONNECT = 4;
var TCP_FAIL_SEND = 5;
var TCP_FAIL_RECV = 6;

/*** ITEM OPERATIONS ***/
var ITMOP_USE = 0;
var ITMOP_EQUIP = 1;
var ITMOP_ENHANCE = 2;
var ITMOP_UPGRADE = 3;
var ITMOP_FORGE = 4;
var ITMOP_SYNTHESIZE = 5;
var ITMOP_USEEXPBOOK = 6;
var ITMOP_DISSOLVE = 7;
var ITMOP_SELL = 8;

/*** COLORS ***/
var COLOR_HAIR = [
    [123,116,113],//黑色 0
    [210,210,210],//灰色 1
    [234,191,104],//黄色 2
    [173,109, 75],//褐色 3
    [216, 80, 65],//红色 4
    [234,191,104],//5
    [112,175, 65],//6
    [ 70,150,221],//7
    [180,100,210],//8
    [223,102,145],//9
    [237,151, 73],//橙色 10
    [240,113,113],//淡红 11
    [160,203, 61],//青绿 12
    [112,191,239],//天蓝 13
    [214,143,243],//紫色 14
    [247,151,185],//粉红 15
    [250,211,141],//金黄 16
    [255,255,255],//雪白 17
    [ 80, 77, 75]//乌黑 18
];

var COLOR_VALUEUP = cc.c3b(133, 222, 44);
var COLOR_VALUEDOWN = cc.c3b(232, 55, 55);
var COLOR_DEBUFF = cc.c3b(203, 84, 224);
var COLOR_BUFF = cc.c3b(255, 191, 0);

var COLOR_LABEL_RED = cc.c3b(240, 0, 0);
var COLOR_LABEL_GREEN = cc.c3b(0, 240, 0);

var MSGPOP_COLORS = [
    cc.c3b(60, 206, 30),
    cc.c3b(245, 213, 56),
    cc.c3b(240, 0, 0)
];

var COLOR_QUALITY = [
    cc.c3b(165, 165, 172),//[0]Normal Item
    cc.c3b(112, 203, 19 ),//[1]Good Item
    cc.c3b(31 , 187, 255),//[2]Rare Item
    cc.c3b(198, 63 , 242),//[3]Epic Item
    cc.c3b(250, 145, 0  ) //[4]Legendary Item
];

var HAIR_STYLE = [7, 8, 9, 29, 30, 31];

var playerClasses = [0, 1, 2];

var EquipSlotDesc = [
    "主武器",
    "副武器",
    "胸甲",
    "戒指",
    "腿甲",
    "护符",
    "脸部",
    "眼部",
    "眉毛",
    "头发",
    "主手装饰",
    "副手装饰",
    "外套",
    "头盔",
    "发型",
    "头饰"
];

var ServerPropertyTable ={
    health: "生命",
    speed: "速度",
    attack: "攻击",
    critical: "暴击",
    strong: "韧性",
    accuracy: "命中",
    reactivity: "反应"
};

/*** DUNGEONS ***/
var DG_BLOCKCOUNT = 30;
var DG_LEVELWIDTH = 5;
var DG_LEVELHEIGHT = 6;
var DG_PARTYCOUNT = 3;
var DG_CARDCOUNT = 5;
var LO_GRID = 128;
var LO_CORNER = 24;

var BLOCK_EMPITY = 0;
var BLOCK_EXIT = 1;
var BLOCK_ENEMY = 2;
var BLOCK_NPC = 3;
var BLOCK_LOCKEDEXIT = 4;

var ACTION_DELAY = 0.3;

var RUN_SPEED = 700;
var HERO_TAG = 0;
var UNIT_TAG = 100;

function isHero(ref){
    if( ref >= UNIT_TAG ){
        return false;
    }
    return true;
}

var CARD_WIDTH = 94;
var CARD_HEIGHT = 94;
var CARD_SPACE = 100;

/*** REQUESTS ***/
var Request_SyncData = 0;
var Request_GameStartDungeon = 1;
var Request_DungeonExplore = 2;
var Request_DungeonActivate = 3;
var Request_DungeonAttack = 4;
var Request_DungeonSpell = 5;
var Request_DungeonCard = 6;
var Request_InventoryUseItem = 7;
var Request_DungeonRevive = 8;
var Request_StoreBuyItem = 9;
var Request_Reserved_10 = 10;
var Request_Reserved_11 = 11;
var Request_StageRequireMercenaryList = 12;
var Request_StageRefreshMercenaryList = 13;
var Request_Reserved_14 = 14;
var Request_ChargeDiamond = 15;
var Request_BuyFeature = 16;
var Request_CommitDungeon = 17;
var Request_SubmitQuest = 18;
var Request_SendChat = 19;
var Request_CancelDungeon = 20;
var Request_FriendInvite = 21;
var Request_FriendRemove = 22;
var Request_FriendTeam = 23;
var Request_SendWhisper = 24;
var Request_NotifyOperate = 25;
var Request_RoleInfo = 26;
var Request_TutorialStageComplete = 27;
var Request_ReportState = 28;
var Request_SubmitDailyQuest = 29;
var Request_QueryLeaderboard = 30;
var Request_SubmitBounty = 31;
var Request_GetPkRivals = 32;
var Request_ReceivePrize = 33;
var Request_PVPInfoUpdate = 34;
var Request_SweepStage = 35;
var Request_WorldStageInfo = 36;

var Request_AccountLogin = 100;
var Request_AccountCreate = 101;
var Request_Echo = 103;
var Request_Awake = 104;
var Request_BindAccount = 105;

var Request_GetDailyPrize = 300;

/*** ReceivePrizeType ***/
var ReceivePkPrize = 0;

/*** EVENTS ***/
var Event_DungeonEnter = 0;
var Event_SynCheck = 1;
var Event_RoleUpdate = 2;
var Event_DungeonAction = 3;
var Event_DungeonBlackbox = 4;
var Event_InventoryUpdate = 5;
var Event_Reserved_6 = 6;
var Event_ForgeUpdate = 7;
var Event_Reserved_8 = 8;
var Event_StoreUpdateItemsRemain = 9;
var Event_StoreList = 10;
var Event_RequestFailed = 11;
var Event_StageUpdate = 12;
var Event_DungeonReward = 13;
var Event_StageMercenaryList = 14;
var Event_DungeonUpdate = 15;
var Event_ServerList = 16;
var Event_EnergyUpdate = 17;
var Event_ExpUpdate = 18;
var Event_QuestUpdate = 19;
var Event_ChatMessage = 20;
var Event_FriendUpdate = 21;
var Event_ActivityUpdate = 22;
var Event_TutorialInfo = 23;
var Event_PlayerInfo = 24;
var Event_Broadcast = 25;
var Event_ABTestSeed = 26;
var Event_UpdateDailyQuest = 27;
var Event_UpdatePlayerFlags = 28;
var Event_BountyUpdate = 30;

var Event_Reconnect = 100;
var Event_Echo = 101;

/*** System Notifications ***/
var Event_FriendApply = 200;
var Event_SystemDeliver = 201;

/*** Activity Notifications ***/
var Event_ActivityDailyPrize = 300;

/*** MESSAGES ***/
var Message_SyncBegin = 1000;
var Message_SyncUpdate = 1001;
var Message_SyncEnd = 1002;
var Message_TouchGrid = 1003;
var Message_LevelCompleted = 1004;
var Message_OnCardSelect = 1005;
var Message_OnCardDismiss = 1006;
var Message_OnCardUse = 1007;
var Message_UnlockChapter = 1008;
var Message_UpdateStage = 1009;
var Message_ServerConnected = 1010;
var Message_PaymentResult = 1011;
var Message_UpdateTreasure = 1012;
var Message_UpdateExperience = 1013;
var Message_UpdateItem = 1014;
var Message_UpdateInventoryCapacity = 1015;
var Message_QuestUpdate = 1016;
var Message_NewChat = 1017;
var Message_OnEnterBackground = 1018;
var Message_OnEnterForeground = 1019;
var Message_UpdateFriend = 1020;
var Message_UpdateMercenaryList = 1021;
var Message_NewSystemDeliver = 1022;
var Message_NewFriendInvite = 1023;
var Message_AccountLoginSuccess = 1024;
var Message_LoadReady = 1025;
var Message_StartTutorial = 1026;
var Message_UpdateVIPLevel = 1027;
var Message_About2Reboot = 1028;
var Message_ResetDungeon = 1029;
var Message_UpdateDailyQuest = 1030;
var Message_UpdateBounty = 1031;
var Message_UpdateEnergy = 1032;
var Message_GetMonthCard = 1033;

var LOAD_MENU = 0;
var LOAD_DUNGEON = 1;
var openScened = false;

/*** Easy Functions ***/
function calcPosInGrid(grid)
{
    var x = Math.floor(grid%DG_LEVELWIDTH);
    var y = Math.floor(grid/DG_LEVELWIDTH);
    return cc.p(x*LO_GRID + LO_GRID/2, -y*LO_GRID - LO_GRID/2);
}

function queryColor(index)
{
    return cc.c3b(COLOR_HAIR[index][0], COLOR_HAIR[index][1], COLOR_HAIR[index][2]);
}

function pLerp(x, y, a)
{
    if( a <= 0 )
    {
        return x;
    }
    else if( a >= 1 )
    {
        return y;
    }
    else
    {
        var ret = cc.p(0, 0);
        ret.x = (1-a)* x.x + a* y.x;
        ret.y = (1-a)* x.y + a* y.y;
        return ret;
    }
}

function isNearGrid(pos1, pos2)
{
    var x1 = Math.floor(pos1%DG_LEVELWIDTH);
    var y1 = Math.floor(pos1/DG_LEVELWIDTH);
    var x2 = Math.floor(pos2%DG_LEVELWIDTH);
    var y2 = Math.floor(pos2/DG_LEVELWIDTH);
    var dx = Math.abs(x1 - x2);
    var dy = Math.abs(y1 - y2);
    if( dx + dy <= 1 )
    {
        return true;
    }
    else
    {
        return false;
    }
}