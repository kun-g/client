/**
 * User: hammer
 * Date: 13-12-23
 * Time: 下午3:43
 */

var libUIC = loadModule("UIComposer.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");
var libTable = loadModule("table.js");
var libEffect = loadModule("effect.js");

var MODE_DAILYPRIZE = 0;
var MODE_DAILYQUEST = 1;
var MODE_DAILYEXIT = 2;

var theLayer;
var theLayerMode = null;

//contants
var theScal = 1;
var GRID_SIZE = UI_ITEM_SIZE * theScal;
var GRID_GAP = UI_ITEM_GAP + 12;
var LINE_COUNT = 4;
var MARGIN_TOP = 30;
var MARGIN_BUTTOM = 70;
var lineOffset = 52;

var theCenter = {};
var theDay = 0;

var animTag = 100;

var prizeIconList = ["dailyprize-common-lq.png",
    "dailyprize-common-light.png",
    "dailyprize-common-vip1.png"];

var prizePosXList = [];

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
    else if( theLayerMode == MODE_DAILYQUEST ){
        debug("runAnimationsForSequenceNamed(stand)");
        theLayer.NODE.animationManager.runAnimationsForSequenceNamed("stand");
    }
}

function getDailyPrize(id){
    libUIKit.waitRPC(Request_GetDailyPrize, null, function(rsp){
        if( rsp.RET == RET_OK )
        {
            engine.user.activity.dailyPrize = false;
            //成功后改变奖励图标
            var prizeData = libTable.queryTable(TABLE_DAILYPRIZE, id);
            var prize = [];
            if (prizeData.prize.length == 2 && prizeData.prize[1].vip <= engine.user.actor.vip){
                prize = prizeData.prize;
            }
            else{
                prize[0] = prizeData.prize[0];
            }
            loadModule("itemInfo.js").showOpenEffect(prize);

            var nowtime = new Date();
            var curDays = dayNumOfMonth(nowtime.getFullYear(),nowtime.getMonth());
            var getDay = +theDay + 1;
            theLayer.owner.labDay.setString("累计签到" + getDay + "天");
            //根据day和curDays设置contentScroller
            setNormalPrize(theCenter,theDay,curDays);
        }
    }, theLayer);
}

function onDailyPrizeActivate(){
}

function calcPosId(lpos)
{
    var rpos = cc.p(lpos.x, theCenter.theGridLayer.getContentSize().height - lpos.y);
    var PY = Math.floor((rpos.y - MARGIN_TOP)/(GRID_SIZE+GRID_GAP));

    var PX = LINE_COUNT;
    for (var k in prizePosXList){
        if (rpos.x <= prizePosXList[k] + 100 && rpos.x >= prizePosXList[k]){
            PX = k;
            break;
        }
    }
    //debug("touchPosBeginWorld = "+JSON.stringify(touchPosBeginWorld));
    //debug("rpos = "+JSON.stringify(rpos));
    var PYoff = rpos.y - MARGIN_TOP - PY*(GRID_SIZE+GRID_GAP);
    var PXoff = rpos.x - PX*(GRID_SIZE+GRID_GAP) - GRID_SIZE/2 - lineOffset;
    if( PXoff < 100 && PYoff < 100 )
    {
        var ret = +PX + PY*LINE_COUNT;
        if( PX >= LINE_COUNT || ret >= theCenter.inventorySize )
        {
            ret = -1;
        }
        return ret;
    }
    else
    {
        return -1;
    }
}

function onTouchBegan(touch, event)
{
    touchPosBeginWorld = touch.getLocation();
    var localPos = theCenter.contentScroller.convertToNodeSpace(touchPosBeginWorld);
    var localSize = theCenter.contentScroller.getViewSize();
    if( localPos.x >= 0 && localPos.y >= 0
        && localPos.x <= localSize.width
        && localPos.y <= localSize.height ) return true;
    else return false;
}

function onTouchMoved(touch, event)
{
    //theCenter.theScrollBar.updateScrollBar();
}

