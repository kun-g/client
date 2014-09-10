/**
 * Created by tringame on 14-4-23.
 */
var libUIC = loadModule("UIComposer.js");
var libBounty = loadModule("bountyx.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");
var libEffect = loadModule("effect.js");

var theLayer;
var theListLayer;
var theDescLayer;
var theDescLayer2;
var theBounty;
var thePy;
var theTime;
var theLevel = 0;
var thePrizeLayer = [];

var MODE_LIST = 0;
var MODE_DESC = 1;
var MODE_EXIT = 2;

var theOffset = 34;
var lockOffset = 25;
var effOffset = 43;

var theMode;
var theDesc = 0;

var touchPosBegin;

//contants
var LINE_WIDTH = 570;
var LINE_HEIGHT = 180;

var loadList = [
    "bounty-jjjsbg.png",//0 即将结束
    "bounty-jjkqbg.png",//1 即将开启
    "bounty-yjjsbg.png",//2 已经结束
    "bounty-yjwcbg.png",//3 已经完成
    "bounty-zzjxbg.png" //4 正在进行
];

var loadTextList = [
    "bounty-jjjs.png",//0 即将结束
    "bounty-jjkq.png",//1 即将开启
    "bounty-yjjs.png",//2 已经结束
    "bounty-yjwc.png",//3 已经完成
    "bounty-zzjx.png" //4 正在进行
];

var levelBtnList = [
    "bounty-btn-easy1.png",
    "bounty-btn-easy2.png",
    "bounty-btn-normal1.png",
    "bounty-btn-normal2.png",
    "bounty-btn-hard1.png",
    "bounty-btn-hard2.png",
    "bounty-btn-hell1.png",
    "bounty-btn-hell2.png",
    "bounty-btn-nightmare1.png",
    "bounty-btn-nightmare2.png"
];

var btnList = ["btnSimple","btnNormal","btnHard","btnHell","btnNightmare"];
var nodelockList = ["nodelockSim","nodelockNor","nodelockHar","nodelockHel","nodelockNig"];
var nodeEffList = ["nodeEffSim","nodeEffNor","nodeEffHar","nodeEffHel","nodeEffNig"];

var COLOR_BLACK = cc.c3b(55,37,20);
var COLOR_RED = cc.c3b(197,16,16);

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
        if (theMode == MODE_LIST){
            var localPos = theListLayer.convertToNodeSpace(touchPosBegin);
            var size = theListLayer.getContentSize();
            if( localPos.x >0 && localPos.y >0
                && localPos.x < size.width && localPos.y < size.height ){
                var PY = Math.floor((size.height - localPos.y)/LINE_HEIGHT);
                thePy = PY;
                var line = theListLayer.getChildByTag(PY);
                theLevel = 0;
                loadBountyDesc(line.bounty, 0);
            }
        }
        else if (theMode == MODE_DESC){
//            var localDescPos = {};
//            debug("MODE_DESC touchPosBegin = "+JSON.stringify(touchPosBegin));
//            if (theDesc == 1){
//                localDescPos = theDescLayer.convertToNodeSpace(touchPosBegin);
//                debug("MODE_DESC localDescPos = "+JSON.stringify(localDescPos));
//            }
//            else if (theDesc == 2){
//                localDescPos = theDescLayer2.convertToNodeSpace(touchPosBegin);
//                debug("MODE_DESC2 localDescPos = "+JSON.stringify(localDescPos));
//            }
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
    for (var k in thePrizeLayer){
        engine.ui.unregMenu(thePrizeLayer[k]);
    }
    thePrizeLayer = [];
}

