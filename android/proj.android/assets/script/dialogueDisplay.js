/**
 * User: hammer
 * Date: 13-12-12
 * Time: 下午2:15
 */

var libTable = loadModule("table.js");

var DIALOGUE_FLAG = false;

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

var LINESPACE = UI_SIZE_L + 6;

var ANIMATION_OVER = 0;
var ANIMATION_OPEN = 1;
var ANIMATION_CLOSE = 2;

function onTouchBegan(touch, event){
    return true;
}

function onTouchMoved(touch, event){}

function onTouchEnded(touch, event){
    if( singleton.FLAG_CONTINUE ){
        singleton.continueTalk();
        singleton.FLAG_CONTINUE = false;
    }
    else if( singleton.FLAG_RUN ){
        singleton.INTERVAL = PRINT_INTERVAL/3;
    }
}

function onTouchCancelled(touch, event){
    onTouchEnded(touch, event);
}

function DialogueDisplay(){
    this.TOSHOW = [];
    this.SHOWING = -1;
    this.DIALOGUE = null;

    this.LAYER = null;
    this.EVENTS = {};
    //runtime animation
    this.FLAG_RUN = false;
    this.CURR_COLOR = DIALOGUE_COLORS[0];
    this.FLAG_CONTINUE = false;
    this.PRINT = 0;
    this.LINEC = 0;
    this.OFF = cc.p(0, 0);
    this.SIZE = cc.size(0, 0);
    this.TIMER = 0;
    this.INTERVAL = PRINT_INTERVAL;

    this.READ_COLOR = false;
    this.READ_VAR = false;
    this.BUFFER = "";

    this.ANIMATION_STATE = ANIMATION_OVER;
}

DialogueDisplay.prototype.update = function(delta){
    if( singleton.FLAG_RUN && singleton.ANIMATION_STATE == ANIMATION_OVER ){
        singleton.TIMER += delta;
        while( singleton.TIMER >= singleton.INTERVAL ){
            //fetch next char
            var char = null;
            if( singleton.BUFFER.length > 0 ){
                char = singleton.BUFFER[0];
                singleton.BUFFER = singleton.BUFFER.substr(1, singleton.BUFFER.length-1);
            }
            else if( singleton.LINE.length > singleton.PRINT ){
                char = singleton.LINE[singleton.PRINT];
                singleton.PRINT++;
            }

            if( char != null ){
                switch (char){
                    case "{":
                        singleton.CURR_COLOR = DIALOGUE_COLORS[1];
                        singleton.READ_COLOR = true;
                        continue;
                    case "}":
                        singleton.CURR_COLOR = DIALOGUE_COLORS[0];
                        continue;
                    case "#":
                        singleton.READ_VAR = true;
                        singleton.READ_COLOR = false;
                        continue;
                    default :
                    {
                       if( singleton.READ_VAR ){
                            switch(char){
                                case "N":
                                    singleton.BUFFER += engine.user.actor.Name;
                                    break;
                                case "G":
                                    if( engine.user.actor.Gender == 0 ){
                                        singleton.BUFFER += "女";
                                    }
                                    else{
                                        singleton.BUFFER += "男";
                                    }
                                    break;
                                case "C":
                                    var RoleData = libTable.queryTable(TABLE_ROLE, engine.user.actor.ClassId);
                                    singleton.BUFFER += RoleData.className;
                                    break;
                            }
                            singleton.READ_VAR = false;
                            continue;
                       } else if( singleton.READ_COLOR ){
                           var colorRead = false;
                           switch(char){
                               case "N":
                                   singleton.CURR_COLOR = DIALOGUE_COLORS[2];
                                   colorRead = true;
                                   break;
                               case "G":
                                   singleton.CURR_COLOR = DIALOGUE_COLORS[3];
                                   colorRead = true;
                                   break;
                               case "R":
                                   singleton.CURR_COLOR = DIALOGUE_COLORS[4];
                                   colorRead = true;
                                   break;
                               case "E":
                                   singleton.CURR_COLOR = DIALOGUE_COLORS[5];
                                   colorRead = true;
                                   break;
                               case "L":
                                   singleton.CURR_COLOR = DIALOGUE_COLORS[6];
                                   colorRead = true;
                                   break;
                               case "/":
                                   colorRead = true;
                                   break;
                           }
                           singleton.READ_COLOR = false;
                           if( colorRead ){
                               continue;
                           }
                       }
                        singleton.TIMER -= singleton.INTERVAL;
                        var ch = cc.LabelTTF.create(char, UI_FONT, UI_SIZE_L);
                        ch.setColor(singleton.CURR_COLOR);
                        ch.setAnchorPoint(cc.p(0, 1));
                        var width = ch.getContentSize().width;
                        if( singleton.OFF.x + width > singleton.SIZE.width ){
                            singleton.OFF.x = 0;
                            singleton.OFF.y -= LINESPACE;
                        }
                        ch.setPosition(singleton.OFF);
                        singleton.LAYER.owner.lyText.addChild(ch);
                        singleton.OFF.x += width;
                        //play type sound
                        cc.AudioEngine.getInstance().playEffect("talk.wav");
                    }
                }
            }
            else{
                singleton.endTalk();
                break;
            }
        }
    }
}

