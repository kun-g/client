/**
 * User: hammer
 * Date: 13-11-11
 * Time: 上午10:49
 */

var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var libItem = loadModule("xitem.js");

var theLayer;
var theItem;
var theOperate;
var theItemClass;

/******* OPEN CHEST *********/
var theOpenLayer;
var theOpenRES;
var theOpenReady;

function onOLTouchBegan(touch, event){
    if( theOpenReady ) return true;
    return false;
}
function onOLTouchMoved(touch, event){}
function onOLTouchEnded(touch, event){
    theOpenLayer.node.runAction(actionPopOut(function(){
        engine.ui.popLayer();
        if( theOpenRES != null ){
            engine.event.processResponses(theOpenRES);
        }
    }));
}
function onOLTouchCancelled(touch, event){
    this.onOLTouchEnded(touch, event);
}

function onOCEffectDone(name){
    theOpenReady = true;
}

function processOpenChest(item, rsp){
    if( item.ClassId >= 525 && item.ClassId <= 533 ){
        var fileName = "effect-openChest"+(item.ClassId - 525)+".ccbi";
        theOpenLayer = engine.ui.newLayer();
        var mask = blackMask();
        theOpenLayer.addChild(mask);
        theOpenLayer.owner = {};
        theOpenLayer.node = cc.BuilderReader.load(fileName, theOpenLayer.owner);
        var winSize = cc.Director.getInstance().getWinSize();
        theOpenLayer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
        theOpenLayer.addChild(theOpenLayer.node);
        theOpenLayer.node.animationManager.runAnimationsForSequenceNamed("effect");
        theOpenLayer.node.animationManager.setCompletedAnimationCallback(theOpenLayer.node, onOCEffectDone);

        var light = cc.BuilderReader.load("effect-winlight.ccbi");
        light.animationManager.runAnimationsForSequenceNamed("effect");
        theOpenLayer.owner.nodeLight.addChild(light);

        //set values
        var prz = libItem.ItemPreview.createRaw();
        prz.setTextColor(cc.c3b(0, 0, 0));
        prz.setPreview(rsp.prz);
        var size = prz.getContentSize();
        prz.setPosition(cc.p(-size.width/2, -size.height/2));
        theOpenLayer.owner.nodeItem.addChild(prz);
        theOpenRES = rsp.RES;
        theOpenReady = false;
        //set layer touch
        theOpenLayer.onTouchBegan = onOLTouchBegan;
        theOpenLayer.onTouchMoved = onOLTouchMoved;
        theOpenLayer.onTouchEnded = onOLTouchEnded;
        theOpenLayer.onTouchCancelled = onOLTouchCancelled;
        theOpenLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
        theOpenLayer.setTouchPriority(1);
        theOpenLayer.setTouchEnabled(true);

        return true;
    }
    return false;
}

exports.showOpenEffect = function(prize){
    var fileName = "ui-dailymission-prize.ccbi";
    theOpenLayer = engine.ui.newLayer();
    var mask = blackMask();
    theOpenLayer.addChild(mask);
    theOpenLayer.owner = {};
    theOpenLayer.node = cc.BuilderReader.load(fileName, theOpenLayer.owner);
    var winSize = cc.Director.getInstance().getWinSize();
    theOpenLayer.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    theOpenLayer.addChild(theOpenLayer.node);
    theOpenLayer.node.animationManager.runAnimationsForSequenceNamed("effect");
    theOpenLayer.node.animationManager.setCompletedAnimationCallback(theOpenLayer.node, onOCEffectDone);

    var light = cc.BuilderReader.load("effect-winlight.ccbi");
    light.animationManager.runAnimationsForSequenceNamed("effect");
    theOpenLayer.owner.nodeLight.addChild(light);

    //set values
    var prz = libItem.ItemPreview.createRaw();
    prz.setTextColor(cc.c3b(0, 0, 0));
    prz.setPreview(prize);
    var size = prz.getContentSize();
    prz.setPosition(cc.p(-size.width/2, -size.height/2));
    theOpenLayer.owner.nodeItem.addChild(prz);
    theOpenRES = null;
    theOpenReady = false;
    //set layer touch
    theOpenLayer.onTouchBegan = onOLTouchBegan;
    theOpenLayer.onTouchMoved = onOLTouchMoved;
    theOpenLayer.onTouchEnded = onOLTouchEnded;
    theOpenLayer.onTouchCancelled = onOLTouchCancelled;
    theOpenLayer.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    theOpenLayer.setTouchPriority(1);
    theOpenLayer.setTouchEnabled(true);
};

