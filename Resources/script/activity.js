/**
 * User: hammer
 * Date: 13-12-23
 * Time: 下午3:43
 */

var libUIC = loadModule("UIComposer.js");
var libUIKit = loadModule("uiKit.js");

var MODE_DAILYPRIZE = 0;
var MODE_DAILYQUEST = 1;
var MODE_DAILYEXIT = 2;

var theLayer;
var theLayerMode = null;

//common used close function
function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theLayerMode = MODE_DAILYEXIT;
    theLayer.NODE.animationManager.runAnimationsForSequenceNamed("close");
}

function onDailyAnimationCompleted(name){
    if( theLayerMode == MODE_DAILYEXIT ){
        engine.ui.popLayer();
        theLayerMode = null;
    }
}

function onGetDailyPrize(sender){
    debug("ON GET PRIZE");
    libUIKit.waitRPC(Request_GetDailyPrize, null, function(rsp){
        if( rsp.RET == RET_OK )
        {
            engine.user.activity.dailyPrize = false;
        }
        theLayer.NODE.runAction(actionPopOut(function(){
            engine.ui.popLayer();
        }));
    }, theLayer);
}

function onDailyPrizeActivate(){
}

function showDailyPrize(day){
    debug("showDailyPrize("+day+")");
    theLayer = engine.ui.newLayer({
        onActivate: onDailyPrizeActivate
    });
    theLayerMode = MODE_DAILYPRIZE;
    var mask = blackMask();
    theLayer.addChild(mask);

    theLayer.owner = {};
    theLayer.owner.onGetDailyPrize = onGetDailyPrize;
    theLayer.owner.onClose = onClose;
    theLayer.NODE = cc.BuilderReader.load("sceneDailyprize.ccbi", theLayer.owner);
    theLayer.NODE.setPosition(cc.p(0, 0));
    theLayer.addChild(theLayer.NODE);

    theLayer.NODE.animationManager.setCompletedAnimationCallback(theLayer, onDailyAnimationCompleted);
    theLayer.NODE.animationManager.runAnimationsForSequenceNamed("open");

    if( !engine.user.activity.dailyPrize ){
        theLayer.owner.btnGet.setEnabled(false);
    }

    engine.ui.regMenu(theLayer.owner.menuRoot);

    switch(day){
        case 0:
        {
            theLayer.owner.pop1.setVisible(true);
            theLayer.owner.g1.setVisible(true);
            theLayer.owner.w2.setVisible(true);
            theLayer.owner.w3.setVisible(true);
            theLayer.owner.w4.setVisible(true);
            theLayer.owner.w5.setVisible(true);
        }break;
        case 1:
        {
            theLayer.owner.pop2.setVisible(true);
            theLayer.owner.y1.setVisible(true);
            theLayer.owner.g2.setVisible(true);
            theLayer.owner.w3.setVisible(true);
            theLayer.owner.w4.setVisible(true);
            theLayer.owner.w5.setVisible(true);
        }break;
        case 2:
        {
            theLayer.owner.pop3.setVisible(true);
            theLayer.owner.y1.setVisible(true);
            theLayer.owner.y2.setVisible(true);
            theLayer.owner.g3.setVisible(true);
            theLayer.owner.w4.setVisible(true);
            theLayer.owner.w5.setVisible(true);
        }break;
        case 3:
        {
            theLayer.owner.pop4.setVisible(true);
            theLayer.owner.y1.setVisible(true);
            theLayer.owner.y2.setVisible(true);
            theLayer.owner.y3.setVisible(true);
            theLayer.owner.g4.setVisible(true);
            theLayer.owner.w5.setVisible(true);
        }break;
        case 4:
        {
            theLayer.owner.pop5.setVisible(true);
            theLayer.owner.y1.setVisible(true);
            theLayer.owner.y2.setVisible(true);
            theLayer.owner.y3.setVisible(true);
            theLayer.owner.y4.setVisible(true);
            theLayer.owner.g5.setVisible(true);
        }break;
    }
}

//---------- activity --------------

var cachedActivities = [];

function processsActivity(event){
    switch(event.NTF){
        case Event_ActivityDailyPrize:
            showDailyPrize(event.day);
            break;
    }
}

function invokeActivity(){
    if( cachedActivities.length > 0 ){
        processsActivity(cachedActivities.shift());
        return true;
    }
    return false;
}

function pushActivity(event){
    cachedActivities.push(event);
}