DialogueDisplay.prototype.startTalk = function(ln){
    this.FLAG_RUN = true;
    this.CURR_COLOR = DIALOGUE_COLORS[0];
    this.READ_COLOR = false;
    this.READ_VAR = false;
    this.BUFFER = "";
    this.FLAG_CONTINUE = false;
    this.PRINT = 0;
    this.LINEC = ln;
    this.LINE = this.DIALOGUE.talks[this.TALKC].text[ln];
    this.OFF = cc.p(0, this.SIZE.height);
    this.TIMER = 0;
    this.LAYER.owner.lyText.removeAllChildren();
    this.LAYER.owner.nodeContinue.setVisible(false);
    this.INTERVAL = PRINT_INTERVAL;
}

DialogueDisplay.prototype.endTalk = function(){
    this.FLAG_RUN = false;
    this.FLAG_CONTINUE = true;
    this.LAYER.owner.nodeContinue.setVisible(true);
}

DialogueDisplay.prototype.continueTalk = function(){
    this.LINEC++;
    if( this.DIALOGUE.talks[this.TALKC].text.length > this.LINEC ){
        this.startTalk(this.LINEC);
    }
    else{
        //trigger event
        if( this.DIALOGUE.talks[this.TALKC].event != null ){
            this.triggerEvent(this.DIALOGUE.talks[this.TALKC].event);
        }
        //end dialogue
        this.TALKC++;
        if( this.TALKC >= this.DIALOGUE.talks.length ){
            this.DIALOGUE = null;
            this.SHOWING = -1;
            debug("* END DIALOGUE 2");

            this.LAYER.node.animationManager.runAnimationsForSequenceNamed("close");
            this.ANIMATION_STATE = ANIMATION_CLOSE;
            this.FLAG_CONTINUE = false;
        }
        else{
            this.displayDialogue(this.SHOWING);
        }
    }
}

DialogueDisplay.prototype.skipDialogue = function(){
    // TODO
}

DialogueDisplay.prototype.triggerEvent = function(event){
    var trigger = this.EVENTS[event];
    if( trigger != null ){
        trigger.FUNC.apply(trigger.OBJ);
    }
}

DialogueDisplay.prototype.setEventCallback = function(event, func, obj){
    this.EVENTS[event] = {
        FUNC: func,
        OBJ: obj
    };
}

DialogueDisplay.prototype.clearEventCallback = function(){
    this.EVENTS = {};
}

DialogueDisplay.prototype.onAnimationComplete = function(name){
    if( singleton.ANIMATION_STATE == ANIMATION_CLOSE ){
        singleton.invokeDialogue();
    }
    singleton.ANIMATION_STATE = ANIMATION_OVER;
}