function onSubmit(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if (theMode == MODE_DESC && thePy != null) {
        var line = theListLayer.getChildByTag(thePy);
        var str = engine.user.bounty.checkLimit(line.bounty.BountyId, theLevel);

        var segmentSel = engine.user.bounty.getProcess(line.bounty.BountyId);
        var chkProcess = engine.user.bounty.checkProcess(line.bounty.BountyId,segmentSel);
        var bountyData = libTable.queryTable(TABLE_BOUNTY, line.bounty.BountyId);
        if (bountyData.count == null){
            line.bounty.count = 0;
        }
        else{
            line.bounty.count = bountyData.count;
        }

        if (chkProcess == 1){
            engine.msg.pop(translate(engine.game.language, "questInfoMissonTarget"), POPTYPE_ERROR);
        }
        else if (chkProcess == 2){
            engine.msg.pop(translate(engine.game.language, "sceneBountyOver"), POPTYPE_ERROR);
        }
        else if (str.length <= 0 && ((
            engine.session.dataBounty[line.bounty.BountyId] != null &&
                engine.session.dataBounty[line.bounty.BountyId].cnt != null &&
                engine.session.dataBounty[line.bounty.BountyId].cnt > 0 ) ||
            line.bounty.count <= 0)){
            var libStage = loadModule("sceneStage.js");
            var stageData = queryStage(bountyData.level[theLevel].stage);

            libStage.startStage(bountyData.level[theLevel].stage, stageData.team, stageData.cost);
        }
        else if (engine.session.dataBounty[line.bounty.BountyId] != null &&
                engine.session.dataBounty[line.bounty.BountyId].cnt != null &&
                engine.session.dataBounty[line.bounty.BountyId].cnt <= 0){
                engine.msg.pop(translate(engine.game.language, "sceneBountyDone"), POPTYPE_ERROR);
        }
        else if (str.length > 0){
            engine.msg.pop(str, POPTYPE_ERROR);
        }
    }
}

function onSimple(sender){
    if (theMode == MODE_DESC && thePy != null){
        var line = theListLayer.getChildByTag(thePy);
        var str = engine.user.bounty.checkLimit(line.bounty.BountyId, 0);
        if (str.length <= 0){
            loadBountyDesc(line.bounty, 0);
            theLevel = 0;
        }
        else{
            engine.msg.pop(str, POPTYPE_ERROR);
        }
    }
}

function onNormal(sender){
    if (theMode == MODE_DESC && thePy != null){
        var line = theListLayer.getChildByTag(thePy);
        var str = engine.user.bounty.checkLimit(line.bounty.BountyId, 1);
        if (str.length <= 0){
            loadBountyDesc(line.bounty, 1);
            theLevel = 1;
        }
        else{
            engine.msg.pop(str, POPTYPE_ERROR);
        }
    }
}

function onHard(sender){
    if (theMode == MODE_DESC && thePy != null){
        var line = theListLayer.getChildByTag(thePy);
        var str = engine.user.bounty.checkLimit(line.bounty.BountyId, 2);
        if (str.length <= 0){
            loadBountyDesc(line.bounty, 2);
            theLevel = 2;
        }
        else{
            engine.msg.pop(str, POPTYPE_ERROR);
        }
    }
}

function onHell(sender){
    if (theMode == MODE_DESC && thePy != null){
        var line = theListLayer.getChildByTag(thePy);
        var str = engine.user.bounty.checkLimit(line.bounty.BountyId, 3);
        if (str.length <= 0){
            loadBountyDesc(line.bounty, 3);
            theLevel = 3;
        }
        else{
            engine.msg.pop(str, POPTYPE_ERROR);
        }
    }
}

function onNightmare(sender){
    if (theMode == MODE_DESC && thePy != null){
        var line = theListLayer.getChildByTag(thePy);
        var str = engine.user.bounty.checkLimit(line.bounty.BountyId, 4);
        if (str.length <= 0){
            loadBountyDesc(line.bounty, 4);
            theLevel = 4;
        }
        else{
            engine.msg.pop(str, POPTYPE_ERROR);
        }
    }
}

