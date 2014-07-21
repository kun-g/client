/**
 * User: hammer
 * Date: 13-7-9
 * Time: 下午5:47
 */

//load libs
var libRole = loadModule("role.js");
var libQuest = loadModule("questInfo.js");
var libBounty = loadModule("sceneBounty.js");
var libUIC = loadModule("UIComposer.js");
var libChat = loadModule("chatInfo.js");
var libMessage = loadModule("MessageInfo.js");
var libEvent = loadModule("eventInfo.js");
var libPops = loadModule("pops.js");
var libEffect = loadModule("effect.js");
var libTutorial = loadModule("tutorialx.js");
var libUIKit = loadModule("uiKit.js");

//local constants
var ACTIVITY_GAP = 15;
var CHAT_STAY = 5;
var CHAT_FADE = 5;

var theMode;
var MODE_OPEN = 0;
var MODE_CLOSE = 1;
var CLOSE_CALLBACK = null;

//assigned variables
var theLayer;
var progressEnergy;
var labelEnergy;
var labelEnergyTimer;
var progressExp;
var labelExp;
var avatarRole;
var labelLevel;
var labelGold;
var labelDiamond;
var notifyMail;
var notifyMailNumber;
var notifyActivity;
var notifyActivityNumber;
var notifyQuest;
var notifyQuestNumber;

var roleExpCache;
var mailBadgeCache;
var questBadgeCache;
var activityBadgeCache;

