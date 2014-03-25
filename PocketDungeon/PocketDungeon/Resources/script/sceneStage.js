/**
 * User: hammer
 * Date: 13-8-16
 * Time: 下午4:39
 */

var effect = loadModule("effect.js");
var table = loadModule("table.js");
var stage = loadModule("stage.js");
var role = loadModule("role.js");
var scroller = loadModule("scroller.js");
var ui = loadModule("UIComposer.js");
var libItem = loadModule("xitem.js");
var libUIKit = loadModule("uiKit.js");
var libQuest = loadModule("questInfo.js");

var theLayer = null;
var theChapterClass;
var theStageClass;

var theEnergyCost = 0;

var BIRD_HIGH = 30;
var CLOUD_HIGH = 40;

var MODE_WORLD = 0;
var MODE_STAGE = 1;

var TYPE_NORMAL = 0;
var TYPE_CHALLENGE = 1;
var theType = -1;

function onEvent(event)
{
    return false;
}

function onClose(sender)
{
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    var main = loadModule("sceneMain.js");
    engine.ui.newScene(main.scene());
}

function onQuest(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    libQuest.show();
}

function onEnter()
{
    theLayer = engine.ui.curLayer;

    if( !cc.AudioEngine.getInstance().isMusicPlaying() )
    {
        cc.AudioEngine.getInstance().playMusic("login.mp3");
    }

    var sfc = cc.SpriteFrameCache.getInstance();
    sfc.addSpriteFrames("map.plist");

    var winSize = cc.Director.getInstance().getWinSize();

    var bg = cc.LayerColor.create(cc.c4b(205, 170, 118, 255));
    theLayer.addChild(bg);
    theLayer.mapnode = cc.Node.create();
    theLayer.map = cc.TMXTiledMap.create("world.tmx");
    theLayer.mapnode.addChild(theLayer.map);

    theLayer.titles = cc.Node.create();
    theLayer.mapnode.addChild(theLayer.titles);

    {//cache calculation
        theLayer.tilesize = theLayer.map.getTileSize();
        var mapsize = theLayer.map.getMapSize();
        var mapsizewidth = 0.75*theLayer.tilesize.width*mapsize.width+theLayer.tilesize.width/4;
        var mapsizeheight = theLayer.tilesize.height*mapsize.height+theLayer.tilesize.height/2;
        theLayer.mapsize = cc.size(mapsizewidth, mapsizeheight);

        //calc map restriction
        theLayer.mapMinX = winSize.width - theLayer.mapsize.width/2;
        theLayer.mapMaxX = theLayer.mapsize.width/2;
        theLayer.mapMinY = winSize.height - theLayer.mapsize.height/2;
        theLayer.mapMaxY = theLayer.mapsize.height/2;

        theLayer.cgSubGrid = cc.size(theLayer.tilesize.width*0.75, theLayer.tilesize.height/2);
        theLayer.cgDivide = theLayer.tilesize.width/4;
        theLayer.cgMapSize = theLayer.map.getMapSize();
        theLayer.cgSGCO = cc.p(theLayer.tilesize.width/8, theLayer.tilesize.height/4);

        theLayer.maxgrid = theLayer.cgMapSize.width*theLayer.cgMapSize.height-1;

        theLayer.map.setContentSize(theLayer.mapsize);
        theLayer.map.setAnchorPoint(cc.p(0, 1));
        theLayer.map.setPosition(cc.p(-theLayer.mapsize.width/2, (theLayer.mapsize.height/2+theLayer.tilesize.height/2)));

        theLayer.titles.setContentSize(theLayer.mapsize);
        theLayer.titles.setAnchorPoint(cc.p(0, 1));
        theLayer.titles.setPosition(theLayer.map.getPosition());
    }

    theLayer.mapnode.setPosition(cc.p(winSize.width/2, winSize.height/2));
    theLayer.addChild(theLayer.mapnode);

    theLayer.maplayer = theLayer.map.getLayer("Layer 0");

    theLayer.birds = [];
    theLayer.clouds = [];
    theLayer.cloudnode =  cc.Node.create();
    theLayer.cloudnode.setPosition(theLayer.mapnode.getPosition());
    theLayer.addChild(theLayer.cloudnode);

    //add stage scene
    theLayer.owner = {};
    theLayer.owner.onClose = onClose;
    theLayer.owner.onQuest = onQuest;
    var node = cc.BuilderReader.load("sceneMap.ccbi", theLayer.owner);
    theLayer.addChild(node);

    theLayer.update = update;
    theLayer.scheduleUpdate();

    theLayer.onTouchBegan = onTouchBegan;
    theLayer.onTouchMoved = onTouchMoved;
    theLayer.onTouchEnded = onTouchEnded;
    theLayer.onTouchCancelled = onTouchCancelled;
    theLayer.setTouchMode(cc.TOUCHES_ONE_BY_ONE);
    theLayer.setTouchEnabled(true);

    engine.ui.regMenu(theLayer);
    engine.ui.regMenu(theLayer.owner.menuRoot);

    initStage();

    //schedule pop
    engine.pop.setAllAndInvoke();

    //register broadcast
    loadModule("broadcast.js").instance.simpleInit(this);
}

