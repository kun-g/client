/**
 * User: hammer
 * Date: 13-7-8
 * Time: 下午5:34
 */

var ui = loadModule("UIComposer.js");

var synTotal = 0;
var synCount = 0;

var role = loadModule("role.js");

var loginSucessInvokes = {};
function pushLoginSuccessInvoke(key, obj, func, args){
    loginSucessInvokes[key] = {
        OBJ: obj,
        FUNC: func,
        ARGS: args
    };
}
function removeLoginSucessInvoke(key){
    delete loginSucessInvokes[key];
}
function processLoginSucessInvokes(){
    isGameLoggedIn = true;
    for(var k in loginSucessInvokes){
        var ivk = loginSucessInvokes[k];
        ivk.FUNC.apply(ivk.OBJ, ivk.ARGS);
    }
    loginSucessInvokes = {};
}

function syncEvent(event, key){
    if( event.arg.clr )
    {
        engine.user.setSyncId(key, event.arg.syn);
        synCount++;
        if( synCount == synTotal )
        {
            engine.user.saveProfile();

            var event = {};
            event.NTF = Message_SyncEnd;
            event.arg = {};
            event.arg.count = synCount;
            event.arg.total = synTotal;
            engine.event.processNotification(event);
        }
        else if( synCount < synTotal )
        {
            var event = {};
            event.NTF = Message_SyncUpdate;
            event.arg = {};
            event.arg.count = synCount;
            event.arg.total = synTotal;
            engine.event.processNotification(event);
        }
    }
}

