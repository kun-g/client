/**
 * Created by tringame on 14-4-23.
 */
var libUIC = loadModule("UIComposer.js");
var libBounty = loadModule("bountyx.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");

var theLayer;
var theListLayer;
var theDescLayer;
var theBounty;
var thePy;
var theTime;
var theLevel = 0;

var MODE_LIST = 0;
var MODE_DESC = 1;
var MODE_EXIT = 2;

var theMode;

var touchPosBegin;

//contants
var LINE_WIDTH = 570;
var LINE_HEIGHT = 180;

var loadList = [
    "bounty-jjjsbg.png",
    "bounty-jjkqbg.png",
    "bounty-yjjsbg.png",
    "bounty-yjwcbg.png",
    "bounty-zzjxbg.png"
];

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
            thePy = PY;
            var line = theListLayer.getChildByTag(PY);
            //debug("PY = " + PY);
            loadBountyDesc(line.bounty);
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
    loadBountyList();
}

function onSubmit(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var line = theListLayer.getChildByTag(thePy);
    var libTable = loadModule("table.js");
    var libStage = loadModule("sceneStage.js");
    var bountyData = libTable.queryTable(TABLE_BOUNTY, line.bounty.BountyId);
    var stageData = queryStage(bountyData.level[theLevel].stage);
    libStage.startStage(bountyData.level[theLevel].stage, stageData.team, stageData.cost);
}

function onSimple(sender){
    if (theMode == MODE_DESC && thePy != undefined){
        var line = theListLayer.getChildByTag(thePy);
        loadBountyDesc(line.bounty, 0);
        theLevel = 0;
    }
}

function onNormal(sender){
    if (theMode == MODE_DESC && thePy != undefined){
        var line = theListLayer.getChildByTag(thePy);
        loadBountyDesc(line.bounty, 1);
        theLevel = 1;
    }
}

function onHard(sender){
    if (theMode == MODE_DESC && thePy != undefined){
        var line = theListLayer.getChildByTag(thePy);
        loadBountyDesc(line.bounty, 2);
        theLevel = 2;
    }
}

function loadBountyList(){
    theMode = MODE_LIST;
    theLayer.owner.nodeList.setVisible(true);
    theLayer.owner.nodeDesc.setVisible(false);
    theListLayer.removeAllChildren();
    theListLayer.setTouchEnabled(true);
    theLayer.owner.btnBack.setVisible(false);
    theLayer.owner.btnSubmit.setVisible(false);

    //debug("UPM = "+JSON.stringify(engine.user));

    var bountyCount = engine.user.bounty.getBountyListCount();//
    var sfc = cc.SpriteFrameCache.getInstance();

    var size = cc.size(LINE_WIDTH, bountyCount*LINE_HEIGHT);//engine.user.bounty.Count
    theListLayer.setContentSize(size);

    if(  bountyCount== 0 ){//engine.user.bounty.Count
        var label = cc.LabelTTF.create("暂无任务", UI_FONT, UI_SIZE_XL);
        var viewSize = theLayer.ui.scrollList.getViewSize();
        label.setPosition(cc.p(viewSize.width/2, -viewSize.height/3));
        theListLayer.addChild(label);
    }
    else{
        var count = 0;
        var list = engine.user.bounty.getBountyList();
        for(var k in list){
            var bounty = list[k];
            var owner = {};
            var line = cc.BuilderReader.load("ui-bounty.ccbi", owner);
            var bountyData = libTable.queryTable(TABLE_BOUNTY, bounty.BountyId);
            var segmentSel = engine.user.bounty.getProcess(bounty.BountyId);
            var timediff = engine.user.bounty.cacultime(bounty.BountyId,segmentSel);
            var chkProcess = engine.user.bounty.checkProcess(bounty.BountyId,segmentSel);

            if (chkProcess >= 0 && chkProcess < loadList.length / 2){
                owner.nodeProcbg.setDisplayFrame(sfc.getSpriteFrame(loadList[chkProcess]));
            }
            debug("loadBountyList 152:bounty = "+JSON.stringify(bountyData));
            owner.labPower.setString(timediff);
            if (bountyData.titlePic != undefined){
                owner.nodeTitle.setDisplayFrame(sfc.getSpriteFrame(bountyData.titlePic));
            }
            if (bountyData.timePic != undefined){
                owner.nodeTime.setDisplayFrame(sfc.getSpriteFrame(bountyData.timePic));
            }
            if (engine.user.bounty.dataBounty[k] != undefined &&
                engine.user.bounty.dataBounty[k].cnt != undefined){
                owner.labelRemain.setString(engine.user.bounty.dataBounty[k].cnt);
            }
//            if( bounty.fixState() ){timePic
//                owner.spComplete.setVisible(true);
//            }
//            else{
//                owner.spComplete.setVisible(false);
//            }
            line.owner = owner;
            line.setPosition(cc.p(0, size.height - count*LINE_HEIGHT - LINE_HEIGHT));
            line.bounty = bounty;
            line.setTag(count);

            if (engine.user.bounty.dataBounty[k] == undefined || engine.user.bounty.dataBounty[k].sta == 1){
                theListLayer.addChild(line);
            }

            count++;
        }
    }

    var curroffset = theLayer.ui.scrollList.getContentOffset();
    curroffset.y = theLayer.ui.scrollList.minContainerOffset().y;
    theLayer.ui.scrollList.setContentOffset(curroffset);
}