function onExit()
{
    loadModule("broadcast.js").instance.close();
}

function initStage()
{
    var stg = engine.user.stage;
    //for(var k in stg.Chapters)
    for(var k=1; k<table.getTableLength(TABLE_STAGE); ++k)
    {
        var locked = true;
        if( stg.Chapters[k] != null ){
            locked = false;
        }

        var ChClass = table.queryTable(TABLE_STAGE, k);
        if( ChClass.hidden != true ){
            var pos = cc.p(ChClass.posX, ChClass.posY);
            theLayer.maplayer.setTileGID(ChClass.gid, pos);
            var tile = theLayer.maplayer.getTileAt(pos);
            var title = cc.Sprite.createWithSpriteFrameName(ChClass.title);
            title.setPosition(cc.pAdd(tile.getPosition(), cc.p(74, 30)));
            theLayer.titles.addChild(title);

            if( locked ){
                var lock = cc.Sprite.create("locker.png");
                lock.setAnchorPoint(cc.p(0.5, 0.5));
                var ts = title.getContentSize();
                lock.setPosition(cc.pAdd(cc.p(ts.width/2, ts.height/2), cc.p(0, 30)));
                title.addChild(lock);
                title.setColor(cc.c3b(128, 128, 128));
                tile.setColor(cc.c3b(128, 128, 128));
            }
        }
    }
}

function update(delta)
{
    runBird(delta);
    if( theLayer.birds.length < 2 )
    {
        setBird();
    }
    runCloud(delta);
    if( theLayer.clouds.length < 4 )
    {
        setCloud();
    }
}

function gridPos(g)
{
    var x = Math.floor(g%theLayer.cgMapSize.width);
    var y = Math.floor(g/theLayer.cgMapSize.width);
    return cc.p(x, y);
}

function calcGrid(rpos)
{
    //calc subgrid
    var sgX = Math.floor(rpos.x/theLayer.cgSubGrid.width);
    var sgY = Math.floor(rpos.y/theLayer.cgSubGrid.height);

    //calc main rect
    var gX = sgX;
    var gY = sgY;
    if( gX%2 == 1 )
    {
        gY -= 1;
    }
    var mrect = gX + Math.floor(gY/2)*theLayer.cgMapSize.width;

    //check condition
    var sgpos = cc.p(sgX*theLayer.cgSubGrid.width, sgY*theLayer.cgSubGrid.height);
    if( rpos.x - sgpos.x > theLayer.cgDivide )
    {//hit
        return mrect;
    }
    else
    {//need further calc
        var cpos = cc.pAdd(sgpos, theLayer.cgSGCO);
        var rcpos = cc.pSub(rpos, cpos);
        rcpos.y *= -1;
        var angle = cc.RADIANS_TO_DEGREES(cc.pToAngle(rcpos));
        var selector;
        if( angle > -45 && angle <= 45 )
        {
            selector = 1;
        }
        else if( angle > 45 && angle <= 135 )
        {
            selector = 0;
        }
        else if( angle < -45 && angle >= -135 )
        {
            selector = 2;
        }
        else
        {
            selector = 3;
        }
        if( sgY%2 == 0 )
        {
            if( sgX%2 == 0 )
            {//4: LU/RD /
                if( selector == 1 || selector == 2 )
                {
                    return mrect;
                }
                else
                {
                    return mrect - theLayer.cgMapSize.width - 1;
                }
            }
            else
            {//3: LD/RU \
                if( selector == 1 || selector == 0 )
                {
                    return mrect;
                }
                else
                {
                    return mrect + theLayer.cgMapSize.width - 1;
                }
            }
        }
        else
        {
            if( sgX%2 == 0 )
            {//2: F/B \
                if( selector == 1 || selector == 0 )
                {
                    return mrect;
                }
                else
                {
                    return mrect - 1;
                }
            }
            else
            {//1: F/B /
                if( selector == 1 || selector == 2 )
                {
                    return mrect;
                }
                else
                {
                    return mrect - 1;
                }
            }
        }
    }
}