/****************************/

function contentNormal(){
    if( theItemClass.description != null && theItemClass.description != "" ){
        theLayer.owner.labelDesc.setString(theItemClass.description);
        theLayer.owner.labelDesc.setColor(cc.c3b(255, 255, 255));
    }
    else{
        theLayer.owner.labelDesc.setString("这只是一件平淡无奇的道具");
        theLayer.owner.labelDesc.setColor(cc.c3b(128, 128, 128));
    }
}

function contentEquip(){
    var owner = {};
    //var maxSize = theLayer.owner.nodeDesc.getContentSize();
    var node = cc.BuilderReader.load("ui-equipdesc.ccbi", owner);
    //node.setPosition(cc.p(maxSize.width/2, maxSize.height/2));
    theLayer.owner.nodeDesc.addChild(node);

    //type
    var strType = EquipSlotDesc[theItemClass.subcategory];
    if( theItemClass.classLimit != null ){
        strType += "  职业限定：";
        var flag = false;
        for(var k in theItemClass.classLimit){
            if(flag){
                strType += "，";
            }
            var roleClassId = theItemClass.classLimit[k];
            var roleClass = libTable.queryTable(TABLE_ROLE, roleClassId);
            strType += roleClass.className;
        }
    }
    owner.labelType.setString(strType);

    //level
    if( theItemClass.rank != null ){
        owner.labelLevel.setString(theItemClass.rank+"级")
    }

    //calc property
    var properties = {};
    mergeRoleProperties(properties, theItemClass.basic_properties);

    //enhance
    var enhance = -1;
    if( theItem.Enhance != null && theItem.Enhance[0] != null && theItem.Enhance[0].lv != null ){
        enhance = Math.floor(theItem.Enhance[0].lv);
    }
    var starLv = Math.floor((enhance+1) / 8) % 6;
    var barLv = ((enhance == 39)? 8:parseInt(((enhance+1)%8)));
    for(var i=1; i<6; ++i){
        var starName = "ehStar"+i;
        if( i <= starLv){
            owner[starName].runAction(cc.FadeIn.create(0.3));
        }
        else {
            owner[starName].setOpacity(0);
        }
    }
    for(var i=1; i<9; ++i){
        var barName = "ehBar"+i;
        if( i <= barLv){
            owner[barName].runAction(cc.FadeIn.create(0.3));
        }
        else {
            owner[barName].setOpacity(0);
        }
    }

    var enhanceInfo = libTable.queryTable(TABLE_ENHANCE, theItemClass.enhanceID);
    if( enhanceInfo != null ){
        for ( var i=0; i<=enhance; i++ ){
            if( enhanceInfo.property[i] != null){
                mergeRoleProperties(properties, enhanceInfo.property[i]);
            }
        }
    }


    //show property
    owner.labelProperty.setString(propertyString(properties));

    //desc
    if( theItemClass.description != null && theItemClass.description != "" ){
        owner.labelDesc.setString(theItemClass.description);
    }
    else{
        owner.labelDesc.setString("这是一件普普通通的装备");
        owner.labelDesc.setColor(cc.c3b(128, 128, 128));
    }

    //xp
    if( theItem.Xp != null ){
        var xpNow = theItem.Xp;
        var xpTotal = theItem.equipUpgradeXp();
        if( xpNow > xpTotal ){
            xpNow = xpTotal;
        }
        if( xpNow > 0 ){
            owner.labelXp.setString("熟练度："+xpNow+"/"+xpTotal);
        }

        var prog = new ProgressBar(400, "index-jy1.png", "index-jy2.png", "index-jy3.png");
        prog.setProgress(xpNow/xpTotal);
        owner.nodeProgress.addChild(prog.node);
    }
}