function onEnter()
{
    engine.user.inventory.syncArmors();
    theLayer = this;

    if( !cc.AudioEngine.getInstance().isMusicPlaying() )
    {
        cc.AudioEngine.getInstance().playMusic("login.mp3", true);
    }

    //load sprite sheets
    var sfc = cc.SpriteFrameCache.getInstance();
    sfc.addSpriteFrames("index.plist");

    theLayer.owner = {};
    //register button events
    theLayer.owner.onOption = onOption;
    theLayer.owner.onCharge = onCharge;
    theLayer.owner.onQuest = onQuest;
    theLayer.owner.onActivity = onActivity;
    theLayer.owner.onMail = onMail;
    theLayer.owner.onChat = onChat;
    theLayer.owner.onInventory = onInventory;
    theLayer.owner.onForge = onForge;
    theLayer.owner.onFriend = onFriend;
    theLayer.owner.onShop = onShop;
    theLayer.owner.onDress = onDress;
    theLayer.owner.onRole = onRole;
    theLayer.owner.onStage = onStage;
    theLayer.owner.onRank = onRank;
    theLayer.owner.onDailyQuest = onDailyQuest;
    theLayer.owner.onDailyPrize = onDailyPrize;
    theLayer.owner.onBounty = onBounty;
    theLayer.owner.onPVP = onPVP;

    var node = libUIC.loadUI(theLayer, "sceneIndex.ccbi", {
        nodeEnergy:{
            ui: "UIProgress",
            id: "progressEnergy",
            length: 256,
            begin: "index-jl1.png",
            middle: "index-jl2.png",
            end: "index-jl3.png"
        },
        nodeExp:{
            ui: "UIProgress",
            id: "progressExp",
            length: 256,
            begin: "index-jy1.png",
            middle: "index-jy2.png",
            end: "index-jy3.png"
        },
        nodeRole:{
            ui: "UIAvatar",
            id: "avatarRole"
        }
    });

    theLayer.node = node;
    theLayer.node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    theLayer.addChild(node);
    startOpenAnimation();
    //register menu root
    engine.ui.regMenu(theLayer.owner.menuRoot);
    engine.ui.regMenu(theLayer.owner.menuUp);
    engine.ui.regMenu(theLayer.owner.menuDown);
    engine.ui.regMenu(theLayer.owner.menuStage);

    //assign variables
    progressEnergy = theLayer.ui.progressEnergy;
    labelEnergy = theLayer.owner.labelEnergy;
    labelEnergyTimer = theLayer.owner.labelEnergyTimer;
    progressExp = theLayer.ui.progressExp;
    labelExp = theLayer.owner.labelExp;
    avatarRole = theLayer.ui.avatarRole;
    labelLevel = theLayer.owner.labelLevel;
    labelGold = theLayer.owner.labelGold;
    labelDiamond = theLayer.owner.labelDiamond;
    notifyMail = theLayer.owner.spnMail;
    notifyMailNumber = theLayer.owner.notifyMail;
    notifyActivity = theLayer.owner.spnActivity;
    notifyActivityNumber = theLayer.owner.notifyActivity;
    notifyQuest = theLayer.owner.spnQuest;
    notifyQuestNumber = theLayer.owner.notifyQuest;

    //function ON/OFF
//    theLayer.owner.btnPVP.setEnabled(false);

    //set stage button
    //-添加职业徽记
    var roleData = loadModule("table.js").queryTable(TABLE_ROLE, engine.user.actor.ClassId);
    var emblem = roleData.emblem[0];

    var normal = cc.Sprite.createWithSpriteFrameName("index-btn-fight1.png");
    theLayer.nodeTeam1 = cc.Node.create();
    normal.addChild(theLayer.nodeTeam1);
    {
        debug("EMBLEM = "+emblem);//test
        var spEmblem1 = cc.Sprite.create(emblem);
        spEmblem1.setScale(0.5);
        spEmblem1.setPosition(cc.p(normal.getContentSize().width/2, normal.getContentSize().height/2+10));
        normal.addChild(spEmblem1);
    }
    var selected = cc.Sprite.createWithSpriteFrameName("index-btn-fight1.png");
    theLayer.nodeTeam2 = cc.Node.create();
    selected.addChild(theLayer.nodeTeam2);
    {
        var spEmblem2 = cc.Sprite.create(emblem);
        spEmblem2.setScale(0.5);
        spEmblem2.setPosition(cc.p(selected.getContentSize().width/2, selected.getContentSize().height/2+10));
        selected.addChild(spEmblem2);
    }
    var sshadow = cc.Sprite.createWithSpriteFrameName("index-btn-fight2.png");
    sshadow.setPosition(cc.p(selected.getContentSize().width/2, selected.getContentSize().height/2));
    selected.addChild(sshadow);
    var menuItem = cc.MenuItemSprite.create(normal, selected, theLayer.owner.onStage, theLayer);
    menuItem.setPosition(cc.p(0, 0));
    theLayer.owner.menuStage.addChild(menuItem);

    //-show & hide vip
    if( engine.user.actor.vip != null && engine.user.actor.vip > 0 ){
        theLayer.owner.nodeVip.setVisible(true);
        var file = "vipicon"+engine.user.actor.vip+".png";
        var sp = cc.Sprite.create(file);
        sp.setPosition(cc.p(0, 0));
        theLayer.owner.iconVip.addChild(sp);
    }

    theLayer.activityOffset = 0;
    theLayer.activities = [];
    //set values
    labelGold.setString(engine.user.inventory.Gold);
    labelDiamond.setString(engine.user.inventory.Diamond);
    avatarRole.setRole(engine.user.actor);
    notifyMail.setVisible(false);
    notifyActivity.setVisible(false);
    notifyQuest.setVisible(false);
    updateEnergy();
    updateExperience();
    updateTeam();

    updateQuestBadge();
    updateMessageBadge();
    updateActivityBadge();

    this.update = update;
    this.scheduleUpdate();

    //attach effects
    if( engine.user.inventory.checkUpgradable()
        || engine.user.inventory.checkEnhancable()
        || engine.user.inventory.checkForgable() ){
        libEffect.attachEffectCCBI(theLayer.owner.tipUpgrade, cc.p(0, 0), "tips-forge.ccbi", libEffect.EFFECTMODE_LOOP);
    }

    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);

    updateBattlePower();

    //report power to GameCenter Leaderboard
    if (engine.game.getConfig().binary_channel == "AppStore") {
        gamecenter.reportScore(engine.user.actor.getPower(), "Hero_Power_Leaderboard");
    }

    //getMonthCard();
}

function onExit()
{
    loadModule("broadcastx.js").instance.close();
    theLayer = null;
}

function onActivate(){
    engine.pop.setAllAndInvoke("main");
    if( theMode == MODE_CLOSE ){
        startOpenAnimation();
    }
}

