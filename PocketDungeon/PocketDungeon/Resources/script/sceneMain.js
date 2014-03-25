/**
 * User: hammer
 * Date: 13-7-9
 * Time: 下午5:47
 */

//load libs
var libRole = loadModule("role.js");
var libQuest = loadModule("questInfo.js");
var libUIC = loadModule("UIComposer.js");
var libChat = loadModule("chatInfo.js");
var libMessage = loadModule("MessageInfo.js");
var libEvent = loadModule("eventInfo.js");
var libPops = loadModule("pops.js");
var libEffect = loadModule("effect.js");
var libTutorial = loadModule("tutorial.js");

//local constants
var ACTIVITY_GAP = 15;
var CHAT_STAY = 5;
var CHAT_FADE = 5;

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
var textChat;
var nodeActivities;
var nodeStage;

var roleExpCache;
var mailBadgeCache;
var questBadgeCache;

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

    var node = libUIC.loadUI(theLayer, "sceneIndex.ccbi", {
        nodeEnergy:{
            ui: "UIProgress",
            id: "progressEnergy",
            length: 246,
            begin: "index-jl1.png",
            middle: "index-jl2.png",
            end: "index-jl3.png"
        },
        nodeExp:{
            ui: "UIProgress",
            id: "progressExp",
            length: 246,
            begin: "index-jy1.png",
            middle: "index-jy2.png",
            end: "index-jy3.png"
        },
        nodeRole:{
            ui: "UIAvatar",
            id: "avatarRole"
        },
        frameChat:{
            ui: "UITextArea",
            id: "textChat"
        }
    });

    theLayer.addChild(node);
    //register menu root
    engine.ui.regMenu(theLayer.owner.menuRoot);

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
    textChat = theLayer.ui.textChat;
    nodeActivities = theLayer.owner.nodeActivity;
    nodeStage = theLayer.owner.nodeStage;

    textChat.setFontSize(UI_SIZE_S);
    //set stage button
    var normal = cc.Sprite.createWithSpriteFrameName("index-btn-fight1.png");
    theLayer.nodeTeam1 = cc.Node.create();
    normal.addChild(theLayer.nodeTeam1);
    var selected = cc.Sprite.createWithSpriteFrameName("index-btn-fight1.png");
    theLayer.nodeTeam2 = cc.Node.create();
    selected.addChild(theLayer.nodeTeam2);
    var sshadow = cc.Sprite.createWithSpriteFrameName("index-btn-fight2.png");
    sshadow.setPosition(cc.p(selected.getContentSize().width/2, selected.getContentSize().height/2));
    selected.addChild(sshadow);
    var menuItem = cc.MenuItemSprite.create(normal, selected, theLayer.owner.onStage, theLayer);
    menuItem.setPosition(theLayer.owner.nodeStage.getPosition());
    theLayer.owner.menuRoot.addChild(menuItem);
    //-添加职业徽记
    var roleData = loadModule("table.js").queryTable(TABLE_ROLE, engine.user.actor.ClassId);
    var emblem = roleData.emblem[0];
    var spEmblem = cc.Sprite.create(emblem);
    spEmblem.setScale(0.5);
    spEmblem.setPosition(cc.p(0, 0));
    nodeStage.addChild(spEmblem);

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

    this.update = update;
    this.scheduleUpdate();

    //attach effects
    if( engine.user.inventory.checkUpgradable() ){
        libEffect.attachEffectCCBI(theLayer.owner.tipUpgrade, cc.p(0, 0), "tips-forge.ccbi", libEffect.EFFECTMODE_LOOP);
    }

    //set daily activity
    addActivity("index-qdjl1.png", "index-qdjl2.png", function(sender){
        cc.AudioEngine.getInstance().playEffect("card2.mp3");
        loadModule("activity.js").showDailyPrize(engine.user.activity.dailyPrizeDay);
    }, "dailyPrize");

    if( engine.user.player.Flags.daily === true ){
        //add daily quest
        addActivity("index-mrrw1.png", "index-mrrw2.png", function(sender){
            cc.AudioEngine.getInstance().playEffect("card2.mp3");
            loadModule("activity.js").popDailyQuest();
        }, "dailyQuest");
    }

    //schedule pop
    engine.pop.setAllAndInvoke();

    //register broadcast
    loadModule("broadcast.js").instance.simpleInit(this);
}