function onTouchEnded(touch, event)
{
    var pos = touch.getLocation();
    var dis = cc.pSub(pos, touchPosBeginWorld);
    if( cc.pLengthSQ(dis) < CLICK_RANGESQ )
    {//as click
        var localPos = theCenter.theGridLayer.convertToNodeSpace(touchPosBeginWorld);
        var id = calcPosId(localPos);
        //debug("id = "+id);
        if (theDay == id && engine.user.activity.dailyPrize == true){
            var item = theCenter.inventoryData[id];
            if( item != null ) {
                cc.AudioEngine.getInstance().playEffect("card2.mp3");
                //向服务器发送消息，若成功改变奖励图标
                getDailyPrize(id);
            }
        }
    }
}

function setNormalPrize(group,day,curDays){
    var sfc = cc.SpriteFrameCache.getInstance();
    //set size
    group.itemList = [];
    group.theGridLayer.removeAllChildren();
    group.inventoryData = [];
    setPrizeSize(group,day,curDays);

    var curroffset = group.contentScroller.getContentOffset();
    curroffset.y = group.contentScroller.minContainerOffset().y;
    group.contentScroller.setContentOffset(curroffset);
}

function setPrizeSize(group,day,curDays)
{
    //update inventory size
    var sfc = cc.SpriteFrameCache.getInstance();
    var lineCount = Math.ceil(curDays/LINE_COUNT);
    group.theGridLayer.setContentSize(cc.size((LINE_COUNT-1)*(GRID_SIZE+GRID_GAP) + GRID_SIZE,
            MARGIN_TOP+MARGIN_BUTTOM+lineCount*(GRID_SIZE+GRID_GAP)));

    group.theGridLayer.removeAllChildren();
    group.itemList = [];
    group.inventorySize = curDays;

    for(var k = 0; k<group.inventorySize; ++k) {
        //cal pos
        var PX = Math.floor(k%LINE_COUNT);
        var PY = Math.floor(k/LINE_COUNT);
        var pos = cc.p(PX*(GRID_SIZE+GRID_GAP)+GRID_SIZE/2 + lineOffset, MARGIN_TOP+PY*(GRID_GAP+GRID_SIZE)+GRID_SIZE/2);
        pos.y = group.theGridLayer.getContentSize().height - pos.y;//reverse
        if (k < LINE_COUNT){
            prizePosXList[k] = pos.x - 30;
        }
        //set item bg light
        if (k == day && engine.user.activity.dailyPrize == true){
            var iconBgLight = cc.Sprite.createWithSpriteFrame(sfc.getSpriteFrame(prizeIconList[1]));
            iconBgLight.setPosition(pos);
            group.theGridLayer.addChild(iconBgLight);
            var rotate = cc.RotateBy.create(1, 120);
            var repeat = cc.RepeatForever.create(rotate);
            iconBgLight.runAction(repeat);
        }
        //add slot
        var slot = libItem.UIItem.create(null, true, "itembg2.png");
        slot.setTag(k);
        slot.setPosition(pos);
        slot.setScale(theScal);
        if (k == day){
            slot.showFrame();
        }
        group.theGridLayer.addChild(slot);
        group.itemList[k] = slot;
        //set item
        var prizeData = libTable.queryTable(TABLE_DAILYPRIZE, k);
        var prize = libItem.queryPrize(prizeData.prize[0], true);
        prize.icon.setPosition(pos);
        prize.icon.setScale(theScal);
        group.theGridLayer.addChild(prize.icon);
        //set get flag
        if (k < day){
            var iconGet = cc.Sprite.createWithSpriteFrame(sfc.getSpriteFrame(prizeIconList[0]));
            iconGet.setPosition(pos);
            group.theGridLayer.addChild(iconGet);
        }
        else if (k == day && engine.user.activity.dailyPrize == false){
            var iconGet = cc.Sprite.createWithSpriteFrame(sfc.getSpriteFrame(prizeIconList[0]));
            iconGet.setPosition(pos);
            group.theGridLayer.addChild(iconGet);
        }
        //set vip
        if (prizeData.prize.length == 2 && prizeData.prize[1].vip >= 1){
            var iconVip = cc.Sprite.createWithSpriteFrame(sfc.getSpriteFrame("dailyprize-common-vip"+prizeData.prize[1].vip+".png"));
            iconVip.setAnchorPoint(cc.p(1, 0));
            iconVip.setPosition(pos);
            group.theGridLayer.addChild(iconVip);
        }
        group.inventoryData[k] = prize;
    }
}