function loadBountyDesc(bounty, lev){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    theMode = MODE_DESC;
    theLayer.owner.nodeList.setVisible(false);
    theLayer.owner.nodeDesc.setVisible(true);
    theDescLayer.removeAllChildren();
    theListLayer.setTouchEnabled(false);
    theLayer.owner.btnBack.setVisible(true);
    theLayer.owner.btnSubmit.setVisible(true);

    theBounty = bounty;
    //theBounty.fixState();
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bounty.BountyId);
    var dimension = cc.size(theLayer.owner.layerDesc.getContentSize().width, 0);

    theLayer.owner.labTitle.setString(bountyData.title);

    //debug("bountyData.level.length = " + bountyData.level.length);
    if (bountyData.level.length == 1){
        theLayer.owner.btnSimple.setVisible(false);
        theLayer.owner.btnNormal.setVisible(false);
        theLayer.owner.btnHard.setVisible(false);
//        theLayer.owner.nodeSimple.setVisible(false);
//        theLayer.owner.nodeNormal.setVisible(false);
//        theLayer.owner.nodeHard.setVisible(false);
        //debug("level btn and node set false");
    }
    else{
        theLayer.owner.btnSimple.setVisible(true);
        theLayer.owner.btnNormal.setVisible(true);
        theLayer.owner.btnHard.setVisible(true);
//        theLayer.owner.nodeSimple.setVisible(true);
//        theLayer.owner.nodeNormal.setVisible(true);
//        theLayer.owner.nodeHard.setVisible(true);
        //debug("level btn and node set true");
        if (engine.user.bounty.checkLimit(bounty.BountyId, 1).length <= 0){
            theLayer.owner.btnNormal.setEnabled(true);
        }
        else{
            theLayer.owner.btnNormal.setEnabled(false);
        }
        if (engine.user.bounty.checkLimit(bounty.BountyId, 2).length <= 0){
            theLayer.owner.btnHard.setEnabled(true);
        }
        else{
            theLayer.owner.btnHard.setEnabled(false);
        }
    }

    if (bountyData.begin == 1){
        theLayer.owner.btnSubmit.setVisible(true);
    }
    else{
        theLayer.owner.btnSubmit.setVisible(false);
    }

    var text = DCTextArea.create();
    text.setDimension(dimension);
    text.pushText({//push desc
        text: /*"    "+*/bountyData.desc,
        size: UI_SIZE_L
    });
    text.pushText({text: "  "});
    text.pushText({//push objectives
        text: "任务目标",
        color: cc.c3b(236, 199, 101),
        size: UI_SIZE_XL
    });
    text.pushText({text: "  "});
    for(var k in bountyData.objects){
        var tar = bountyData.objects[k];
        var cnt = 0;
        if( cnt == null ){
            cnt = 0;
        }

        var color = cc.c3b(255, 255, 255);
        if( cnt >= tar.count ){
            cnt = tar.count;
            color = cc.c3b(95, 187, 38);
        }
        var str = /*"    "+*/tar.label;

        text.pushText({//push title
            text: str,
            color: color,
            size: UI_SIZE_L
        });
    }

    if (lev == undefined){
        lev = 0;
    }
    var tar = bountyData.level[lev];
    
    text.pushText({text: "  "});
    text.pushText({//push objectives
        text: "任务要求",
        color: cc.c3b(236, 199, 101),
        size: UI_SIZE_XL
    });
    var limitFlag = false;
    if (tar.levelLimit != undefined){
        text.pushText({//push desc
            text: "要求等级"+tar.levelLimit+"以上。",
            size: UI_SIZE_L
        });
        limitFlag = true;
    }
    if (tar.powerLimit != undefined){
        text.pushText({//push desc
            text: "要求战力"+tar.powerLimit+"以上。",
            size: UI_SIZE_L
        });
        limitFlag = true;
    }
    if (tar.classLimit != undefined && tar.classLimit.length >= 1){
        var str = "";
        for (var k in tar.classLimit) {
            //debug("k = " + k);
            //debug("tar.classLimit[k] = " + tar.classLimit[k]);
            switch (tar.classLimit[k]) {
                case 0:
                    str += "战士、";
                    break;
                case 1:
                    str += "法师、";
                    break;
                case 2:
                    str += "牧师、";
                    break;

            }
        }
        debug("str = " + str);
        str=str.substring(0,str.length-1);
        str += "职业可以做。";
        text.pushText({//push desc
            text: str,
            size: UI_SIZE_L
        });
        limitFlag = true;
    }
    if (limitFlag == false){
        text.pushText({//push desc
            text: "无。",
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

    var prize = libItem.ItemPreview.create(tar.prize, dimension);

    if (engine.user.bounty.dataBounty[k] != undefined &&
        engine.user.bounty.dataBounty[k].lev != undefined &&
        engine.user.bounty.dataBounty[k].lev[lev] != undefined &&
        engine.user.bounty.dataBounty[k].lev[lev].prz != undefined){
        prize = libItem.ItemPreview.create(engine.user.bounty.dataBounty[k].lev[lev].prz, dimension);
    }

    prize.setPosition(cc.p(0, 0));
    theDescLayer.addChild(prize);
    text.setPosition(cc.p(0, prize.getContentSize().height));
    theDescLayer.addChild(text);
    size.height += prize.getContentSize().height;

    theDescLayer.setContentSize(size);

    var curroffset = theLayer.ui.scrollDesc.getContentOffset();
    curroffset.y = theLayer.ui.scrollDesc.minContainerOffset().y;
    theLayer.ui.scrollDesc.setContentOffset(curroffset);
}

function onUIAnimationCompleted(name){
    if( theMode == MODE_EXIT ){
        engine.ui.popLayer();
    }
}

function onNotify(event){
    switch(event.NTF){
//        case Message_UpdateBounty:
//        {
//            dataBounty[event.arg.bid] = event.arg;
//            break;
//        }
    }
    return false;
}

function onActivate(){
}

function update(delta)
{
    var comTime = new Date();
    var diffMin = comTime.getMinutes() - theTime.getMinutes();
    //var diffSec = comTime.getSeconds() - theTime.getSeconds();

    if(Math.abs(diffMin) >= 1){
        updateTime();
        //debug("sceneBounty update");
        theTime = comTime;
    }
}

function updateTime()
{
    if (theMode == MODE_LIST) {
        var sfc = cc.SpriteFrameCache.getInstance();
        var bountyCount = engine.user.bounty.getBountyListCount();
        if (bountyCount > 0) {
            var list = engine.user.bounty.getBountyList();
            for (var k in list) {
                var bounty = list[k];
                var line = theListLayer.getChildByTag(k);
                var bountyData = libTable.queryTable(TABLE_BOUNTY, bounty.BountyId);
                var segmentSel = engine.user.bounty.getProcess(bounty.BountyId);
                var timediff = engine.user.bounty.cacultime(bounty.BountyId, segmentSel);
                var chkProcess = engine.user.bounty.checkProcess(bounty.BountyId, segmentSel);
                //setDisplayFrame(sfc.getSpriteFrame(loadList[chkProcess*2]));
                if (chkProcess >= 0 && chkProcess < loadList.length / 2) {
                    line.owner.nodeProcbg.setDisplayFrame(sfc.getSpriteFrame(loadList[chkProcess]));
                }
                line.owner.labPower.setString(timediff);
                if (bountyData.titlePic != undefined){
                    line.owner.nodeTitle.setDisplayFrame(sfc.getSpriteFrame(bountyData.titlePic));
                }
                if (bountyData.timePic != undefined){
                    line.owner.nodeTime.setDisplayFrame(sfc.getSpriteFrame(bountyData.timePic));
                }
            }
        }
    }
}

function onEnter(){
    //load resource
//    for(var k in loadList){
//        var file = loadList[k];
//        cacheSprite(file);
//    }

    theLayer = this;

    var mask = blackMask();
    this.addChild(mask);

    this.owner = {};
    this.owner.onClose = onClose;
    this.owner.onBack = onBack;
    this.owner.onSubmit = onSubmit;
    this.owner.onSimple = onSimple;
    this.owner.onNormal = onNormal;
    this.owner.onHard = onHard;
    this.update = update;

    this.node = libUIC.loadUI(this, "sceneBounty.ccbi", {
        layerList: {
            ui: "UIScrollView",
            id: "scrollList",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        },
        layerDesc: {
            ui: "UIScrollView",
            id: "scrollDesc",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        }
    });
    this.addChild(this.node);

    theMode = MODE_LIST;
    this.node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    this.node.animationManager.runAnimationsForSequenceNamed("open");

    this.owner.nodeList.setVisible(false);
    this.owner.nodeDesc.setVisible(false);
    this.owner.btnBack.setVisible(false);
    this.owner.btnSubmit.setVisible(false);

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

    this.scheduleUpdate();
    theTime = new Date();

    engine.ui.regMenu(this.owner.menuRoot);

    loadBountyList();

}

function show(){
    engine.ui.newLayer({
        onNotify: onNotify,
        onEnter: onEnter,
        onActivate: onActivate
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
                                                            }));
                     }
                     else{
                     libUIKit.showErrorMessage(rsp);
                     
                     theQCLayer.node.runAction(actionPopOut(function(){
                                                            engine.ui.removeLayer(theQCLayer);
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