/**
 * User: hammer
 * Date: 13-11-24
 * Time: 上午11:49
 */

var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libQuest = loadModule("quest.js");
var libItem = loadModule("xitem.js");

var theLayer;
var theListLayer;
var theDescLayer;
var theQuest;

var MODE_LIST = 0;
var MODE_DESC = 1;
var MODE_EXIT = 2;

var theMode;

var touchPosBegin;

//contants
var LINE_WIDTH = 570;
var LINE_HEIGHT = 120;

function onTouchBegan(touch, event){
    touchPosBegin = touch.getLocation();
    return true;
}

function onTouchMoved(touch, event){

}

function onTouchEnded(touch, event){
    var pos = touch.getLocation();
    var dis = cc.pSub(pos, touchPosBegin);
    if( cc.pLengthSQ(dis) < CLICK_RANGESQ ){
        var localPos = theListLayer.convertToNodeSpace(touchPosBegin);
        var size = theListLayer.getContentSize();
        if( localPos.x >0 && localPos.y >0
            && localPos.x < size.width && localPos.y < size.height ){
            var PY = Math.floor((size.height - localPos.y)/LINE_HEIGHT);
            var line = theListLayer.getChildByTag(PY);
            loadQuestDesc(line.quest);
        }
    }
}

function onTouchCancelled(touch, event){
    onTouchEnded(touch, event);
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theMode = MODE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function onBack(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    loadQuestList();
}

function onSubmit(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libUIKit.waitRPC(Request_SubmitQuest, {
        qid: theQuest.QuestId
    }, function(rsp){
        if( rsp.RET == RET_OK ){
            var QuestData = libTable.queryTable(TABLE_QUEST, theQuest.QuestId);
            delete engine.user.quest.Quests[theQuest.QuestId];
            engine.user.quest.CompleteCount--;
            loadQuestList();

            //统计
            tdga.questComplete("Q"+QuestData.questId);

            if( QuestData.endDialogue != null ){
                engine.dialogue.startDialogue(QuestData.endDialogue);
            }
        }
        else{
            libUIKit.showErrorMessage(rsp);
        }
    }, theLayer);
}

function loadQuestList(){
    theMode = MODE_LIST;
    theLayer.owner.nodeList.setVisible(true);
    theLayer.owner.nodeDesc.setVisible(false);
    theListLayer.removeAllChildren();
    theListLayer.setTouchEnabled(true);
    theLayer.ui.buttonBack.setVisible(false);
    theLayer.ui.buttonSubmit.setVisible(false);

    var size = cc.size(LINE_WIDTH, engine.user.quest.Count*LINE_HEIGHT);
    theListLayer.setContentSize(size);
    if( engine.user.quest.Count == 0 ){
        var label = cc.LabelTTF.create("暂无任务", UI_FONT, UI_SIZE_XL);
        var viewSize = theLayer.ui.scrollList.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, -viewSize.height/3));
        theListLayer.addChild(label);
    }
    else{
        var count = 0;
        var list = engine.user.quest.getQuestList();
        for(var k in list){
            var quest = list[k];
            var owner = {};
            var line = cc.BuilderReader.load("ui-mail.ccbi", owner);
            var questData = libTable.queryTable(TABLE_QUEST, quest.QuestId);
            owner.labTitle.setString(questData.title);
//            if( quest.fixState() ){
//                owner.spComplete.setVisible(true);
//            }
//            else{
//                owner.spComplete.setVisible(false);
//            }
            line.setPosition(cc.p(0, size.height - count*LINE_HEIGHT - LINE_HEIGHT));
            line.quest = quest;
            line.setTag(count);
            theListLayer.addChild(line);

            count++;
        }
    }

    var curroffset = theLayer.ui.scrollList.getContentOffset();
    curroffset.y = theLayer.ui.scrollList.minContainerOffset().y;
    theLayer.ui.scrollList.setContentOffset(curroffset);
}