function setCloud()
{
    var cloud = {};
    var start = cc.p(-200 - Math.random()*(theLayer.mapsize.width/2 - 200),
                     Math.random()*theLayer.mapsize.height - theLayer.mapsize.height/2);
    start = cc.pAdd(start, theLayer.cloudnode.getPosition());
    cloud.start = start;
    var end = cc.pAdd(start, cc.p(400+Math.random()*(theLayer.mapsize.width/2-400)));
    cloud.end = end;

    cloud.sh = cc.Sprite.create("cloudshadow.png");
    cloud.sh.setOpacity(0);
    cloud.sh.setPosition(start);

    cloud.sp = cc.Sprite.create("cloud.png");
    cloud.sp.setOpacity(0);
    cloud.sp.setPosition(cc.pAdd(start, cc.p(0, CLOUD_HIGH)));

    theLayer.cloudnode.addChild(cloud.sh);
    theLayer.cloudnode.addChild(cloud.sp);

    cloud.fadeout = false;
    cloud.speed = 10 + Math.random()*5;
    cloud.sp.runAction(cc.FadeIn.create(2));
    cloud.sh.runAction(cc.FadeIn.create(2));

    theLayer.clouds.push(cloud);
}

function runCloud(delta)
{
    theLayer.clouds = theLayer.clouds.filter(function(cloud)
    {
        var np = cloud.sh.getPosition();
        np.x += delta*cloud.speed;
        cloud.sh.setPosition(np);
        np.y += CLOUD_HIGH;
        cloud.sp.setPosition(np);

        if( !cloud.fadeout )
        {
            var step = cloud.speed*2;
            var dist = cloud.end.x - np.x;
            if( dist <= step )
            {
                cloud.sp.runAction(cc.FadeOut.create(2));
                cloud.sh.runAction(cc.FadeOut.create(2));
                cloud.fadeout = true;
            }
        }

        if( np.x >= cloud.end.x )
        {
            theLayer.cloudnode.removeChild(cloud.sp);
            theLayer.cloudnode.removeChild(cloud.sh);
            return false;
        }
        else
        {
            return true;
        }
    });
}