function loadBountyList(){
    theMode = MODE_LIST;
    theLayer.owner.nodeList.setVisible(true);
    theLayer.owner.nodeDesc.setVisible(false);
    theLayer.owner.nodeDesc2.setVisible(false);
    theListLayer.removeAllChildren();
    theListLayer.setTouchEnabled(true);
    theDescLayer.setTouchEnabled(false);
    theDescLayer2.setTouchEnabled(false);
    theLayer.owner.btnBack.setVisible(false);
    theLayer.owner.btnSubmit.setVisible(false);
    theLayer.owner.labTitle.setVisible(false);
    theLayer.owner.labBlueTitle.setVisible(false);
    theLayer.owner.nodeConBg.setVisible(false);
    theLayer.owner.nodelockSim.setVisible(false);
    theLayer.owner.nodelockNor.setVisible(false);
    theLayer.owner.nodelockHar.setVisible(false);
    theLayer.owner.nodelockHel.setVisible(false);
    theLayer.owner.nodelockNig.setVisible(false);

    var bountyCount = engine.user.bounty.getBountyListLength();//

    var sfc = cc.SpriteFrameCache.getInstance();

    var size = cc.size(LINE_WIDTH, bountyCount*LINE_HEIGHT);//engine.user.bounty.Count
    theListLayer.setContentSize(size);

    if(  bountyCount == 0 ){//engine.user.bounty.Count
        var label = cc.LabelTTF.create(translate(engine.game.language, "questInfoNoMission"), UI_FONT, UI_SIZE_XL);
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

            if (chkProcess == 4){
                owner.nodeBountyBg.setDisplayFrame(sfc.getSpriteFrame("bounty-bg2.png"));
            }
            if (chkProcess >= 2 && chkProcess <= 4){
                owner.nodeTextTime.setVisible(false);
                owner.nodeText.setVisible(true);
                owner.nodeText.setDisplayFrame(sfc.getSpriteFrame(loadTextList[chkProcess]));
            }
            else if (chkProcess >= 0 && chkProcess < loadTextList.length){
                owner.nodeTextTime.setVisible(true);
                owner.nodeText.setVisible(false);
                owner.nodeTextTime.setDisplayFrame(sfc.getSpriteFrame(loadTextList[chkProcess]));
            }

            //
            if (chkProcess >= 0 && chkProcess < loadList.length){
                owner.nodeProcbg.setDisplayFrame(sfc.getSpriteFrame(loadList[chkProcess]));
            }
            owner.labPower.setString(timediff);
            if (bountyData.titlePic != null){
                owner.nodeTitle.setDisplayFrame(sfc.getSpriteFrame(bountyData.titlePic));
            }
            if (bountyData.timePic != null){
                owner.nodeTime.setDisplayFrame(sfc.getSpriteFrame(bountyData.timePic));
            }
            if (bountyData.prizePic != null){
                owner.nodePrize.setDisplayFrame(sfc.getSpriteFrame(bountyData.prizePic));
            }

            var remainFlag = bountyData.count;
            if (chkProcess != 1 && chkProcess != 2 && remainFlag != null && remainFlag > 0){
                if (engine.session.dataBounty[k] != null &&
                    engine.session.dataBounty[k].cnt != null &&
                    engine.session.dataBounty[k].cnt > 0){
                    owner.labelRemain.setString(engine.session.dataBounty[k].cnt);
                }
                else if (engine.session.dataBounty[k] != null &&
                    engine.session.dataBounty[k].cnt != null &&
                    engine.session.dataBounty[k].cnt <= 0){
                    owner.labelRemain.setString(0);
                }
                else{
                    owner.labelRemain.setString(0);
                }
            }
            else{
                owner.nodeRemain.setVisible(false);
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

            if (engine.session.dataBounty[k] != null && engine.session.dataBounty[k].bid >= 0 && engine.session.dataBounty[k].sta == 1){
                theListLayer.addChild(line);
                count++;
            }
        }
    }

    var curroffset = theLayer.ui.scrollList.getContentOffset();
    curroffset.y = theLayer.ui.scrollList.minContainerOffset().y;
    theLayer.ui.scrollList.setContentOffset(curroffset);
}