function loadQuestDesc(quest){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    theMode = MODE_DESC;
    theLayer.owner.nodeList.setVisible(false);
    theLayer.owner.nodeDesc.setVisible(true);
    theDescLayer.removeAllChildren();
    theListLayer.setTouchEnabled(false);
    theLayer.ui.buttonBack.setVisible(true);
    theLayer.ui.buttonSubmit.setVisible(true);

    theQuest = quest;
    theQuest.fixState();
    var questData = libTable.queryTable(TABLE_QUEST, quest.QuestId);
    var dimension = cc.size(theLayer.owner.layerDesc.getContentSize().width, 0);

    theLayer.owner.labTitle.setString(questData.title);

    var text = DCTextArea.create();
    text.setDimension(dimension);
    text.pushText({//push desc
        text: /*"    "+*/questData.desc,
        size: UI_SIZE_L
    });
    text.pushText({text: "  "});
    text.pushText({//push objectives
        text: "任务目标",
        color: cc.c3b(236, 199, 101),
        size: UI_SIZE_XL
    });
    text.pushText({text: "  "});
    for(var k in questData.objects){
        var tar = questData.objects[k];
        var cnt = quest.Count[k];
        if( cnt == null ){
            cnt = 0;
        }

        var color = cc.c3b(255, 255, 255);
        if( cnt >= tar.count ){
            cnt = tar.count;
            color = cc.c3b(95, 187, 38);
        }
        var str = /*"    "+*/tar.label + "    "+cnt+"/"+tar.count;

        text.pushText({//push title
            text: str,
            color: color,
            size: UI_SIZE_L
        });
    }
    text.pushText({text: "  "});
    text.pushText({//push title
        text: "任务奖励",
        color: cc.c3b(236, 199, 101),
        size: UI_SIZE_XL
    });
    text.pushText({text: "  "});
    var size = text.getContentSize();

    var prize = libItem.ItemPreview.create(questData.prize, dimension);
    prize.setPosition(cc.p(0, 0));
    theDescLayer.addChild(prize);
    text.setPosition(cc.p(0, prize.getContentSize().height));
    theDescLayer.addChild(text);
    size.height += prize.getContentSize().height;

    theDescLayer.setContentSize(size);
    if( theQuest.State == QUESTSTATUS_COMPLETE ){
        theLayer.ui.buttonSubmit.setEnabled(true);
    }
    else{
        theLayer.ui.buttonSubmit.setEnabled(false);
    }

    var curroffset = theLayer.ui.scrollDesc.getContentOffset();
    curroffset.y = theLayer.ui.scrollDesc.minContainerOffset().y;
    theLayer.ui.scrollDesc.setContentOffset(curroffset);
}

function onUIAnimationCompleted(name){
    if( theMode == MODE_EXIT ){
        engine.ui.popLayer();
        engine.pop.invokePop();
    }
}

function onNotify(event){
    switch(event.NTF){
//        case Message_UpdateTreasure:
//        {
//            theLayer.ui.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
//            return true;
//        }
        case Message_QuestUpdate:
        {
            if( theMode == MODE_LIST ){
                loadQuestList();
            }
            return true;
        }
    }
    return false;
}