function onDeactivate(){
}

function onNotify(ntf)
{
    switch(ntf.NTF)
    {
        case Message_UpdateTreasure:
        {
            labelGold.setString(engine.user.inventory.Gold);
            labelDiamond.setString(engine.user.inventory.Diamond);
            return false;
        }
        case Message_UpdateExperience:
        {
            updateExperience();
            updateBattlePower();
            engine.pop.invokePop();
            return false;
        }
        case Message_UpdateVIPLevel:
        {
            //-show & hide vip
            if( engine.user.actor.vip != null && engine.user.actor.vip > 0 ){
                theLayer.owner.nodeVip.setVisible(true);
                var file = "vipicon"+engine.user.actor.vip+".png";
                var sp = cc.Sprite.create(file);
                sp.setPosition(cc.p(0, 0));
                theLayer.owner.iconVip.removeAllChildren();
                theLayer.owner.iconVip.addChild(sp);
            }
            return false;
        }
        case Message_UpdateEnergy:
        {
            updateEnergy();
            return false;
        }
    }
}

function updateExperience()
{
    var data = engine.user.actor.calcExp();
    labelExp.setString(data.now+"/"+data.total);
    var rate = data.now/data.total;
    if( rate > 1 )
    {
        rate = 1;
    }
    progressExp.setProgress(rate);
    labelLevel.setString("Lv."+data.level);
    roleExpCache = engine.user.actor.Experience;
}

function updateEnergy()
{
    labelEnergy.setString(engine.user.player.Energy+"/100");
    var rate = engine.user.player.Energy/100;
    if( rate > 1 )
    {
        rate = 1;
    }
    progressEnergy.setProgress(rate);
}

function updateTeam()
{
}
                                                                                                                  
function updateQuestBadge(){
    var count = engine.user.quest.getQuestListCount();
    if( count > 0 ){
        notifyQuest.setVisible(true);
        notifyQuestNumber.setString(count);
    }
    else{
        notifyQuest.setVisible(false);
    }
    questBadgeCache = count;
}

function updateMessageBadge(){
    var count = engine.session.MessageCount;
    if( count > 0 ){
        notifyMail.setVisible(true);
        notifyMailNumber.setString(count);
    }
    else{
        notifyMail.setVisible(false);
    }
    mailBadgeCache = count;
}

function updateActivityBadge(){
    var count = engine.user.activity.list.length;
    if( count > 0 ){
        notifyActivity.setVisible(true);
        notifyActivityNumber.setString(count);
    }
    else{
        notifyActivity.setVisible(false);
    }
    activityBadgeCache = count;
}

function update(delta)
{
    //running energy clock
    var oldEnergy = engine.user.player.Energy;
    engine.user.player.updateEnergy();
    if( oldEnergy != engine.user.player.Energy )
    {
        updateEnergy();
    }
    //update energy count down
    if( engine.user.player.Energy < 100 ){
        labelEnergyTimer.setVisible(true);
        var ecd = engine.user.player.energyCountdown()/1000;
        var min = Math.floor(ecd/60);
        var sec = Math.floor(ecd%60);
        var ssec = sec < 10 ? ("0"+sec) : (""+sec);
        var strCD = min+":"+ssec;
        labelEnergyTimer.setString(strCD);
    }
    else{
        labelEnergyTimer.setVisible(false);
    }

    //check exp
    var newExp = engine.user.actor.Experience;
    if( newExp != roleExpCache ){
        updateExperience();
    }
    //check badges
    if( engine.user.quest.CompleteCount != questBadgeCache ){
        updateQuestBadge();
    }
    if( engine.session.MessageCount != mailBadgeCache ){
        updateMessageBadge();
    }
    if( engine.user.activity.list.length != activityBadgeCache ){
        updateActivityBadge();
    }
}

function onOption(sender)
{
    startCloseAnimation(function(){
        loadModule("settings.js").show();
    });
}

function onCharge(sender)
{
    startCloseAnimation(function(){
        loadModule("uiChargeDiamond.js").node();
    });
}

function onQuest(sender)
{
    startCloseAnimation(function(){
        libQuest.show();
    });
}