function loadBountyDesc(bounty, lev){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    //var sfc = cc.SpriteFrameCache.getInstance();
    for (var k in thePrizeLayer){
        engine.ui.unregMenu(thePrizeLayer[k]);
    }
    thePrizeLayer = [];
    theMode = MODE_DESC;
    theLayer.owner.nodeList.setVisible(false);
    theLayer.owner.nodeDesc.setVisible(true);
    theLayer.owner.nodeDesc2.setVisible(true);
    theDescLayer.removeAllChildren();
    theDescLayer2.removeAllChildren();
    theListLayer.setTouchEnabled(false);
    theLayer.owner.btnBack.setVisible(true);
    theLayer.owner.btnSubmit.setVisible(true);
    theLayer.owner.labTitle.setVisible(true);
    theLayer.owner.labBlueTitle.setVisible(true);
    theLayer.owner.nodeConBg.setVisible(true);
    theLayer.owner.nodelockSim.setVisible(false);
    theLayer.owner.nodelockNor.setVisible(false);
    theLayer.owner.nodelockHar.setVisible(false);
    theLayer.owner.nodelockHel.setVisible(false);
    theLayer.owner.nodelockNig.setVisible(false);

    theBounty = bounty;
    //theBounty.fixState();
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bounty.BountyId);
    var dimension = cc.size(theLayer.owner.layerDesc.getContentSize().width, 0);

    theLayer.owner.labTitle.setString(bountyData.title);

    ajustPostion(bounty.BountyId);

    if (bountyData.begin == 1){
        theLayer.owner.btnSubmit.setVisible(true);
        theLayer.owner.btnBack.setVisible(true);
        theLayer.owner.btnBack2.setVisible(false);
    }
    else{
        theLayer.owner.btnSubmit.setVisible(false);
        theLayer.owner.btnBack.setVisible(false);
        theLayer.owner.btnBack2.setVisible(true);
    }

    var winSize = engine.game.viewSize;
    var iphone5s = (winSize.height == 1136);
    var text = DCTextArea.create();
    text.setDimension(dimension);
//    text.pushText({//push desc
//        text: "任务描述",
//        color: COLOR_RED,
//        size: UI_SIZE_L
//    });
    if (iphone5s){
        text.pushText({text: "  "});
    }
    text.pushText({//push desc
        text: /*"    "+*/bountyData.desc,
        color: COLOR_BLACK,
        size: UI_SIZE_S
    });

    if (lev == null){
        lev = 0;
    }
    var tar = bountyData.level[lev];
    
    text.pushText({text: "  "});
    text.pushText({//push objectives
        text: translate(engine.game.language, "sceneBountyMissonRequire"),
        color: COLOR_RED,
        size: UI_SIZE_L
    });
    if (iphone5s){
        text.pushText({text: "  "});
    }
    var limitFlag = false;
    if (tar.levelLimit != null){
        text.pushText({//push desc
            text: translate(engine.game.language, "sceneBountyLimitLevel", [tar.levelLimit]),
            color: COLOR_BLACK,
            size: UI_SIZE_S
        });
        limitFlag = true;
    }
    if (tar.powerLimit != null){
        text.pushText({//push desc
            text: translate(engine.game.language, "sceneBountyLimitPower", [tar.powerLimit]),
            color: COLOR_BLACK,
            size: UI_SIZE_S
        });
        limitFlag = true;
    }
    if (tar.classLimit != null && tar.classLimit.length >= 1){
        var str = "";
        for (var k in tar.classLimit) {
            var roleClass = libTable.queryTable(TABLE_ROLE, tar.classLimit[k]);
            str += roleClass.className + "、";
        }
        str=str.substring(0,str.length-1);
        str += translate(engine.game.language, "sceneBountyLimitClass");
        text.pushText({//push desc
            text: str,
            color: COLOR_BLACK,
            size: UI_SIZE_S
        });
        limitFlag = true;
    }
    if (limitFlag == false){
        text.pushText({//push desc
            text: translate(engine.game.language, "sceneBountyNone"),
            color: COLOR_BLACK,
            size: UI_SIZE_S
        });
    }
    text.pushText({text: "  "});
    text.pushText({//push title
        text: translate(engine.game.language, "sceneBountyMissonPrize"),
        color: COLOR_RED,
        size: UI_SIZE_L
    });
    if (iphone5s){
        text.pushText({text: "  "});
    }
    var size = text.getContentSize();

    var prizeScale = 0.77;
    var prize = libItem.ItemPreview.createRaw(dimension);
    thePrizeLayer.push(prize);
    engine.ui.regMenu(prize);
    prize.setTextColor(COLOR_BLACK);
    prize.setShowInfo(true);
    if (!iphone5s){
        prize.setNodeScale(prizeScale);
    }
    if (engine.session.dataBounty[k] != null &&
        engine.session.dataBounty[k].lev != null &&
        engine.session.dataBounty[k].lev[lev] != null &&
        engine.session.dataBounty[k].lev[lev].prz != null){
        prize.setPreview(engine.session.dataBounty[k].lev[lev].prz);
    }
    else{
        prize.setPreview(tar.prize);
    }
    prize.setPosition(cc.p(0, 0));
    text.setPosition(cc.p(0, prize.getContentSize().height));

    size.height += prize.getContentSize().height;

    if (bountyData.level.length > 1){
        theDesc = 1;
        //theDescLayer.setTouchEnabled(true);
        theDescLayer.addChild(prize);
        theDescLayer.addChild(text);
        theDescLayer.setContentSize(size);
        var curroffset = theLayer.ui.scrollDesc.getContentOffset();
        curroffset.y = theLayer.ui.scrollDesc.minContainerOffset().y;
        theLayer.ui.scrollDesc.setContentOffset(curroffset);

        if (engine.user.bounty.checkLimit(bounty.BountyId, lev).length <= 0){
            theLayer.owner[nodeEffList[lev]].setVisible(true);
            theLayer.owner[nodeEffList[lev]].removeAllChildren();
            libEffect.attachEffectCCBI(theLayer.owner[nodeEffList[lev]],cc.p(0, 0), "effect-bounty.ccbi",libEffect.EFFECTMODE_STAY);
        }
    }
    else if (bountyData.level.length == 1){
        theDesc = 2;
        //theDescLayer2.setTouchEnabled(true);
        theDescLayer2.addChild(prize);
        theDescLayer2.addChild(text);
        theDescLayer2.setContentSize(size);
        var curroffset2 = theLayer.ui.scrollDesc2.getContentOffset();
        curroffset2.y = theLayer.ui.scrollDesc2.minContainerOffset().y;
        theLayer.ui.scrollDesc2.setContentOffset(curroffset2);
    }
}