function setBird()
{
    //debug("setBird");
    var bird = {};

    //generate path
    var path = [];
    var pathlen = 4 + Math.floor(Math.random()*5);
    var lastPos = cc.p(Math.random()*theLayer.mapsize.width, Math.random()*theLayer.mapsize.height);
    bird.lnpos = lastPos;
    path.push(lastPos);
    for(var i=1; i<pathlen; ++i)
    {
        do{
            var radian = Math.random()*Math.PI*2;
            var dir = cc.pForAngle(radian);
            var dst = 300+Math.random()*800;
            var newPos = cc.pAdd(lastPos, cc.pMult(dir, dst));
            var validPos = true;
            if( newPos.x < 0
                || newPos.y < 0
                || newPos.x >= theLayer.mapsize.width
                || newPos.y >= theLayer.mapsize.height )
            {
                validPos = false;
            }
        }
        while(!validPos);
        path.push(newPos);
        lastPos = newPos;
    }
    //debug("PATH="+JSON.stringify(path));
    //generate segments
    var segments = [];
    for(var j=0; j<pathlen; ++j)
    {
        var seg = {};
        if( j==0 )
        {
            var t1 = path[0];
            var t2 = path[1];
            seg.p1 = t1;
            seg.p3 = cc.pMidpoint(t1, t2);
            seg.p2 = cc.pMidpoint(seg.p1, seg.p3);
            seg.len = cc.pDistance(seg.p2, seg.p1) + cc.pDistance(seg.p3, seg.p2);
        }
        else if( j==pathlen-1 )
        {
            var t1 = path[j-1];
            var t2 = path[j];
            seg.p1 = cc.pMidpoint(t1, t2);
            seg.p3 = t2;
            seg.p2 = cc.pMidpoint(seg.p1, seg.p3);
            seg.len = cc.pDistance(seg.p2, seg.p1) + cc.pDistance(seg.p3, seg.p2);
        }
        else
        {
            var t1 = path[j-1]
            var t2 = path[j];
            var t3 = path[j+1];
            seg.p1 = cc.pMidpoint(t1, t2);
            seg.p2 = t2;
            seg.p3 = cc.pMidpoint(t2, t3);
            seg.len = cc.pDistance(seg.p2, seg.p1) + cc.pDistance(seg.p3, seg.p2);
        }
        segments.push(seg);
    }
    //debug("SEGMENTS="+JSON.stringify(segments));
    bird.segments = segments;
    bird.sindex = 0;
    bird.sfly = 0;

    bird.body = cc.Sprite.create("bird.png");
    bird.body.setOpacity(0);
    bird.shadow = cc.Sprite.create("birdshadow.png");
    bird.shadow.setOpacity(0);
    theLayer.map.addChild(bird.shadow);
    theLayer.map.addChild(bird.body);

    theLayer.birds.push(bird);
}

function runBird(delta)
{
    theLayer.birds = theLayer.birds.filter(function(bird)
    {
        var seg = bird.segments[bird.sindex];
        var alpha = bird.sfly/seg.len;
        var m1 = cc.pLerp(seg.p1, seg.p2, alpha);
        var m2 = cc.pLerp(seg.p2, seg.p3, alpha);
        var oldpos = bird.shadow.getPosition();
        var newpos = cc.pLerp(m1, m2, alpha);
        bird.shadow.setPosition(newpos);
        bird.body.setPosition(cc.pAdd(newpos, cc.p(0, BIRD_HIGH)));
        if( bird.sindex == 0 )
        {//fade in
            var op = Math.floor(255*alpha);
            bird.body.setOpacity(op);
            bird.shadow.setOpacity(op);
        }
        else if( bird.sindex == bird.segments.length-1 )
        {//fade out
            var op = 255 - Math.floor(255*alpha);
            bird.body.setOpacity(op);
            bird.shadow.setOpacity(op);
        }
        else
        {
            bird.body.setOpacity(255);
            bird.shadow.setOpacity(255);
        }

        //calc facing
        var face = cc.pSub(newpos, oldpos);
        var angle = cc.RADIANS_TO_DEGREES(cc.pToAngle(face));
        var rot = 90 - angle;
        bird.shadow.setRotation(rot);
        bird.body.setRotation(rot);

        //go frame
        var step = 50*delta;
        var left = seg.len-bird.sfly;
        if( left > step )
        {//not reach
            bird.sfly += step;
        }
        else
        {//reach
            bird.sindex++;
            //debug("SINDEX = "+bird.sindex);
            bird.sfly = 0;
            if( bird.sindex >= bird.segments.length )
            {//route complete
                theLayer.map.removeChild(bird.body);
                theLayer.map.removeChild(bird.shadow);
                return false;
            }
        }
        return true;
    });
}

function onMode(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    if( theType == TYPE_NORMAL ){
        onChallenge();
    }
    else if( theType == TYPE_CHALLENGE ){
        onNormal();
    }
}