function onEvent(event)
{
    //default actions
    switch(event.NTF)
    {
        case Message_AccountLoginSuccess:
        {
            processLoginSucessInvokes();

            engine.user.initProfile(event.arg.usr);

            //sync time
            engine.game.syncServerTime(event.arg.svt);
            engine.event.setPassport(event.arg.pid);
            engine.event.setRuntimeId(event.arg.rid);
            engine.session.zoneId = event.arg.sid;

            //analytics
            tdga.setAccountId(event.arg.usr);
            tdga.setGameServer(""+event.arg.sid);

            //replay log
            if( file.exist("replay.log") ){
                debug("*** REPLAY LOG DETECTED ***");
                var log = JSON.parse(file.read("replay.log"));
                engine.box.replay(log);
                debug("*** REPLAY OVER ***");
            }
            //check if any ddump exist
            if( engine.user.ddump != null ){
                var resetFlag = engine.box.load(engine.user.ddump);
                engine.event.holdNotifications();
                engine.box.process({
                    CNF: Request_GameStartDungeon
                });
                if( resetFlag ){
                    engine.event.processNotification(Message_ResetDungeon);
                    //dump battle state
                    engine.user.setData("ddump", engine.box.save());
                    engine.user.saveProfile();
                }

                engine.ui.newScene(loadModule("sceneDungeon.js").scene());
                //engine.event.processNotification(Message_LoadReady, LOAD_DUNGEON);
            }
            else if( event.arg.tut != null ){
                debug("TUT = "+event.arg.tut);
                engine.user.player.Tutorial = event.arg.tut;
                engine.event.processNotification(Message_StartTutorial, event.arg.tut);
            }
            return true;
        }
        case Event_DungeonEnter:
        {
            var dungeon = {};
            dungeon.stage = event.arg.lvl;
            dungeon.party = [];

            //set party
            for(var k in event.arg.pat){
                var m = new role.Role(event.arg.pat[k]);
                m.fix();
                dungeon.party.push(m);
            }

            engine.user.setData("dungeon", dungeon);

            //*** BLACK BOX ***
            var param = {};
            param.stage = engine.user.dungeon.stage;
            param.difficulty = 0;
            param.team = [];
            for(var k in engine.user.dungeon.party)
            {
                var ro = engine.user.dungeon.party[k];
                var t = {};
                t.nam = ro.Name;
                t.gen = ro.Gender;
                t.cid = ro.ClassId;
                t.lev = ro.Level;
                t.hst = ro.HairStyle;
                t.hcl = ro.HairColor;
                t.xp = 0;
                param.team.push(t);
            }
            engine.box.start(param);

            engine.event.holdNotifications();
            engine.event.processNotification(event);
            engine.ui.newScene(loadModule("sceneDungeon.js").scene());

            return true;
        }
        case Event_SynCheck:
        {
            var toSync = [];
            for(var k in event.arg)
            {
                var local = engine.user.SYNC[CACHE_SHORT[k]];
                var remote = event.arg[k];
                debug("SYNC("+k+") local("+local+") - remote("+remote+")");
                if( local != remote )
                {
                    toSync.push(k);
                }
            }
            if( toSync.length > 0 )
            {//start syncData
                synTotal = toSync.length;
                synCount = 0;
                debug("同步请求 = "+JSON.stringify(toSync));
                engine.event.sendNTFEvent(Request_SyncData, toSync);

                var event = {};
                event.NTF = Message_SyncBegin;
                event.arg = {};
                event.arg.count = synCount;
                event.arg.total = synTotal;
                engine.event.processNotification(event);
            }
            else
            {//send syncEnd event directly
                debug("没有数据需要同步！");
                var event = {};
                event.NTF = Message_SyncEnd;
                event.arg = {};
                event.arg.count = 0;
                event.arg.total = 0;
                engine.event.processNotification(event);
            }
            return true;
        }
            /*** UPDATE DATA FUNCTIONS ***/
        case Event_EnergyUpdate:
        {
            engine.user.player.setEnergy(event.arg.eng, event.arg.tim);
            //debug("Energy Update! = "+engine.user.player.Energy);
            return true;
        }
        case Event_ExpUpdate:
        {
            if( engine.user.actor == null )
            {
                var ro = new role.Role();
                engine.user.setData("actor", ro);
            }
            engine.user.actor.Experience = event.arg.exp;

            return true;
        }
        case Event_InventoryUpdate:
        {
            debug("BEGIN UPDATE INVENTORY");
            engine.user.inventory.update(event);

            syncEvent(event, CACHE_INVENTORY);
            return true;
        }
        case Event_RoleUpdate:
        {
            // update role data
            if( engine.user.actor == null ){
                var ro = new role.Role(event.arg.act);
                engine.user.setData("actor", ro, event.arg.syn);
            }
            else{
                engine.user.actor.update(event.arg);
            }

            syncEvent(event, CACHE_ACTOR);
            return true;
        }
        case Event_StageUpdate:
        {
            engine.user.stage.update(event, false);

            syncEvent(event, CACHE_STAGE);
            return true;
        }
        case Event_DungeonUpdate:
        {
            // TODO left
            syncEvent(event, CACHE_DUNGEON);
            return true;
        }
        case Event_QuestUpdate:
        {
            engine.user.quest.update(event, false);

            syncEvent(event, CACHE_QUEST);
            return true;
        }
        case Event_FriendUpdate:
        {
            engine.user.friend.update(event);

            //cache role info
            if( event.arg.fri != null ){
                engine.session.cacheRoleInfo(event.arg.fri);
            }

            //syncEvent(event);
            return true;
        }
        case Event_ChatMessage:
        {
            if( event.arg.typ == 3 ){
                engine.session.whisper.recv(event.arg);
            }
            engine.session.pushChat(event.arg);
            return true;
        }
        case Event_DungeonReward:
        {
            var result = loadModule("sceneResult.js");
            result.setResult(event.arg);
            return true;
        }
        case Event_StoreList:
        {
            engine.session.set("shop", event.arg);

            return true;
        }
        case Event_StageMercenaryList:
        {
            debug("UPDATE MERCENARY LIST = \n"+JSON.stringify(event));
            for(var k=0; k<2; ++k)
            {
                var r = new role.Role(event.arg[k]);
                r.fix();
                engine.session.team[k] = r;
            }
            engine.event.processNotification(Message_UpdateMercenaryList);
            return true;
        }
        case Event_FriendApply:
        {
            engine.session.pushFriendApply(event.arg);
            engine.event.processNotification(Message_NewFriendInvite);
            return true;
        }
        case Event_ActivityUpdate:
        {
            engine.user.activity.list = event.arg.act;

            event.arg.clr = true;
            syncEvent(event, CACHE_ACTIVITY);
            return true;
        }
        case Event_SystemDeliver:
        {
            var deliver = event.arg;
            if( deliver.typ == 0 ){
                deliver.tit = "组队战斗奖励";
                deliver.txt = "你的英雄和别人组队厮杀打拼。又挣到了一些奖励⋯⋯";
            }
            engine.session.pushSystemDeliver(deliver);
            engine.event.processNotification(Message_NewSystemDeliver);
            return true;
        }
        case Event_ActivityDailyPrize:
        {
            engine.user.activity.dailyPrize = event.claim;
            engine.user.activity.dailyPrizeDay = event.day;
            if( event.claim === true ){
                loadModule("activity.js").pushActivity(event);
                engine.pop.invokePop();
            }
            return true;
        }
        case Event_Reconnect:
        {
            system.alert("重新登陆",ErrorMsgs[event.err], null, function(){
                reboot();
            }, "重新连接");
            return true;
        }
        case Event_TutorialInfo:
        {
            debug("** TutorialInfo = "+JSON.stringify(event.arg));//test
            //trigger tutorial
            if( engine.user.player.Tutorial != null
                && engine.user.player.Tutorial != event.arg.tut ){
                var tc = loadModule("table.js").readTable(TABLE_TUTORIAL_CONFIG);
                if( tc.tutorialTriggers != null
                    && tc.tutorialTriggers[event.arg.tut] != null
                    && tc.tutorialTriggers[event.arg.tut].tutorial != null ){
                    loadModule("tutorialx.js").invokeTutorial(tc.tutorialTriggers[event.arg.tut].tutorial);
                }
            }
            engine.user.player.Tutorial = event.arg.tut;
            return true;
        }
        case Event_RequestFailed:
        {
            engine.msg.pop(event.arg.msg, POPTYPE_WARN);
            return true;
        }
        case Event_PlayerInfo:
        {
            engine.user.player.RMB = event.arg.rmb;
            engine.user.actor.vip = event.arg.vip;
            engine.user.player.AID = event.arg.aid;
            engine.event.processNotification(Message_UpdateVIPLevel);
            return true;
        }
        case Event_Broadcast:
        {
            loadModule("broadcastx.js").instance.pushBroadcast(event.arg);
            return true;
        }
        case Event_ABTestSeed:
        {
            engine.session.ABTestSeed = +event.arg.ab;
            return true;
        }
        case Event_UpdateDailyQuest:
        {
            loadModule("activity.js").updateDailyQuest(event);
            return true;
        }
        case Event_UpdatePlayerFlags:
        {
            engine.user.player.Flags = event.arg;
            return true;
        }
        case Event_BountyUpdate:
        {
            engine.session.dataBounty[event.arg.bid] = event.arg;

            var event = {};
            event.NTF = Message_UpdateBounty;
            engine.event.processNotification(event);
            return true;
        }
    }

    if( event.NTF < 1000 ){
        warn("unprocessed message:\n"+JSON.stringify(event));
    }
    return true;
}

function getDungeonFlag()
{
    return dungeonFlag;
}

exports.onEvent = onEvent;
exports.getDungeonFlag = getDungeonFlag;
exports.pushLoginSuccessInvoke = pushLoginSuccessInvoke;
exports.removeLoginSucessInvoke = removeLoginSucessInvoke;