function showDailyPrize(day){
    debug("showDailyPrize("+day+")");
    theLayer = engine.ui.newLayer({
        onActivate: onDailyPrizeActivate
    });
    theDay = day;
    theLayerMode = MODE_DAILYPRIZE;
    var mask = blackMask();
    theLayer.addChild(mask);

    theLayer.owner = {};
    theLayer.owner.onClose = onClose;
    theLayer.NODE = libUIC.loadUI(theLayer, "sceneDailyprize.ccbi", {
        nodeContent: {
            ui: "UIScrollView",
            id: "contentScroller",
            dir: 1
        }
    });
    theLayer.NODE.setPosition(cc.p(0, 0));
    theLayer.addChild(theLayer.NODE);

    theLayer.NODE.animationManager.setCompletedAnimationCallback(theLayer, onDailyAnimationCompleted);
    theLayer.NODE.animationManager.runAnimationsForSequenceNamed("open");

    engine.ui.regMenu(theLayer.owner.menuRoot);

    var nowtime = new Date();
    var curDays = dayNumOfMonth(nowtime.getFullYear(),nowtime.getMonth());

    theLayer.owner.labelMonth.setString(nowtime.getMonth() + 1);

    if (engine.user.activity.dailyPrize == true){
        theLayer.owner.labDay.setString("累计签到" + day + "天");
    }
    else{
        var getDay = +day + 1;
        theLayer.owner.labDay.setString("累计签到" + getDay + "天");
    }

    theCenter.theGridLayer = cc.Layer.create();

    theCenter.contentScroller = theLayer.ui.contentScroller;
    theCenter.contentScroller.setContainer(theCenter.theGridLayer);
    theCenter.theGridLayer.onTouchBegan = onTouchBegan;
    theCenter.theGridLayer.onTouchMoved = onTouchMoved;
    theCenter.theGridLayer.onTouchEnded = onTouchEnded;
    theCenter.theGridLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theCenter.theGridLayer.setTouchPriority(1);
    theCenter.theGridLayer.setTouchEnabled(true);
    //根据day和curDays设置contentScroller
    setNormalPrize(theCenter,theDay,curDays);

    engine.ui.regMenu(theCenter.theGridLayer);
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
    cacheSprite("dailymission-common-btnstart1.png");
    cacheSprite("dailymission-common-btnstart2.png");

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
        //layer.owner["num"+(s+1)].setVisible(dailyQuest.step == s);
    }
    //prize
    var pit = libItem.queryPrize(dailyQuest.prize[0]);
    pit.icon.setAnchorPoint(cc.p(0.5, 0.5));
    pit.icon.setPosition(cc.p(0, 0));
    layer.owner.nodePrize.addChild(pit.icon);
    layer.owner.labPrize.setString(pit.label);
    layer.owner.layerDesc.removeAllChildren();
    layer.owner.layerPrize.removeAllChildren();
    layer.owner.labTitle.setString("");
    //quest & buttons
    if( dailyQuest.step < 4 ){
        layer.owner.nodeComplete.setVisible(false);
        var fileIndex = "dailymission-common-"+(dailyQuest.step+1)+".png";
        layer.owner.spIndex.setDisplayFrame(sfc.getSpriteFrame(fileIndex));
        var questData = libTable.queryTable(TABLE_QUEST, dailyQuest.quest);
        if( questData != null ){
            layer.owner.labTitle.setString(questData.title);
            //fill quest desc
            theQuest = engine.user.quest.Quests[dailyQuest.quest];
            theQuest.fixState();
            var dimension = cc.size(layer.owner.layerDesc.getContentSize().width, 0);
            var dimensionPrize = cc.size(layer.owner.layerPrize.getContentSize().width, 0);

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
                    align: cc.TEXT_ALIGNMENT_LEFT
                });
            }
            var size = text.getContentSize();

            var prize = libItem.ItemPreview.create(dailyQuest.curprize, dimensionPrize);

            prize.setPosition(cc.p(0, 0));
            layer.owner.layerPrize.addChild(prize);
            text.setPosition(cc.p(0, 0));
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
            theDQInvokeAction = DQINVOKE_NOTHING;
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