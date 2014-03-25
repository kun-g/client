/**
 * User: hammer
 * Date: 13-12-26
 * Time: 下午3:46
 */

var text = [
    "很久很久以前，在怪物肆虐的时代，弱小的人类只能生活在不见天日的密林中以躲避各种怪物的欺凌。",
    "直到奥拉夫和他的伙伴们挺身而出，他们改变了一切，他们是人类的救世主。",
    "几位英雄们击溃了绝大多数怪物，将他们彻底从地面上赶走，残余的敌人们都躲入了地下，人类获得了繁荣与发展。",
    "随着时间的推移，英雄们早已作古，怪物们在地底建造了大量的地下城并伺机卷土重来。",
    "继承英雄力量的勇者们，为保护人类，展开了地下城的冒险⋯⋯"
];

var theLayer;
var theNode;
var theAnim;
var theCount;
var AnimReady;

var LINESPACE = UI_SIZE_L + 6;
var PRINT_INTERVAL = 0.05;
var DIALOGUE_COLORS = [
    cc.c3b(255, 255, 255),//Classic
    cc.c3b(252, 48 , 48 ),//Default Bold
    cc.c3b(165, 165, 172),//[N]ormal Item
    cc.c3b(112, 203, 19 ),//[G]ood Item
    cc.c3b(31 , 187, 255),//[R]are Item
    cc.c3b(198, 63 , 242),//[E]pic Item
    cc.c3b(250, 145, 0  ) //[L]egendary Item
];

var loadList = [
    "open-bg1.png",
    "open-bg2.png",
    "open-bg3.png",
    "open-bg4.png",
    "open-bg5.png",
    "open1-dragon.png",
    "open1-fire.png",
    "open1-m1.png",
    "open1-m2.png",
    "open1-m3.png",
    "open1-m4.png",
    "open1-m5.png",
    "open1-people.png",
    "open1-tree.png",
    "open2-light.png",
    "open2-mage.png",
    "open2-people.png",
    "open2-priest.png",
    "open2-warrior.png",
    "open3-enemy.png",
    "open3-flag1.png",
    "open3-flag2.png",
    "open3-floor1.png",
    "open3-floor2.png",
    "open3-mage.png",
    "open3-priest.png",
    "open3-warrior.png",
    "open4-broken.png",
    "open4-enemy.png",
    "open4-floor.png",
    "open4-knife.png",
    "open4-knife2.png",
    "open4-mage.png",
    "open4-priest.png",
    "open4-warrior.png",
    "open4-x1.png",
    "open4-x2.png",
    "open5-mage.png",
    "open5-mageicon.png",
    "open5-priest.png",
    "open5-priesticon.png",
    "open5-warrior.png",
    "open5-warrioricon.png"
];

var interval = 0;
function update(delta){
    interval += delta;
    if( interval > 5 ){
        engine.event.sendNTFEvent(103, {sign: -1});
        interval = 0;
    }

    if( this.FLAG_RUN ){
        this.TIMER += delta;
        while( this.TIMER >= this.INTERVAL ){
            //fetch next char
            var char = null;
            if( this.LINE.length > this.PRINT ){
                var char = this.LINE[this.PRINT];
                this.PRINT++;
            }
            if( char != null ){
                switch (char){
                    case "{":
                        this.CURR_COLOR = DIALOGUE_COLORS[1];
                        this.READ_COLOR = true;
                        continue;
                    case "}":
                        this.CURR_COLOR = DIALOGUE_COLORS[0];
                        continue;
                    default :
                    {
                        if( this.READ_COLOR ){
                            var colorRead = false;
                            switch(char){
                                case "N":
                                    this.CURR_COLOR = DIALOGUE_COLORS[2];
                                    colorRead = true;
                                    break;
                                case "G":
                                    this.CURR_COLOR = DIALOGUE_COLORS[3];
                                    colorRead = true;
                                    break;
                                case "R":
                                    this.CURR_COLOR = DIALOGUE_COLORS[4];
                                    colorRead = true;
                                    break;
                                case "E":
                                    this.CURR_COLOR = DIALOGUE_COLORS[5];
                                    colorRead = true;
                                    break;
                                case "L":
                                    this.CURR_COLOR = DIALOGUE_COLORS[6];
                                    colorRead = true;
                                    break;
                                case "/":
                                    colorRead = true;
                                    break;
                            }
                            this.READ_COLOR = false;
                            if( colorRead ){
                                continue;
                            }
                        }
                        this.TIMER -= this.INTERVAL;
                        var ch = cc.LabelTTF.create(char, UI_FONT, UI_SIZE_XL);
                        ch.setColor(this.CURR_COLOR);
                        ch.setAnchorPoint(cc.p(0, 1));
                        var width = ch.getContentSize().width;
                        if( this.OFF.x + width > this.SIZE.width ){
                            this.OFF.x = 0;
                            this.OFF.y -= LINESPACE;
                        }
                        ch.setPosition(this.OFF);
                        this.lyText.addChild(ch);
                        this.OFF.x += width;
                        //play type sound
                        cc.AudioEngine.getInstance().playEffect("talk.wav");
                    }
                }
            }
            else{
                endTalk();
                break;
            }
        }
    }
}