function onNormal(){
    theType = TYPE_NORMAL;
    var chInst = engine.user.stage.Chapters[theChapterClass.chapterId];
    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.stage.owner.nodeNormal.setVisible(true);
    theLayer.stage.owner.nodeChallenge.setVisible(false);

    //hide all seven stage buttons
    for(var k=1; k<=7; ++k){
        var btn = theLayer.stage.owner.menu.getChildByTag(k);
        btn.setVisible(true);
    }

    debug("chInst = \n"+JSON.stringify(chInst));
    //show the seven stage buttons
    var curStageIndex = 0;
    var foreverStage = false;
    for(var k in theChapterClass.stage)
    {
        var n = Number(k);
        var stg = theChapterClass.stage[k];

        if( stg.isInfinite ){//skip infinite
            if( chInst.Stages[k] != null && chInst.Stages[k].State >= 1 ){
                foreverStage = true;
                theLayer.INFIKEY = Number(k);
            }
            continue;
        }

        var stageKey = "spriteStage"+(n+1);
        var stageNode = theLayer.stage.owner[stageKey];

        var sta = 0;
        if( chInst.Stages[k] != null )
        {
            sta = chInst.Stages[k].State;
        }
        if( /*stg.hidden != true ||*/ sta != 0 )
        {
            stageNode.setVisible(true);
        }
        switch(sta)
        {
            case 0://未激活
                break;
            case 1://已激活
                break;
            case 2://已击穿
                stageNode.setDisplayFrame(sfc.getSpriteFrame("dungeoniconbg1.png"));
                break;
        }
        if( sta > 0 )
        {
            curStageIndex = n;
        }
    }
    selectStage(curStageIndex);
    if( foreverStage ){
        debug("FOREVER STAGE IS ENABLED");
        theLayer.stage.owner.btnMode.setEnabled(true);
    }
    else{
        debug("FOREVER STAGE IS DISABLED");
        theLayer.stage.owner.btnMode.setEnabled(false);
    }
    //set challenge button
    theLayer.stage.owner.btnMode.setNormalSpriteFrame(sfc.getSpriteFrame("map-btn-wjms1.png"));
    theLayer.stage.owner.btnMode.setSelectedSpriteFrame(sfc.getSpriteFrame("map-btn-wjms2.png"));
    theLayer.stage.owner.btnMode.setDisabledSpriteFrame(sfc.getSpriteFrame("map-btn-wjms2.png"));
}

function getInfiPrize(dungeon, level){
    var infiPrize = dungeon.infinityPrize;
    for(var k in infiPrize){
        var pl = infiPrize[k];
        if( pl.level >= level ){
            return pl;
        }
    }
    //if not found
    return {
        level: -1
    };
}

function onChallenge(){
    theType = TYPE_CHALLENGE;
    var chInst = engine.user.stage.Chapters[theChapterClass.chapterId];
    var sfc = cc.SpriteFrameCache.getInstance();
    theLayer.stage.owner.nodeNormal.setVisible(false);
    theLayer.stage.owner.nodeChallenge.setVisible(true);
    if( theLayer.stage.spriteSelect != null)
    {
        theLayer.stage.spriteSelect.setVisible(false);
    }

    //hide all seven stage buttons
    for(var k=1; k<=7; ++k){
        var btn = theLayer.stage.owner.menu.getChildByTag(k);
        btn.setVisible(false);
    }
    //set challenge button
    theLayer.stage.owner.btnMode.setNormalSpriteFrame(sfc.getSpriteFrame("map-btn-zcms1.png"));
    theLayer.stage.owner.btnMode.setSelectedSpriteFrame(sfc.getSpriteFrame("map-btn-zcms2.png"));
    theLayer.stage.owner.btnMode.setDisabledSpriteFrame(sfc.getSpriteFrame("map-btn-zcms2.png"));

    var team = 3;
    if( Math.floor(chInst.Stages[theLayer.INFIKEY].Level%10 == 0 )){
        team = 1;
    }
    else if( Math.floor(chInst.Stages[theLayer.INFIKEY].Level%5) == 0 ){
        team = 2;
    }
    theLayer.TEAM = team;
    theLayer.stage.owner.labelTeam.setString("队伍人数："+team+"人");
    theLayer.stage.owner.labelLevel.setString(chInst.Stages[theLayer.INFIKEY].Level);

    theStageClass = theLayer.CHCLASS.stage[theLayer.INFIKEY];
    theLayer.stageSelected = theStageClass.stageId;
    theLayer.COST = theStageClass.cost;
    var dungeon = table.queryTable(TABLE_DUNGEON, theStageClass.dungeon);
    var prize = getInfiPrize(dungeon, chInst.Stages[theLayer.INFIKEY].Level);
    var preview = libItem.ItemPreview.create([prize]);
    theLayer.stage.owner.labNext.setString("打通第"+prize.level+"关可以获得额外奖励：");
    theLayer.stage.owner.nodePrize.addChild(preview);
    theLayer.stage.owner.labelEnergy.setString("精力消耗："+theLayer.COST+"点");

    theEnergyCost = theLayer.COST;
    engine.session.set("stage", theStageClass);
}