function onEnter(){
    theLayer = this;

    var mask = blackMask();
    this.addChild(mask);

    this.owner = {};
    this.owner.onClose = onClose;
    this.owner.onBack = onBack;
    this.owner.onSubmit = onSubmit;

    this.node = libUIC.loadUI(this, "sceneMission.ccbi", {
        layerList: {
            ui: "UIScrollView",
            id: "scrollList",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        layerDesc: {
            ui: "UIScrollView",
            id: "scrollDesc",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        btnBack: {
            ui: "UIButtonL",
            id: "buttonBack",
            menu: "menuRoot",
            label: "buttontext-back.png",
            func: onBack
        },
        btnSubmit: {
            ui: "UIButtonL",
            id: "buttonSubmit",
            menu: "menuRoot",
            label: "buttontext-lqjl.png",
            func: onSubmit,
            type: BUTTONTYPE_DEFAULT
        }
    });
    this.addChild(this.node);
    theMode = MODE_LIST;
    this.node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    this.node.animationManager.runAnimationsForSequenceNamed("open");

    this.owner.nodeList.setVisible(false);
    this.owner.nodeDesc.setVisible(false);
    this.ui.buttonBack.setVisible(false);
    this.ui.buttonSubmit.setVisible(false);

    //theLayer.ui.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);

    theListLayer = cc.Layer.create();
    this.ui.scrollList.setContainer(theListLayer);
    theDescLayer = cc.Layer.create();
    this.ui.scrollDesc.setContainer(theDescLayer);

    theListLayer.onTouchBegan = onTouchBegan;
    theListLayer.onTouchMoved = onTouchMoved;
    theListLayer.onTouchEnded = onTouchEnded;
    theListLayer.onTouchCancelled = onTouchCancelled;
    theListLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theListLayer.setTouchPriority(1);
    theListLayer.setTouchEnabled(false);

    engine.ui.regMenu(this.owner.menuRoot);

    loadQuestList();
}

function show(){
    engine.ui.newLayer({
        onNotify: onNotify,
        onEnter: onEnter
    });
}

exports.show = show;

//--- Quest Complete Popup ---
var theCompletedQuests;
var theQCLayer;

function onQCSubmit(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libUIKit.waitRPC(Request_SubmitQuest, {
        qid: theQCLayer.QID
    }, function(rsp){
        if( rsp.RET == RET_OK ){
            var QuestData = libTable.queryTable(TABLE_QUEST, theQCLayer.QID);
            delete engine.user.quest.Quests[theQCLayer.QID];
            engine.user.quest.CompleteCount--;

            //统计
            tdga.questComplete("Q"+QuestData.questId);

            theQCLayer.node.runAction(actionPopOut(function(){
                engine.ui.removeLayer(theQCLayer);
                if( QuestData != null && QuestData.endDialogue != null ){
                    engine.dialogue.startDialogue(QuestData.endDialogue);
                }
                else{
                    engine.pop.invokePop();
                }
            }));
        }
        else{
            libUIKit.showErrorMessage(rsp);

            theQCLayer.node.runAction(actionPopOut(function(){
                engine.ui.removeLayer(theQCLayer);
                engine.pop.invokePop();
            }));
        }
    }, theQCLayer);
}

function onQCClose(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    theQCLayer.node.runAction(actionPopOut(function(){
        engine.ui.removeLayer(theQCLayer);
    }));
}

var QCMODE_NORMAL = 0;
var QCMODE_DAILY = 1;

function showQuestComplete(qid, mode, prz){
    engine.user.quest.Quests[qid].Poped = true;
    var questData = libTable.queryTable(TABLE_QUEST, qid);

    if( mode == null ) mode = QCMODE_NORMAL;
    if( mode == QCMODE_NORMAL ){
        var filename = "ui-questdone.ccbi";
        var submit = {
            ui: "UIButtonL",
            id: "btnSubmit",
            menu: "menuRoot",
            label: "buttontext-lqjl.png",
            func: onQCSubmit,
            type: BUTTONTYPE_DEFAULT
        };
        var pdata = questData.prize;
    }
    else{
        var filename = "ui-questdone2.ccbi";
        var submit = {
            ui: "UIButtonL",
            id: "btnSubmit",
            menu: "menuRoot",
            label: "buttontext-confirm.png",
            func: onQCClose,
            type: BUTTONTYPE_DEFAULT
        };
        var pdata = prz;
    }

    theQCLayer = engine.ui.newLayer();
    var mask = blackMask();
    theQCLayer.addChild(mask);
    theQCLayer.owner = {};
    theQCLayer.node = libUIC.loadUI(theQCLayer, filename, {
       nodeSubmit:submit
    });
    var winSize = cc.Director.getInstance().getWinSize();
    theQCLayer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    theQCLayer.addChild(theQCLayer.node);
    engine.ui.regMenu(theQCLayer.owner.menuRoot);

    //set panel data
    theQCLayer.owner.labelTitle.setString(questData.title);
    var prize = libItem.ItemPreview.create(pdata);
    var size = prize.getContentSize();
    prize.setPosition(cc.p(-size.width/2, -size.height/2));
    theQCLayer.owner.nodePrize.addChild(prize);

    theQCLayer.node.setScale(0);
    theQCLayer.node.runAction(actionPopIn());
    theQCLayer.QID = qid;
}

function invokeQuestPop(){
    if( theCompletedQuests != null
        && theCompletedQuests.length > 0 ){
        var qstId = theCompletedQuests.shift();
        showQuestComplete(qstId);
    }
}

function checkQuestPop(){
    var ret = false;
    theCompletedQuests = [];
    var list = engine.user.quest.getQuestList();
    for(var k in list){
        var qst = list[k];
        if( qst.fixState() && !qst.Poped ){
            theCompletedQuests.push(k);
            ret = true;
        }
    }
    invokeQuestPop();
    return ret;
}

exports.checkQuestPop = checkQuestPop;
exports.showQuestComplete = showQuestComplete;
exports.QCMODE_NORMAL = QCMODE_NORMAL;
exports.QCMODE_DAILY = QCMODE_DAILY;