function onActivity(sender)
{
    startCloseAnimation(function(){
        libEvent.show();
    });
}

function onMail(sender)
{
    startCloseAnimation(function(){
        libMessage.show();
    });
}

function onChat(sender)
{
    startCloseAnimation(function(){
        libChat.show();
    });
//    libPops.setLevelUpAnimation(engine.user.actor.calcExp().level - 1);
//    libPops.invokePopLevelUp();
}

function onStage(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    startCloseAnimation(function(){

//        var flag_testStage = system.getPreference("flag_debug");
//        if( flag_testStage != null && flag_testStage == "1" ){
//            var flag_stgId = Number(system.getPreference("flag_stgId"));
//            loadModule("sceneStage.js").startStage(flag_stgId, 3, 0);
//            return;
//        }
//        loadModule("sceneStage.js").startStage(133, 3, 0); return;

        //强制进某一关
        if( engine.user.player.Tutorial != null ){
            var tutorialStage = engine.user.player.Tutorial;
            var tc = loadModule("table.js").readTable(TABLE_TUTORIAL_CONFIG);
            if( tc.tutorialTriggers != null
                && tc.tutorialTriggers[tutorialStage] != null ){
                var trigger = tc.tutorialTriggers[tutorialStage];
                if( trigger.powerLimit != null ){
                    engine.user.actor.fix();
                    if( engine.user.actor.getPower() < trigger.powerLimit ){
                        if( trigger.refuseDialogue != null ){
                            engine.dialogue.startDialogue(trigger.refuseDialogue);
                        }
                        return;
                    }
                }
                if( trigger.stage != null ){
                    requestBattle(tc.tutorialTriggers[tutorialStage].stage, [engine.user.actor]);
                    return;
                }
            }
        }
        engine.ui.newScene(loadModule("sceneStage.js").scene());
    });
}

function onInventory(sender)
{
    startCloseAnimation(function(){
        engine.ui.newScene(loadModule("sceneInventory.js").scene());
    });
}

function onForge(sender)
{
    if( engine.user.player.checkUnlock("upgrade") ){
        startCloseAnimation(function(){
            engine.ui.newScene(loadModule("sceneForge.js").scene());
        });
    }
}

function onFriend(sender)
{
    if( engine.user.player.checkUnlock("friend") ){
        startCloseAnimation(function(){
            engine.ui.newScene(loadModule("sceneFriend.js").scene());
        });
    }
}

function onShop(sender)
{
    startCloseAnimation(function(){
        engine.ui.newScene(loadModule("sceneShop.js").scene());
    });
}

function onPVP(sender)
{
    startCloseAnimation(function(){
        engine.ui.newScene(loadModule("scenePVP.js").scene());
    });
}

function onDress(sender)
{
    engine.ui.newScene(loadModule("sceneDress.js").scene());
}

function onRank(sender)
{
    engine.ui.newScene(loadModule("sceneRank.js").scene());
}

function onDailyQuest(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( engine.user.player.checkUnlock("dailyQuest") ){
        cc.AudioEngine.getInstance().playEffect("card2.mp3");
        loadModule("activity.js").popDailyQuest();
    }
}

function onDailyPrize(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    loadModule("activity.js").showDailyPrize(engine.user.activity.dailyPrizeDay);
}

function startOpenAnimation(){
    if( theLayer != null ){
        theLayer.node.animationManager.runAnimationsForSequenceNamed("open");
        theMode = MODE_OPEN;
    }
}

function startCloseAnimation(func){
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
    theMode = MODE_CLOSE;
    CLOSE_CALLBACK = func;
}

function onUIAnimationCompleted(name){
    if( theMode == MODE_CLOSE && CLOSE_CALLBACK != null ){
        CLOSE_CALLBACK();
    }
}

function onRole(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    loadModule("sceneRole.js").show(engine.user.actor);
}

function updateBattlePower(){
    theLayer.owner.labPower.setString(engine.user.actor.getPower());
}

function onBounty(){
    startCloseAnimation(function(){
        libBounty.show();
    });
}

function scene()
{
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onNotify,
        onActivate: onActivate,
        onDeactivate: onDeactivate
    };
}

exports.scene = scene;