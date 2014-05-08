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
var theDescLayer2;
var theBounty;
var thePy;
var theTime;
var theLevel = 0;

var MODE_LIST = 0;
var MODE_DESC = 1;
var MODE_EXIT = 2;

var theOffset = 34;
var lockOffset = 25;
var effOffset = 43;

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
    if (theMode == MODE_DESC && thePy != undefined) {
        var line = theListLayer.getChildByTag(thePy);
        var str = engine.user.bounty.checkLimit(line.bounty.BountyId, theLevel);

        var segmentSel = engine.user.bounty.getProcess(line.bounty.BountyId);
        var chkProcess = engine.user.bounty.checkProcess(line.bounty.BountyId,segmentSel);
        debug("onSubmit:segmentSel = " + segmentSel + "   chkProcess = " + chkProcess);
        if (chkProcess == 1){
            engine.msg.pop("任务还未开启，请等待。", POPTYPE_ERROR);
        }else if (chkProcess == 2){
            engine.msg.pop("任务已经结束了。", POPTYPE_ERROR);
        }
        else if (str.length <= 0 &&
            engine.user.bounty.dataBounty[line.bounty.BountyId] != undefined &&
            engine.user.bounty.dataBounty[line.bounty.BountyId].cnt != undefined &&
            engine.user.bounty.dataBounty[line.bounty.BountyId].cnt > 0){
            var libTable = loadModule("table.js");
            var libStage = loadModule("sceneStage.js");
            var bountyData = libTable.queryTable(TABLE_BOUNTY, line.bounty.BountyId);
            var stageData = queryStage(bountyData.level[theLevel].stage);
//            debug("theLevel = " + theLevel);
//            debug("stage = " + bountyData.level[theLevel].stage);
//            debug("stageData = " + JSON.stringify(stageData));
            libStage.startStage(bountyData.level[theLevel].stage, stageData.team, stageData.cost);
        }
        else if (engine.user.bounty.dataBounty[line.bounty.BountyId] != undefined &&
                engine.user.bounty.dataBounty[line.bounty.BountyId].cnt != undefined &&
                engine.user.bounty.dataBounty[line.bounty.BountyId].cnt <= 0){
            engine.msg.pop("活动次数已经用完。", POPTYPE_ERROR);
        }
        else if (str.length > 0){
            engine.msg.pop(str, POPTYPE_ERROR);
        }


    }
}