//dissolve module is gonna be removed
function onDissolve(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( !engine.user.player.checkUnlock("dissolve") ) return;

    var alert = libUIKit.alert();
    alert.setContent("确定要分解\n【"+theItemClass.label+"】?");
    alert.setButton([
        {
            label: "buttontext-qx.png",
            func: alert.onClose,
            obj: alert
        },
        {
            label: "buttontext-confirm.png",
            func: function(sender){
                cc.AudioEngine.getInstance().playEffect("card2.mp3");
                this.theNode.runAction(actionPopOut(function(){
                    engine.ui.popLayer();

                    libUIKit.waitRPC(Request_InventoryUseItem, {
                        sid: theItem.ServerId,
                        opn: ITMOP_DISSOLVE
                    }, function(rsp){
                        if( rsp.RET == RET_OK ){
                            var forge = loadModule("sceneForge.js");
                            forge.pushForgeAnimation("effect-fenjie.ccbi", {nodeItem:theItem}, function(){
                                libUIKit.showAlert("装备分解成功", function(){
                                    engine.ui.removeLayer(theLayer);
                                    tdga.itemUse(theItemClass.label, 1);
                                }, theLayer);

                                //execute result
                                if( rsp.RES != null ){
                                    engine.event.processResponses(rsp.RES);
                                }

                            }, theLayer);
                        }
                        else{
                            libUIKit.showErrorMessage(rsp);
                        }
                    }, theLayer);
                }));
            },
            obj: alert
        }
    ]);
}

function onUse(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libUIKit.waitRPC(Request_InventoryUseItem, {
        sid: theItem.ServerId,
        opn: ITMOP_USE
    }, function(rsp){
        if( rsp.RET == RET_OK )
        {
            engine.ui.popLayer();
            tdga.itemUse(theItemClass.label, 1);
            //处理开箱子的特效
            processOpenChest(theItem, rsp);
        }
        else
        {
            libUIKit.showErrorMessage(rsp);
        }
    }, theLayer);
}

//equip/unequip module is gonna be removed
function onEquip(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libUIKit.waitRPC(Request_InventoryUseItem, {
        sid: theItem.ServerId,
        opn: ITMOP_EQUIP
    }, function(rsp){
        if( rsp.RET == RET_OK )
        {
            engine.ui.popLayer();
        }
        else
        {
            libUIKit.showErrorMessage(rsp);
        }
    }, theLayer);
}

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theLayer.node.runAction(actionPopOut(function(){
        engine.ui.popLayer();
    }, theLayer));
}

function onSell(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( !engine.user.player.checkUnlock("sell") ) return;

    var total = theItemClass.sellprice*theItem.StackCount;
    var alert = libUIKit.alert();
    alert.setContent("【"+theItemClass.label+"】\n售价"+total+"金币\n确定要卖出？");
    alert.setButton([
        {
            label: "buttontext-qx.png",
            func: alert.onClose,
            obj: alert
        },
        {
            label: "buttontext-confirm.png",
            func: function(sender){
                cc.AudioEngine.getInstance().playEffect("card2.mp3");
                this.theNode.runAction(actionPopOut(function(){
                    engine.ui.popLayer();

                    libUIKit.waitRPC(Request_InventoryUseItem, {
                        sid: theItem.ServerId,
                        opn: ITMOP_SELL
                    }, function(rsp){
                        if( rsp.RET == RET_OK )
                        {
                            engine.ui.popLayer();
                            tdga.itemUse(theItemClass.label, 1);
                        }
                        else
                        {
                            libUIKit.showErrorMessage(rsp);
                        }
                    }, theLayer);
                }));
            },
            obj: alert
        }
    ]);
}

