require("jsb.js");

var engine = {};
var DebugRecorderDungeon;
var DebugRecorderBlackBox;
var isGameLoggedIn = false;

function initEngine()
{
    try{
        require("cocosExtension.js");
        require("shared.js");
        require("constants.js");
        require("debug.js");
        require("common.js");

        DebugRecorderDungeon = new DebugRecorder();
        DebugRecorderBlackBox = new DebugRecorder();
        engine.ui = loadModule("UI.js").instance;
        engine.event = loadModule("Event.js").instance;
        engine.game = loadModule("Game.js").instance;
    }
    catch(e){
        traceError(e);
    }
}

function startEngine()
{
    try{
        engine.user = loadModule("UPM.js").instance;
        engine.session = loadModule("session.js").instance;
        engine.dialogue = loadModule("dialogueDisplay.js").instance;
        engine.msg = PopMsg;
        engine.pop = loadModule("pops.js").instance;
        engine.box = loadModule("blackbox.js");

        engine.game.init();
        engine.event.start();
        engine.box.init();
    }
    catch(e){
        traceError(e);
    }
}

function reboot()
{
    engine.event.processNotification(Message_About2Reboot);
    engine.ui.newScene({
        onEnter: function(){
            var layer = cc.LayerColor.create(cc.c4b(255, 255, 255, 255));
            this.addChild(layer);

            var call = cc.CallFunc.create(function(){
                var director = cc.Director.getInstance();
                director.purgeCachedData();
                cc.AudioEngine.end();

                //reset C part
                system.reset();

                //unload modules
                modules = {};

                //unload tables
                var table = loadModule("table.js");
                table.unloadAllTables();

                //collect garbage
                sys.garbageCollect();

                //start the game
                initEngine();
                engine.ui.newScene(splash());
            });
            this.runAction(call);
        }
    });
}

function splash(){
    return {
        onEnter: function(){
            var layer = cc.LayerColor.create(cc.c4b(255, 255, 255, 255));
            this.addChild(layer);

            var call = cc.CallFunc.create(function(){
                //delayed init
                startEngine();
                isGameLoggedIn = false;
                engine.ui.newScene(loadModule("sceneLogin.js").scene());
            });
            this.runAction(call);
        }
    }
}

function main()
{
    //global init
    //feedback.init();
    system.setAppBadgeNumber(0);
    system.unscheduleAllLocalNotifications();

    //start the game
    initEngine();
    engine.ui.start(splash());
    //engine.ui.start(loadModule("sceneTest.js").scene());
}

main();