function onSimple(sender){
    if (theMode == MODE_DESC && thePy != undefined){
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
    if (theMode == MODE_DESC && thePy != undefined){
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
    if (theMode == MODE_DESC && thePy != undefined){
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
    if (theMode == MODE_DESC && thePy != undefined){
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
    if (theMode == MODE_DESC && thePy != undefined){
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
    theLayer.owner.btnBack.setVisible(false);
    theLayer.owner.btnSubmit.setVisible(false);
    theLayer.owner.labTitle.setVisible(false);
    theLayer.owner.labBlueTitle.setVisible(false);
    theLayer.owner.nodelockSim.setVisible(false);
    theLayer.owner.nodelockNor.setVisible(false);
    theLayer.owner.nodelockHar.setVisible(false);
    theLayer.owner.nodelockHel.setVisible(false);
    theLayer.owner.nodelockNig.setVisible(false);

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

            if (chkProcess >= 0 && chkProcess < loadList.length){
                owner.nodeProcbg.setDisplayFrame(sfc.getSpriteFrame(loadList[chkProcess]));
            }
            //debug("loadBountyList 152:bounty = "+JSON.stringify(bountyData));
            owner.labPower.setString(timediff);
            if (bountyData.titlePic != undefined){
                owner.nodeTitle.setDisplayFrame(sfc.getSpriteFrame(bountyData.titlePic));
            }
            if (bountyData.timePic != undefined){
                owner.nodeTime.setDisplayFrame(sfc.getSpriteFrame(bountyData.timePic));
            }

            var remainFlag = bountyData.count;
            if (remainFlag != undefined && remainFlag > 0){
                if (engine.user.bounty.dataBounty[k] != undefined &&
                    engine.user.bounty.dataBounty[k].cnt != undefined &&
                    engine.user.bounty.dataBounty[k].cnt > 0){
                    owner.labelRemain.setString(engine.user.bounty.dataBounty[k].cnt);
                }
                else if (engine.user.bounty.dataBounty[k] != undefined &&
                    engine.user.bounty.dataBounty[k].cnt != undefined &&
                    engine.user.bounty.dataBounty[k].cnt <= 0){
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
    theLayer.owner.nodeDesc2.setVisible(true);
    theDescLayer.removeAllChildren();
    theDescLayer2.removeAllChildren();
    theListLayer.setTouchEnabled(false);
    theLayer.owner.btnBack.setVisible(true);
    theLayer.owner.btnSubmit.setVisible(true);
    theLayer.owner.labTitle.setVisible(true);
    theLayer.owner.labBlueTitle.setVisible(true);
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

    var text = DCTextArea.create();
    text.setDimension(dimension);
    text.pushText({//push desc
        text: "任务描述",
        color: cc.c3b(236, 199, 101),
        size: UI_SIZE_XL
    });
    text.pushText({text: "  "});
    text.pushText({//push desc
        text: /*"    "+*/bountyData.desc,
        size: UI_SIZE_L
    });

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
        //debug("str = " + str);
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

    text.setPosition(cc.p(0, prize.getContentSize().height));

    size.height += prize.getContentSize().height;

    if (bountyData.level.length > 1){
        theDescLayer.addChild(prize);
        theDescLayer.addChild(text);
        theDescLayer.setContentSize(size);
        var curroffset = theLayer.ui.scrollDesc.getContentOffset();
        curroffset.y = theLayer.ui.scrollDesc.minContainerOffset().y;
        theLayer.ui.scrollDesc.setContentOffset(curroffset);
    }
    else if (bountyData.level.length == 1){
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
                var remainFlag = bountyData.count;
                if (remainFlag != undefined && remainFlag > 0){
                    if (engine.user.bounty.dataBounty[k] != undefined &&
                        engine.user.bounty.dataBounty[k].cnt != undefined &&
                        engine.user.bounty.dataBounty[k].cnt > 0){
                        line.owner.labelRemain.setString(engine.user.bounty.dataBounty[k].cnt);
                    }
                    else if (engine.user.bounty.dataBounty[k] != undefined &&
                        engine.user.bounty.dataBounty[k].cnt != undefined &&
                        engine.user.bounty.dataBounty[k].cnt <= 0){
                        line.owner.labelRemain.setString(0);
                    }
                }
                else{
                    line.owner.nodeRemain.setVisible(false);
                }
            }
        }
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
        var winSize = cc.Director.getInstance().getWinSize();
        var postion = (winSize.width - 2 * theOffset) / levCount;
        var btnPos = theLayer.owner[btnList[0]].getPosition();
        var nodelockPos = theLayer.owner[btnList[0]].getPosition();
        var nodeEffPos = theLayer.owner[nodeEffList[0]].getPosition();
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
                    theLayer.owner[btnList[k]].setPosition(cc.p(theOffset + k * postion, btnPos.y));
                    theLayer.owner[nodelockList[k]].setPosition(cc.p(lockOffset + theOffset + k * postion, nodelockPos.y));
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
                    theLayer.owner[btnList[k]].setPosition(cc.p(theOffset + k * postion, btnPos.y));
                    theLayer.owner[nodelockList[k]].setPosition(cc.p(lockOffset + theOffset + k * postion, nodelockPos.y));
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
                    theLayer.owner[btnList[k]].setPosition(cc.p(theOffset + k * postion, btnPos.y));
                    theLayer.owner[nodelockList[k]].setPosition(cc.p(lockOffset + theOffset + k * postion, nodelockPos.y));
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
                    theLayer.owner[btnList[k]].setPosition(cc.p(theOffset + k * postion, btnPos.y));
                    theLayer.owner[nodelockList[k]].setPosition(cc.p(lockOffset + theOffset + k * postion, nodelockPos.y));
                    if (engine.user.bounty.checkLimit(bountyId, k).length <= 0){
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k]));
                        theLayer.owner[nodelockList[k]].setVisible(false);
                    }
                    else{
                        theLayer.owner[btnList[k]].setNormalSpriteFrame(sfc.getSpriteFrame(levelBtnList[2*k+1]));
                        theLayer.owner[nodelockList[k]].setVisible(true);

                        //var libEffect = loadModule("effect.js");
                        //var node = libEffect.attachEffectCCBI(theLayer.owner[btnList[k]], cc.p(lockOffset + theOffset + k * postion, nodelockPos.y), "filename");


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