function canDissolve(){
//    if( theItemClass.category == ITEM_EQUIPMENT ){
//        if( theItemClass.subcategory >= EquipSlot_MainHand
//            && theItemClass.subcategory < EquipSlot_StoreMainHand )
//            return true;
//    }
    return false;
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("itemInfo");
}

function onEnter(){
    theLayer = this;

    this.owner = {};
    this.owner.onSell = onSell;
//    this.owner.onDissolve = onDissolve;

    var filename = "ui-iteminfo.ccbi";
    if( theItemClass.category != ITEM_EQUIPMENT ){
        filename = "ui-iteminfosmall.ccbi";
    }
    this.node = libUIC.loadUI(this, filename, {
        nodeIcon:{
            id: "icon",
            ui: "UIItem",
            def: "wenhao.png"
        }
    });
    var mask = blackMask();
    var winSize = cc.Director.getInstance().getWinSize();
    this.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    this.addChild(mask);
    this.addChild(this.node);

    this.node.setScale(0);
    this.node.runAction(actionPopIn());
    engine.ui.regMenu(this.owner.menuRoot);

    //assign values
    this.ui.icon.setItem(theItem);
    this.owner.labelName.setString(theItemClass.label);
    //sell button
    if( theItemClass.sellprice != null && theOperate ){
        this.owner.btnSell.setVisible(true);
    }
    else{
        this.owner.btnSell.setVisible(false);
    }
    //dissolve button
    if( canDissolve() && theOperate ){
        this.owner.btnDissolve.setVisible(true);
    }
    else{
        this.owner.btnDissolve.setVisible(false);
    }

    //main button
    var operates = [];
    operates.push({
        label: "buttontext-close.png",
        func: onClose
    });
    if( theOperate ){
        switch(theItemClass.category){
            case ITEM_USE:
                if( theItemClass.subcategory == ItemUse_ItemPack ){
                    operates.push({
                       label: "buttontext-open.png",
                        func: onUse,
                        obj: theLayer
                    });
                }
                else{
                    operates.push({
                        label: "buttontext-use.png",
                        func: onUse,
                        obj: theLayer
                    })
                }
                break;
            case ITEM_EQUIPMENT:
                if( theItem.Status == ITEMSTATUS_EQUIPED ){
//                    operates.push({
//                        label: "buttontext-unequip.png",
//                        func: onEquip,
//                        obj: theLayer
//                    });
                }
                else{
                    operates.push({
                        label: "buttontext-equip.png",
                        func: onEquip,
                        obj: theLayer
                    });
                }
                break;
            case ITEM_GEM://do nothing
            case ITEM_RECIPE:
            case ITEM_USELESS:
                break;
        }
    }

    //do the operate
    if( operates.length == 1 )
    {//Only One Button
        var button = makeButton(operates[0]);
        button.setPosition(this.owner.nodeButtonC.getPosition());
        this.owner.menuRoot.addChild(button);
    }
    else
    {//Two Buttons
        var button1 = makeButton(operates[0]);
        button1.setPosition(this.owner.nodeButtonA.getPosition());
        this.owner.menuRoot.addChild(button1);
        var button2 = makeButton(operates[1]);
        button2.setPosition(this.owner.nodeButtonB.getPosition());
        this.owner.menuRoot.addChild(button2);
    }

    //load content
    if( theItemClass.category == ITEM_EQUIPMENT ){
        contentEquip();
    }
    else{
        contentNormal();
    }
    
    
}

//pass the item and if can operate, default is false
function show(item, operate){
    theItem = item;
    theOperate = operate;
    if( theOperate == null )
    {
        theOperate = false;
    }
    theItemClass = libTable.queryTable(TABLE_ITEM, theItem.ClassId);
    if( theItemClass.label == null ){
        return;//do not show hidden items
    }

    engine.ui.newLayer({
        onEnter: onEnter,
        onActivate: onActivate
    });
}

exports.show = show;