function onUIAnimationCompleted(name){
    if( theMode == MODE_EXIT ){
        engine.ui.popLayer();
    }
}

function onNotify(event){
    switch(event.NTF){
        case Message_UpdateBounty:
        {
            loadBountyList();
            break;
        }
    }
    return false;
}

function onActivate(){
//    for (var k in thePrizeLayer){
//        engine.ui.unregMenu(thePrizeLayer[k]);
//    }
//    thePrizeLayer = [];
}

function update(delta)
{
    var comTime = new Date();
    var diffMin = comTime.getMinutes() - theTime.getMinutes();
    //var diffSec = comTime.getSeconds() - theTime.getSeconds();

    if(Math.abs(diffMin) >= 1){
        updateTime();
        theTime = comTime;
    }
}

function updateTime()
{
    if (theMode == MODE_LIST) {
        loadBountyList();
        // var sfc = cc.SpriteFrameCache.getInstance();
        // var bountyCount = engine.user.bounty.getBountyListCount();
        // if (bountyCount > 0) {
        //     var list = engine.user.bounty.getBountyList();
        //     for (var k in list) {
        //         var bounty = list[k];
        //         var line = theListLayer.getChildByTag(k);
        //         if (line == null){
        //             break;
        //         }
        //         var bountyData = libTable.queryTable(TABLE_BOUNTY, bounty.BountyId);
        //         var segmentSel = engine.user.bounty.getProcess(bounty.BountyId);
        //         var timediff = engine.user.bounty.cacultime(bounty.BountyId, segmentSel);
        //         var chkProcess = engine.user.bounty.checkProcess(bounty.BountyId, segmentSel);
        //         //setDisplayFrame(sfc.getSpriteFrame(loadList[chkProcess*2]));
        //         if (chkProcess >= 0 && chkProcess < loadList.length / 2) {
        //             line.owner.nodeProcbg.setDisplayFrame(sfc.getSpriteFrame(loadList[chkProcess]));
        //         }
        //         line.owner.labPower.setString(timediff);
        //         // if (bountyData.titlePic != null){
        //         //     line.owner.nodeTitle.setDisplayFrame(sfc.getSpriteFrame(bountyData.titlePic));
        //         // }
        //         // if (bountyData.timePic != null){
        //         //     line.owner.nodeTime.setDisplayFrame(sfc.getSpriteFrame(bountyData.timePic));
        //         // }
        //         var remainFlag = bountyData.count;
        //         if (remainFlag != null && remainFlag > 0){
        //             if (engine.session.dataBounty[k] != null &&
        //                 engine.session.dataBounty[k].cnt != null &&
        //                 engine.session.dataBounty[k].cnt > 0){
        //                 line.owner.labelRemain.setString(engine.session.dataBounty[k].cnt);
        //             }
        //             else if (engine.session.dataBounty[k] != null &&
        //                 engine.session.dataBounty[k].cnt != null &&
        //                 engine.session.dataBounty[k].cnt <= 0){
        //                 line.owner.labelRemain.setString(0);
        //             }
        //         }
        //         else{
        //             line.owner.nodeRemain.setVisible(false);
        //         }
        //     }
        // }
    }
}