function onExit()
{
    loadModule("broadcast.js").instance.close();
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
            engine.pop.invokePop();
            return false;
        }
        case Message_NewChat:
        {
            textChat.pushText(libChat.chatObject(ntf.arg));
            textChat.setOpacity(255);
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
        case Message_UpdateDailyQuest:
        {
            if( !hasActivity("dailyQuest") ){
                addActivity("index-mrrw1.png", "index-mrrw2.png", function(sender){
                    cc.AudioEngine.getInstance().playEffect("card2.mp3");
                    loadModule("activity.js").popDailyQuest();
                }, "dailyQuest");
            }
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
    var count = engine.user.quest.CompleteCount;
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
        var strCD = min+"m"+ssec+"s";
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
}

function onOption(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    loadModule("settings.js").show();
}

function onCharge(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    loadModule("uiChargeDiamond.js").node();
}

function onQuest(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libQuest.show();
}

function onActivity(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libEvent.show();
}

function onMail(sender)
{
    libMessage.show();
}

function onChat(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libChat.show();
}

function onStage(sender)
{
    //test code
    libTutorial.invokeTutorial(0);

    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    //engine.ui.newScene(loadModule("sceneStage.js").scene());
}

function onInventory(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    engine.ui.newScene(loadModule("sceneInventory.js").scene());
}

function onForge(sender)
{
    //cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( engine.user.player.Tutorial < 3 ){
        cc.AudioEngine.getInstance().playEffect("cancel.mp3");
        engine.dialogue.startDialogue(10);
    }
    else
    {
        engine.ui.newScene(loadModule("sceneForge.js").scene());
    }
}

function onFriend(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    engine.ui.newScene(loadModule("sceneFriend.js").scene());
}

function onShop(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    engine.ui.newScene(loadModule("sceneShop.js").scene());
}

function onDress(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    engine.ui.newScene(loadModule("sceneDress.js").scene());
}

function onRole(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    loadModule("sceneRole.js").show(engine.user.actor);
}

function onActivityTradeGold(sender)
{
    debug("onTradeGold");
}

function addActivity(img1, img2, callback, key)
{
    var sp1 = cc.Sprite.createWithSpriteFrameName(img1);
    var sp2 = cc.Sprite.createWithSpriteFrameName(img2);
    var menuItem = cc.MenuItemSprite.create(sp1, sp2, callback, theLayer);
    menuItem.setAnchorPoint(cc.p(1, 0.5));
    var pos = theLayer.owner.nodeActivity.getPosition();
    pos.x -= theLayer.activityOffset;
    menuItem.setPosition(pos);
    theLayer.owner.menuRoot.addChild(menuItem);

    menuItem.KEY = key;
    theLayer.activities.push(menuItem);
    theLayer.activityOffset += menuItem.getContentSize().width + ACTIVITY_GAP;
}

function hasActivity(key){
    for(var k in theLayer.activities)
    {
        var menuItem = theLayer.activities[k];
        if( menuItem.KEY === key )
        {
            return true;
        }
    }
    return false;
}

function removeActivity(key)
{
    var dx = 0;
    var offset = 0;
    for(var k in theLayer.activities)
    {
        var menuItem = theLayer.activities[k];
        if( menuItem.KEY === key )
        {
            dx = k;
            theLayer.activities.splice(k, 1);
            theLayer.activityOffset -= menuItem.getContentSize().width + ACTIVITY_GAP;
            break;
        }
    }
    for(var k=dx; k<theLayer.activities.length; ++k)
    {
        var menuItem = theLayer.activities[k];
        var pos = menuItem.getPosition();
        pos.x += offset;
        menuItem.setPosition(pos);
    }
}

function clearActivities()
{
    for(var k in theLayer.activities)
    {
        var menuItem = theLayer.activities[k];
        theLayer.owner.menuRoot.removeChild(menuItem);
    }
    theLayer.activities = [];
    theLayer.activityOffset = 0;
}

function scene()
{
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onNotify
    };
}

exports.scene = scene;