DialogueDisplay.prototype.displayDialogue = function(did){
    this.DIALOGUE = libTable.queryTable(TABLE_DIALOGUE, did);

    if( this.DIALOGUE != null ){
        this.SHOWING = did;

        if( this.LAYER == null ){
            //create a new layer and node
            this.triggerEvent("onDialogueStart");
            this.LAYER = engine.ui.newLayer();
            DIALOGUE_FLAG = true;
            this.LAYER.mask = blackMask();
            this.LAYER.addChild(this.LAYER.mask);
            this.LAYER.owner = {};
            this.LAYER.node = cc.BuilderReader.load("ui-dialogue.ccbi", this.LAYER.owner);
            var winSize = cc.Director.getInstance().getWinSize();
            this.LAYER.node.setPosition(cc.p(winSize.width/2, winSize.height/2));
            this.LAYER.addChild(this.LAYER.node);

            this.LAYER.onTouchBegan = onTouchBegan;
            this.LAYER.onTouchMoved = onTouchMoved;
            this.LAYER.onTouchEnded = onTouchEnded;
            this.LAYER.onTouchCancelled = onTouchCancelled;
            this.LAYER.setTouchMode(cc.TOUCH_ONE_BY_ONE);
            this.LAYER.setTouchPriority(-1);
            this.LAYER.setTouchEnabled(true);

            engine.ui.regMenu(this.LAYER);

            this.LAYER.update = this.update;
            this.LAYER.scheduleUpdate();

            //init some variables
            this.SIZE = this.LAYER.owner.lyText.getContentSize();

            //run open animation
            this.LAYER.node.animationManager.setCompletedAnimationCallback(this, this.onAnimationComplete);
            this.LAYER.node.animationManager.runAnimationsForSequenceNamed("open");
            this.ANIMATION_STATE = ANIMATION_OPEN;
        }

        var theNode;
        var theName;
        var right = false;
        var talk = this.DIALOGUE.talks[this.TALKC];
        if( talk.role != null ){
            if( this.DIALOGUE.roles[talk.role].right != null ){
                right = this.DIALOGUE.roles[talk.role].right;
            }
        }

        if( right ){
            this.LAYER.owner.nodeRight.setVisible(true);
            this.LAYER.owner.nodeLeft.setVisible(false);
            theNode = this.LAYER.owner.nodeRight;
            theName = this.LAYER.owner.labNameRight;
        }
        else{
            this.LAYER.owner.nodeRight.setVisible(false);
            this.LAYER.owner.nodeLeft.setVisible(true);
            theNode = this.LAYER.owner.nodeLeft;
            theName = this.LAYER.owner.labNameLeft;
        }

        if( talk.role != null ){
            //set avatar
            if( theNode.avatar != null ){
                theNode.removeChild(theNode.avatar);
            }
            theNode.avatar = cc.Sprite.create(this.DIALOGUE.roles[talk.role].avatar);
            theNode.avatar.setAnchorPoint(cc.p(0.5, 0.5));
            theNode.avatar.setPosition(cc.p(0, 0));
            if( right ){
                theNode.avatar.setScaleX(-1);
            }
            theNode.addChild(theNode.avatar);
            //set name
            theName.setString(this.DIALOGUE.roles[talk.role].name);
        }
        else{
            theNode.setVisible(false);
        }

        if( talk.sound != null ){
            cc.AudioEngine.getInstance().playEffect(talk.sound);
        }
        if( talk.music != null ){
            cc.AudioEngine.getInstance().playMusic(talk.music, true);
        }

        //init all data
        this.startTalk(0);
    }
    else{
        this.SHOWING = -1;
        this.invokeDialogue();
    }
}

DialogueDisplay.prototype.invokeDialogue = function(){
    if( this.SHOWING < 0 ){
        if( this.TOSHOW.length > 0 ) {
            var did = this.TOSHOW.shift();
            this.TALKC = 0;
            debug("INVOKE DIALOGUE("+did+")");
            this.displayDialogue(did);
            return true;
        }
        else{
            debug("INVOKE DIALOGUE DISMISS");
            if( this.LAYER != null ){
                engine.ui.removeLayer(this.LAYER);
                this.LAYER = null;
                DIALOGUE_FLAG = false;
                this.triggerEvent("onDialogueEnd")
            }
        }
    }
    debug("EXIT INVOKE DIALOGUE");
    return false;
}

DialogueDisplay.prototype.startDialogue = function(did){
    debug("START DIALOGUE("+did+")");
    this.TOSHOW.push(did);
    this.invokeDialogue();
}

DialogueDisplay.prototype.isPlaying = function(){
    return DIALOGUE_FLAG;
}

var singleton = new DialogueDisplay();

exports.instance = singleton;