function startTalk(ln){
    theLayer.FLAG_RUN = true;
    theLayer.CURR_COLOR = DIALOGUE_COLORS[0];
    theLayer.READ_COLOR = false;
    theLayer.FLAG_CONTINUE = false;
    theLayer.PRINT = 0;
    theLayer.LINEC = ln;
    theLayer.LINE = text[ln];
    theLayer.OFF = cc.p(0, theLayer.SIZE.height);
    theLayer.TIMER = 0;
    theLayer.lyText.removeAllChildren();
    theLayer.INTERVAL = PRINT_INTERVAL;
}

function endTalk(){
    theLayer.FLAG_RUN = false;
    theLayer.FLAG_CONTINUE = true;
}

function continueTalk(){
    theLayer.LINEC++;
    if( text.length > theLayer.LINEC ){
        setAnimation(theLayer.LINEC);
    }
    else{
        //统计
        tdga.event("Intro#1");
        var newuser = loadModule("sceneNewUser.js");
        engine.ui.newScene(newuser.scene());
    }
}

function onTouchBegan(touch, event){
    return true;
}

function onTouchMoved(touch, event){}

function onTouchEnded(touch, event){
    if( theLayer.FLAG_CONTINUE && AnimReady ){
        continueTalk();
        theLayer.FLAG_CONTINUE = false;
    }
    else if( theLayer.FLAG_RUN ){
        theLayer.INTERVAL = PRINT_INTERVAL/3;
    }
}

function onTouchCancelled(touch, event){
    this.onTouchEnded(touch, event);
}

function animationDone(name){
    if( theCount != null ){
        theNode.removeChild(theAnim);
        theAnim = null;
        setAnimation(theCount);
    }
    else{
        startTalk(theLayer.LINEC);
    }
    AnimReady = true;
}

function setAnimation(cnt){
    if( theAnim != null ){
        theAnim.animationManager.runAnimationsForSequenceNamed("close");
        theCount = cnt;
    }
    else{
        var file = "ui-open"+(cnt+1)+".ccbi";
        theAnim = cc.BuilderReader.load(file);
        theAnim.animationManager.setCompletedAnimationCallback(theAnim, animationDone);
        theAnim.animationManager.runAnimationsForSequenceNamed("open");
        theAnim.setPosition(cc.p(0, 0));
        theNode.addChild(theAnim);
        theCount = null;
    }
    AnimReady = false;
}

function onEnter(){
    theLayer = this;

    //load resource
    for(var k in loadList){
        var file = loadList[k];
        cacheSprite(file);
    }

    this.onTouchBegan = onTouchBegan;
    this.onTouchMoved = onTouchMoved;
    this.onTouchEnded = onTouchEnded;
    this.onTouchCancelled = onTouchCancelled;
    this.setTouchMode(cc.TOUCH_ONE_BY_ONE);
    this.setTouchEnabled(true);

    this.update = update;
    this.scheduleUpdate();

    cc.AudioEngine.getInstance().playMusic("login.mp3", true);

    //add text area
    var winSize = cc.Director.getInstance().getWinSize();

    theNode = cc.Node.create();
    theNode.setPosition(cc.p(0, winSize.height - 960));
    this.addChild(theNode);

    if( winSize.height > 960 ){
        var mask = cc.LayerColor.create(cc.c4b(0, 0, 0, 255), winSize.width, winSize.height - 960 + 5);
        mask.setPosition(cc.p(0, 0));
        this.addChild(mask);
    }

    var size = cc.size(500, 200);
    this.lyText = cc.Layer.create();
    this.lyText.setContentSize(size);
    this.lyText.setAnchorPoint(cc.p(0.5, 0));
    this.lyText.setPosition(cc.p(winSize.width/2-size.width/2, winSize.height - 960 + 167 - size.height));
    this.addChild(this.lyText);

    //init
    this.FLAG_RUN = false;
    this.CURR_COLOR = DIALOGUE_COLORS[0];
    this.FLAG_CONTINUE = false;
    this.PRINT = 0;
    this.LINEC = 0;
    this.OFF = cc.p(0, 0);
    this.SIZE = this.lyText.getContentSize();
    this.TIMER = 0;
    this.INTERVAL = PRINT_INTERVAL;
    this.READ_COLOR = false;

    setAnimation(0);

    openScened = true;

    interval = 0;
}

function onEvent(event){
    if( event.NTF == Message_OnEnterForeground ){
        reboot();
        return true;
    }
}

function onExit(){
}

function scene()
{
    return {
        onEnter: onEnter,
        onNotify: onEvent,
        onExit: onExit
    }
}

exports.scene = scene;