exports.showDailyPrize = showDailyPrize;
exports.invokeActivity = invokeActivity;
exports.pushActivity = pushActivity;

//----------- daily quest --------------

var dailyQuestScheme = {
    stp: "step",
    prz: "prize",
    qst: "quest",
    cpz: "curprize"
};

var DQINVOKE_STARTQUEST = 0;
var DQINVOKE_GETPRIZE = 1;
var DQINVOKE_NOTHING = 2;
var theDQInvokeAction = DQINVOKE_NOTHING;

function updateDailyQuest(event){
    if( engine.user.activity.dailyQuest == null ){//default values
        engine.user.activity.dailyQuest = {
            step: 0,
            prize: null,
            quest: -1,
            curprize: null
        };
    }
    //apply changes
    debug("DAILY QUEST = "+JSON.stringify(event.arg));
    loadModule("util.js").applyScheme(engine.user.activity.dailyQuest, dailyQuestScheme, event.arg);
    //update ui now
    if( theLayerMode == MODE_DAILYQUEST ) refreshDailyQuest();

    engine.event.processNotification(Message_UpdateDailyQuest);
}

function queryStage(stg){
    var chapters = loadModule("table.js").readTable(TABLE_STAGE);
    for(var k in chapters){
        for(var m in chapters[k].stage){
            if( chapters[k].stage[m].stageId == stg ) return chapters[k].stage[m];
        }
    }
    return null;
}

function onInvokeDailyQuest(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    debug("INVOKE DAILY QUEST = "+theDQInvokeAction);
    if( theDQInvokeAction == DQINVOKE_GETPRIZE ){

        libUIKit.waitRPC(Request_SubmitDailyQuest, null
        , function(rsp){
            if( rsp.RET != RET_OK ){
                libUIKit.showErrorMessage(rsp);
            }
            else{
                var dailyQuest = engine.user.activity.dailyQuest;
                if( dailyQuest.step < 4 ){
                    var qst = loadModule("questInfo.js");
                    qst.showQuestComplete(dailyQuest.quest, qst.QCMODE_DAILY, dailyQuest.curprize);
                }
                else{
                    loadModule("itemInfo.js").showOpenEffect(dailyQuest.prize);
                }
            }
        }, theLayer);
    }
    else if( theDQInvokeAction == DQINVOKE_STARTQUEST ){

        var dailyQuest = engine.user.activity.dailyQuest;
        var libTable = loadModule("table.js");
        var libStage = loadModule("sceneStage.js");
        var questData = libTable.queryTable(TABLE_QUEST, dailyQuest.quest);
        var stageData = queryStage(questData.stage);
        libStage.startStage(questData.stage, stageData.team, stageData.cost);
    }
}