function showStages(chId)
{
    var stage = engine.ui.newLayer();
    var mask = blackMask();
    stage.addChild(mask);
    var winSize = cc.Director.getInstance().getWinSize();
    theLayer.stageLayer = stage;
    theLayer.stage = {};
    theLayer.stage.owner = {};
    theLayer.stage.owner.onStage = onSelectStage;
    theLayer.stage.owner.onMode = onMode;
    theLayer.stage.node = cc.BuilderReader.load("ui-stage.ccbi", theLayer.stage.owner);
    theLayer.stage.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
    stage.addChild(theLayer.stage.node);
    engine.ui.regMenu(theLayer.stage.owner.menu);

    //set values
    theLayer.CHID = chId;
    theLayer.CHCLASS = table.queryTable(TABLE_STAGE, chId);
    var chClass = theLayer.CHCLASS;
    theChapterClass = theLayer.CHCLASS;
    var sfc = cc.SpriteFrameCache.getInstance();

    theLayer.stage.owner.spriteIcon1.setDisplayFrame(sfc.getSpriteFrame(chClass.icon));
    theLayer.stage.owner.spriteIcon2.setDisplayFrame(sfc.getSpriteFrame(chClass.icon));
    theLayer.stage.owner.spriteTitle.setDisplayFrame(sfc.getSpriteFrame("x"+chClass.title));
    theLayer.stage.owner.labelDesc.setString(chClass.desc);
    var btnOK = buttonNormalL("buttontext-confirm.png", BUTTON_OFFSET, this, onBtnOK, BUTTONTYPE_DEFAULT);
    btnOK.setPosition(theLayer.stage.owner.nodeButton2.getPosition());
    theLayer.stage.owner.menu.addChild(btnOK);
    var btnCancel = buttonNormalL("buttontext-qx.png", BUTTON_OFFSET, this, onBtnCancel);
    btnCancel.setPosition(theLayer.stage.owner.nodeButton1.getPosition());
    theLayer.stage.owner.menu.addChild(btnCancel);

    onNormal();

    theLayer.stage.node.setScale(0);
    theLayer.stage.node.runAction(actionPopIn());
}

function hideStages()
{
    theLayer.stage.node.runAction(actionPopOut(function(){
        engine.ui.removeLayer(theLayer.stageLayer);
        delete theLayer.stageLayer;
        delete theLayer.stage;
    }));
}

function onBtnOK(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    hideStages();
    startStage(theLayer.stageSelected, theLayer.TEAM, theEnergyCost);
    debug("START STAGE "+theLayer.CHID+" - "+theLayer.stageSelected);
}

function onBtnCancel(sender)
{
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    hideStages();
}

function selectStage(sId)
{
    var num = sId+1;
    var stageKey = "spriteStage"+num;
    var stageNode = theLayer.stage.owner[stageKey];

    if( theLayer.stage.spriteSelect == null)
    {
        theLayer.stage.spriteSelect = cc.Sprite.createWithSpriteFrameName("mapicon-selected.png");
        theLayer.stage.node.addChild(theLayer.stage.spriteSelect);
    }
    else{
        theLayer.stage.spriteSelect.setVisible(true);
    }
    theLayer.stage.spriteSelect.setPosition(stageNode.getPosition());

    var chClass = table.queryTable(TABLE_STAGE, theLayer.CHID);
    var stg = chClass.stage[sId];
    theStageClass = stg;
    theLayer.stageSelected = stg.stageId;
    theLayer.TEAM = stg.team;
    theLayer.stage.owner.labelTeam.setString("队伍人数："+stg.team+"人");
    theLayer.stage.owner.labelEnergy.setString("精力消耗："+stg.cost+"点");
    theEnergyCost = stg.cost;

    //set current stage data
    engine.session.set("stage", stg);
}