function ajustPostion(bountyId){
    var bountyData = libTable.queryTable(TABLE_BOUNTY, bountyId);
    var levCount = bountyData.level.length;
    var sfc = cc.SpriteFrameCache.getInstance();
    for (var k = 0;k < 5;k++){
        theLayer.owner[nodeEffList[k]].setVisible(false);
    }
    if (levCount > 0){
        var winSize = engine.game.viewSize;
        var postion = (winSize.width - 2 * theOffset) / levCount;
        var btnPos = theLayer.owner[btnList[0]].getPosition();
        var nodelockPos = theLayer.owner[btnList[0]].getPosition();
        var nodeEffPos = theLayer.owner[nodeEffList[0]].getPosition();
        var centerOffset = postion/2 - theLayer.owner[btnList[0]].getContentSize().width/2;
        switch (levCount) {
            case 1:
                theLayer.owner.btnSimple.setVisible(false);
                theLayer.owner.btnNormal.setVisible(false);
                theLayer.owner.btnHard.setVisible(false);
                theLayer.owner.btnHell.setVisible(false);
                theLayer.owner.btnNightmare.setVisible(false);
                break;
            case 2:
                theLayer.owner.btnSimple.setVisible(true);
                theLayer.owner.btnNormal.setVisible(true);
                theLayer.owner.btnHard.setVisible(false);
                theLayer.owner.btnHell.setVisible(false);
                theLayer.owner.btnNightmare.setVisible(false);
                for (var k = 0;k < levCount;k++){
                    theLayer.owner[btnList[k]].setPosition(cc.p(theOffset + k * postion + centerOffset, btnPos.y));
                    theLayer.owner[nodelockList[k]].setPosition(cc.p(lockOffset + theOffset + k * postion + centerOffset, nodelockPos.y));
                    theLayer.owner[nodeEffList[k]].setPosition(cc.p(effOffset + theOffset + k * postion + centerOffset, nodeEffPos.y));
                    if (engine.user.bounty.checkLimit(bountyId, k).length <= 0){
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k]));
                        theLayer.owner[nodelockList[k]].setVisible(false);
                    }
                    else{
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k+1]));
                        theLayer.owner[nodelockList[k]].setVisible(true);
                    }
                }
                break;
            case 3:
                theLayer.owner.btnSimple.setVisible(true);
                theLayer.owner.btnNormal.setVisible(true);
                theLayer.owner.btnHard.setVisible(true);
                theLayer.owner.btnHell.setVisible(false);
                theLayer.owner.btnNightmare.setVisible(false);
                for (var k = 0;k < levCount;k++){
                    theLayer.owner[btnList[k]].setPosition(cc.p(theOffset + k * postion + centerOffset, btnPos.y));
                    theLayer.owner[nodelockList[k]].setPosition(cc.p(lockOffset + theOffset + k * postion + centerOffset, nodelockPos.y));
                    theLayer.owner[nodeEffList[k]].setPosition(cc.p(effOffset + theOffset + k * postion + centerOffset, nodeEffPos.y));
                    if (engine.user.bounty.checkLimit(bountyId, k).length <= 0){
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k]));
                        theLayer.owner[nodelockList[k]].setVisible(false);
                    }
                    else{
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k+1]));
                        theLayer.owner[nodelockList[k]].setVisible(true);
                    }
                }
                break;
            case 4:
                theLayer.owner.btnSimple.setVisible(true);
                theLayer.owner.btnNormal.setVisible(true);
                theLayer.owner.btnHard.setVisible(true);
                theLayer.owner.btnHell.setVisible(true);
                theLayer.owner.btnNightmare.setVisible(false);
                for (var k = 0;k < levCount;k++){
                    theLayer.owner[btnList[k]].setPosition(cc.p(theOffset + k * postion + centerOffset, btnPos.y));
                    theLayer.owner[nodelockList[k]].setPosition(cc.p(lockOffset + theOffset + k * postion + centerOffset, nodelockPos.y));
                    theLayer.owner[nodeEffList[k]].setPosition(cc.p(effOffset + theOffset + k * postion + centerOffset, nodeEffPos.y));
                    if (engine.user.bounty.checkLimit(bountyId, k).length <= 0){
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k]));
                        theLayer.owner[nodelockList[k]].setVisible(false);
                    }
                    else{
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k+1]));
                        theLayer.owner[nodelockList[k]].setVisible(true);
                    }
                }
                break;
            case 5:
                theLayer.owner.btnSimple.setVisible(true);
                theLayer.owner.btnNormal.setVisible(true);
                theLayer.owner.btnHard.setVisible(true);
                theLayer.owner.btnHell.setVisible(true);
                theLayer.owner.btnNightmare.setVisible(true);
                for (var k = 0;k < levCount;k++){
                    theLayer.owner[btnList[k]].setPosition(cc.p(theOffset + k * postion + centerOffset, btnPos.y));
                    theLayer.owner[nodelockList[k]].setPosition(cc.p(lockOffset + theOffset + k * postion + centerOffset, nodelockPos.y));
                    theLayer.owner[nodeEffList[k]].setPosition(cc.p(effOffset + theOffset + k * postion + centerOffset, nodeEffPos.y));
                    if (engine.user.bounty.checkLimit(bountyId, k).length <= 0){
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k]));
                        theLayer.owner[nodelockList[k]].setVisible(false);
                    }
                    else{
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k+1]));
                        theLayer.owner[nodelockList[k]].setVisible(true);
                    }
                }
                break;
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
    this.owner.onHell = onHell;
    this.owner.onNightmare = onNightmare;
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
        },
        layerDesc2: {
            ui: "UIScrollView",
            id: "scrollDesc2",
            dir: cc.SCROLLVIEW_DIRECTION_VERTICAL
        }
    });
    this.addChild(this.node);

    theMode = MODE_LIST;
    this.node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    this.node.animationManager.runAnimationsForSequenceNamed("open");

    this.owner.nodeList.setVisible(false);
    this.owner.nodeDesc.setVisible(false);
    this.owner.nodeDesc2.setVisible(false);
    this.owner.btnBack.setVisible(false);
    this.owner.btnSubmit.setVisible(false);
    this.owner.labTitle.setVisible(false);
    this.owner.labBlueTitle.setVisible(false);
    this.owner.nodeConBg.setVisible(false);

    //theLayer.ui.treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);

    theListLayer = cc.Layer.create();
    this.ui.scrollList.setContainer(theListLayer);
    theDescLayer = cc.Layer.create();
    this.ui.scrollDesc.setContainer(theDescLayer);
    theDescLayer2 = cc.Layer.create();
    this.ui.scrollDesc2.setContainer(theDescLayer2);

    theListLayer.onTouchBegan = onTouchBegan;
    theListLayer.onTouchMoved = onTouchMoved;
    theListLayer.onTouchEnded = onTouchEnded;
    theListLayer.onTouchCancelled = onTouchCancelled;
    theListLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theListLayer.setTouchPriority(1);
    theListLayer.setTouchEnabled(false);

    theDescLayer.onTouchBegan = onTouchBegan;
    theDescLayer.onTouchMoved = onTouchMoved;
    theDescLayer.onTouchEnded = onTouchEnded;
    theDescLayer.onTouchCancelled = onTouchCancelled;
    theDescLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theDescLayer.setTouchPriority(1);
    theDescLayer.setTouchEnabled(false);

    theDescLayer2.onTouchBegan = onTouchBegan;
    theDescLayer2.onTouchMoved = onTouchMoved;
    theDescLayer2.onTouchEnded = onTouchEnded;
    theDescLayer2.onTouchCancelled = onTouchCancelled;
    theDescLayer2.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theDescLayer2.setTouchPriority(1);
    theDescLayer2.setTouchEnabled(false);

    this.scheduleUpdate();
    theTime = new Date();

    engine.ui.regMenu(this.owner.menuRoot);
    engine.ui.regMenu(this.owner.menuRoot1);
    engine.ui.regMenu(this.owner.menuRoot2);

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