function refreshDailyQuest(){
    if( theLayerMode != MODE_DAILYQUEST ) return;
    var layer = theLayer;

    //set values
    var sfc = cc.SpriteFrameCache.getInstance();
    var libTable = loadModule("table.js");
    var libItem = loadModule("xitem.js");
    var dailyQuest = engine.user.activity.dailyQuest;
    //progress
    for(var s = 0; s<= 3; ++s ){
        var pk = "progress"+(s+1);
        if( dailyQuest.step >= s ){
            layer.owner[pk].setVisible(true);
        }
        else{
            layer.owner[pk].setVisible(false);
        }
    }
    //prize
    var pit = libItem.queryPrize(dailyQuest.prize[0]);
    pit.icon.setAnchorPoint(cc.p(0.5, 0.5));
    pit.icon.setPosition(cc.p(0, 0));
    layer.owner.nodePrize.addChild(pit.icon);
    layer.owner.labPrize.setString(pit.label);
    layer.owner.layerDesc.removeAllChildren();
    layer.owner.labTitle.setString("");
    //quest & buttons
    if( dailyQuest.step < 4 ){
        layer.owner.nodeComplete.setVisible(false);
        var questData = libTable.queryTable(TABLE_QUEST, dailyQuest.quest);
        if( questData != null ){
            layer.owner.labTitle.setString(questData.title);
            //fill quest desc
            theQuest = engine.user.quest.Quests[dailyQuest.quest];
            theQuest.fixState();
            var dimension = cc.size(layer.owner.layerDesc.getContentSize().width, 0);

            var text = DCTextArea.create();
            text.setDimension(dimension);
            for(var k in questData.objects){
                var tar = questData.objects[k];
                var cnt = theQuest.Count[k];
                if( cnt == null ){
                    cnt = 0;
                }

                var color = cc.c3b(0, 0, 0);
                if( cnt >= tar.count ){
                    cnt = tar.count;
                    color = cc.c3b(95, 187, 38);
                }
                var str = /*"    "+*/tar.label + "    "+cnt+"/"+tar.count;

                text.pushText({//push title
                    text: str,
                    color: color,
                    size: UI_SIZE_L,
                    align: cc.TEXT_ALIGNMENT_CENTER
                });
            }
            var size = text.getContentSize();

            var prize = libItem.ItemPreview.create(dailyQuest.curprize, dimension);
            prize.setPosition(cc.p(0, 0));
            var psz = prize.getContentSize();
            prize.setPosition(cc.p((dimension.width - psz.width)/2, 0));
            layer.owner.layerDesc.addChild(prize);
            text.setPosition(cc.p(0, prize.getContentSize().height));
            layer.owner.layerDesc.addChild(text);
            size.height += prize.getContentSize().height;

            layer.owner.btnGet.setEnabled(true);
            if( theQuest.State == QUESTSTATUS_COMPLETE ){
                layer.owner.btnGet.setNormalSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward1.png"));
                layer.owner.btnGet.setSelectedSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward2.png"));
                layer.owner.btnGet.setDisabledSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward2.png"));
                theDQInvokeAction = DQINVOKE_GETPRIZE;
            }
            else{
                layer.owner.btnGet.setNormalSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnstart1.png"));
                layer.owner.btnGet.setSelectedSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnstart2.png"));
                layer.owner.btnGet.setDisabledSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnstart2.png"));
                theDQInvokeAction = DQINVOKE_STARTQUEST;
            }
        }
        else{
            layer.owner.labTitle.setString("");
            layer.owner.nodeComplete.setVisible(true);
            layer.owner.labComplete.setString("暂时没有日常任务");
            layer.owner.btnGet.setNormalSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnstart1.png"));
            layer.owner.btnGet.setSelectedSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnstart2.png"));
            layer.owner.btnGet.setDisabledSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnstart2.png"));
            layer.owner.btnGet.setEnabled(false);
        }
    }
    else if( dailyQuest.step == 4 ){//take to prize
        layer.owner.nodeComplete.setVisible(true);
        layer.owner.labComplete.setString("你已经完成了今日任务，点击领取奖励。");
        //gather prize
        layer.owner.btnGet.setEnabled(true);
        layer.owner.btnGet.setNormalSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward1.png"));
        layer.owner.btnGet.setSelectedSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward2.png"));
        layer.owner.btnGet.setDisabledSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward2.png"));
        theDQInvokeAction = DQINVOKE_GETPRIZE;
    }
    else{//daily quest is done
        layer.owner.nodeComplete.setVisible(true);
        layer.owner.labComplete.setString("今天的任务已经结束了，请明天再来。");
        //gather prize & greyed out
        layer.owner.btnGet.setEnabled(false);
        layer.owner.btnGet.setNormalSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward1.png"));
        layer.owner.btnGet.setSelectedSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward2.png"));
        layer.owner.btnGet.setDisabledSpriteFrame(sfc.getSpriteFrame("dailymission-common-btnreward2.png"));
        theDQInvokeAction = DQINVOKE_NOTHING;
    }

    engine.ui.regMenu(layer.owner.menuRoot);
}

function onDailyQuestActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("dailyQuest");
}

function popDailyQuest(){
    var layer = engine.ui.newLayer({
        onActivate: onDailyQuestActivate
    });
    theLayer = layer;
    theLayerMode = MODE_DAILYQUEST;
    var mask = blackMask();
    layer.addChild(mask);

    layer.owner = {};
    layer.owner.onClose = onClose;
    layer.owner.onInvoke = onInvokeDailyQuest;
    layer.node = cc.BuilderReader.load("sceneDailymission.ccbi", layer.owner);
    layer.NODE = layer.node;//match close

    theLayer.NODE.animationManager.setCompletedAnimationCallback(theLayer, onDailyAnimationCompleted);
    theLayer.NODE.animationManager.runAnimationsForSequenceNamed("open");

    layer.node.setPosition(cc.p(0, 0));
    layer.addChild(layer.node);

    refreshDailyQuest();

    layer.setTouchEnabled(true);
}

exports.updateDailyQuest = updateDailyQuest;
exports.popDailyQuest = popDailyQuest;