function onSelectStage(sender)
{
    var tag = sender.getTag();
    var stageKey = "spriteStage"+tag;
    var stageNode = theLayer.stage.owner[stageKey];
    if( stageNode.isVisible() )
    {
        selectStage(tag -1);
        cc.AudioEngine.getInstance().playEffect("xuanze.mp3");
    }
}

function onTouchBegan(touch, event)
{
    var pos = touch.getLocation();
    theLayer.beginTouch = pos;
    theLayer.beginMapPos = theLayer.mapnode.getPosition();

    return true;
}

function onTouchMoved(touch, event)
{
    var pos = touch.getLocation();
    var dis = cc.pSub(pos, theLayer.beginTouch);
    var np = cc.pAdd(theLayer.beginMapPos, dis);
    var op = theLayer.mapnode.getPosition();
    //check map restriction
    if( np.x < theLayer.mapMinX )
    {
        np.x = theLayer.mapMinX;
    }
    if( np.x > theLayer.mapMaxX )
    {
        np.x = theLayer.mapMaxX;
    }
    if( np.y < theLayer.mapMinY )
    {
        np.y = theLayer.mapMinY;
    }
    if( np.y > theLayer.mapMaxY )
    {
        np.y = theLayer.mapMaxY;
    }
    theLayer.mapnode.setPosition(np);
    var mdis = cc.pSub(np, op);
    mdis.x *= 0.9;
    mdis.y *= 0.9;
    var nnp = cc.pAdd(theLayer.cloudnode.getPosition(), mdis);
    theLayer.cloudnode.setPosition(nnp);
}

function onTouchEnded(touch, event)
{
    var pos = touch.getLocation();

    var dis = cc.pDistance(pos, theLayer.beginTouch);
    if( dis < CLICK_RANGE )
    {//touch
        var rpos = theLayer.map.convertTouchToNodeSpace(touch);
        rpos.y = theLayer.mapsize.height - rpos.y - theLayer.tilesize.height/2;
        var grid = calcGrid(rpos);
        if( grid >= 0 && grid <= theLayer.maxgrid )
        {
            var gridPos = cc.p(Math.floor(grid%theLayer.cgMapSize.width), Math.floor(grid/theLayer.cgMapSize.width));
            //set grid
            var chId = engine.user.stage.getChapterIdFromGrid(gridPos);
            if( chId > 0 )
            {
                showStages(chId);
                cc.AudioEngine.getInstance().playEffect("xuanze.mp3");
            }
        }
    }
}

function onTouchCancelled(touch, event)
{
    theLayer.onTouchEnded(touch, event);
}

function scene()
{
    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onEvent
    };
}

//-------------------
function startStage(stg, team, cost){
    debug("startStage("+stg+", "+team+", "+cost+")");
    //check energy
    if( engine.user.player.Energy < cost ){
        var need = cost - engine.user.player.Energy;
        var str1 = "精力值不足\n进入此关还需要"+need+"精力\n需要使用"+need+"宝石来立即恢复吗?";
        var str2 = "精力值不足，无法进入此关\n使用"+need+"宝石可以立即恢复\n需要充值吗?";
        libUIKit.confirmPurchase(Request_BuyFeature, {
            typ: 0,
            tar: cost
        }, str1, str2, cost, function(rsp){
            if( rsp.RET == RET_OK ){
                //统计
                tdga.itemPurchase("精力值", need, 1);
            }
        });
        return;
    }

    var dungeon = {};
    dungeon.stage = stg;
    dungeon.party = [];
    dungeon.team = team;
    engine.user.setData("dungeon", dungeon);

    if( dungeon.team > 1 )
    {//choose teammate
        loadModule("sceneTeam.js").show(team);
    }
    else
    {//start dungeon
        engine.user.dungeon.party[0] = engine.user.actor;
        requestBattle(engine.user.dungeon.stage);
    }
}

exports.startStage = startStage;
exports.scene = scene;