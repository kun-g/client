/**
 * User: hammer
 * Date: 13-7-9
 * Time: 下午5:47
 */

var role = loadModule("role.js");
var avatar = loadModule("avatar.js");
var skill = loadModule("skill.js");
var ui = loadModule("UIComposer.js");
var libUIKit = loadModule("uiKit.js");
var theLayer = null;
var theRole = new role.Role();
var theAvatar = null;
var theEditbox = null;
var theButton = null;

function onWarrior(sender)
{
    if( theRole.ClassId != 0 )
    {
        cc.AudioEngine.getInstance().playEffect("xuanze.mp3");

        var sfc = cc.SpriteFrameCache.getInstance();

        if( theLayer.currButton != null )
        {
            var rst = cc.MoveBy.create(0.1, cc.p(0, 35));
            theLayer.currButton.runAction(rst);

            switch(theRole.ClassId)
            {
                case 0:
                    theLayer.owner.btnWarrior.setNormalSpriteFrame(sfc.getSpriteFrame("creat-warrioricon2.png"));
                    theLayer.owner.btnWarrior.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-warrioricon1.png"));
                    break;
                case 1:
                    theLayer.owner.btnMage.setNormalSpriteFrame(sfc.getSpriteFrame("creat-mageicon2.png"));
                    theLayer.owner.btnMage.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-mageicon1.png"));
                    break;
                case 2:
                    theLayer.owner.btnPriest.setNormalSpriteFrame(sfc.getSpriteFrame("creat-priesticon2.png"));
                    theLayer.owner.btnPriest.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-priesticon1.png"));
                    break;
            }
        }

        sender.setNormalSpriteFrame(sfc.getSpriteFrame("creat-warrioricon1.png"));
        sender.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-warrioricon2.png"));

        var mov = cc.MoveBy.create(0.1, cc.p(0, -35));
        sender.runAction(mov);

        theRole.ClassId = 0;
        theLayer.currButton = sender;

        //update outlook
        theRole.Armors = [];
        theRole.fix();
        theAvatar.setRole(theRole);

        theLayer.owner.labDesc.setString(translate(engine.game.language, "sceneNewUserWarrior"));
    }
}

function onMage(sender)
{
    if( theRole.ClassId != 1 )
    {
        cc.AudioEngine.getInstance().playEffect("xuanze.mp3");

        var sfc = cc.SpriteFrameCache.getInstance();

        if( theLayer.currButton != null )
        {
            var rst = cc.MoveBy.create(0.1, cc.p(0, 35));
            theLayer.currButton.runAction(rst);

            switch(theRole.ClassId)
            {
                case 0:
                    theLayer.owner.btnWarrior.setNormalSpriteFrame(sfc.getSpriteFrame("creat-warrioricon2.png"));
                    theLayer.owner.btnWarrior.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-warrioricon1.png"));
                    break;
                case 1:
                    theLayer.owner.btnMage.setNormalSpriteFrame(sfc.getSpriteFrame("creat-mageicon2.png"));
                    theLayer.owner.btnMage.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-mageicon1.png"));
                    break;
                case 2:
                    theLayer.owner.btnPriest.setNormalSpriteFrame(sfc.getSpriteFrame("creat-priesticon2.png"));
                    theLayer.owner.btnPriest.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-priesticon1.png"));
                    break;
            }
        }

        sender.setNormalSpriteFrame(sfc.getSpriteFrame("creat-mageicon1.png"));
        sender.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-mageicon2.png"));

        var mov = cc.MoveBy.create(0.1, cc.p(0, -35));
        sender.runAction(mov);

        theRole.ClassId = 1;
        theLayer.currButton = sender;

        //update outlook
        theRole.Armors = [];
        theRole.fix();
        theAvatar.setRole(theRole);

        theLayer.owner.labDesc.setString(translate(engine.game.language, "sceneNewUserMage"));
    }
}

function onPriest(sender)
{
    if( theRole.ClassId != 2 )
    {
        cc.AudioEngine.getInstance().playEffect("xuanze.mp3");

        var sfc = cc.SpriteFrameCache.getInstance();

        if( theLayer.currButton != null )
        {
            var rst = cc.MoveBy.create(0.1, cc.p(0, 35));
            theLayer.currButton.runAction(rst);

            switch(theRole.ClassId)
            {
                case 0:
                    theLayer.owner.btnWarrior.setNormalSpriteFrame(sfc.getSpriteFrame("creat-warrioricon2.png"));
                    theLayer.owner.btnWarrior.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-warrioricon1.png"));
                    break;
                case 1:
                    theLayer.owner.btnMage.setNormalSpriteFrame(sfc.getSpriteFrame("creat-mageicon2.png"));
                    theLayer.owner.btnMage.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-mageicon1.png"));
                    break;
                case 2:
                    theLayer.owner.btnPriest.setNormalSpriteFrame(sfc.getSpriteFrame("creat-priesticon2.png"));
                    theLayer.owner.btnPriest.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-priesticon1.png"));
                    break;
            }
        }

        sender.setNormalSpriteFrame(sfc.getSpriteFrame("creat-priesticon1.png"));
        sender.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-priesticon2.png"));

        var mov = cc.MoveBy.create(0.1, cc.p(0, -35));
        sender.runAction(mov);

        theRole.ClassId = 2;
        theLayer.currButton = sender;

        //update outlook
        theRole.Armors = [];
        theRole.fix();
        theAvatar.setRole(theRole);

        theLayer.owner.labDesc.setString(translate(engine.game.language, "sceneNewUserPastor"));
    }
}

function onGender(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");

    var sfc = cc.SpriteFrameCache.getInstance();

    if( theRole.Gender == 0 )
    {
        sender.setNormalSpriteFrame(sfc.getSpriteFrame("creat-male1.png"));
        sender.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-male2.png"));

        theRole.Gender = 1;
    }
    else
    {
        sender.setNormalSpriteFrame(sfc.getSpriteFrame("creat-female1.png"));
        sender.setSelectedSpriteFrame(sfc.getSpriteFrame("creat-female2.png"));

        theRole.Gender = 0;
    }
    theAvatar.setRole(theRole);
}

function onChange(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");

    theRole.HairStyle = (theRole.HairStyle+1)%6;
    theRole.HairColor = ++theRole.HairColor%COLOR_HAIR.length;
    theRole.fix();
    theAvatar.setRole(theRole);
}

function onConfirm(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");

    var text = theEditbox.getText();
    text = filterUserInput(text);
    if( text != null && text.length>0 )
    {
        var arg = {};
        arg.nam = text;
        arg.gen = theRole.Gender;
        arg.hst = theRole.HairStyle;
        arg.hcl = theRole.HairColor;
        arg.cid = theRole.ClassId;
        arg.pid = engine.event.getPassport();

        libUIKit.waitRPC(Request_AccountCreate, arg, function(rsp){
            if( rsp.RET == RET_OK ){

                theRole.Name = text;
                engine.user.setData("actor", theRole);
                engine.user.setProfile(text);
                engine.user.saveProfile();

                //set default user
                var config = engine.game.getConfig();
                config.default_user = text;
                engine.game.saveConfig();

                //统计
                tdga.event("Intro#2");

                engine.ui.newScene(loadModule("sceneLogin.js").scene(true));
                engine.event.holdNotifications();
                engine.event.processNotification(Message_AccountLoginSuccess, rsp.arg);

                //Google Analytics & Appsflyer
                if( evtTracker != null ) {
                    evtTracker.createGAIEvent("UserEvent", "Role", "", null);
                    evtTracker.createAFEvent("Role", null);
                }
            }
            else{
                libUIKit.showErrorMessage(rsp);
            }
        }, theLayer);
    }
}

function onEnter()
{
    theLayer = engine.ui.curLayer;

    if( !cc.AudioEngine.getInstance().isMusicPlaying() )
    {
        cc.AudioEngine.getInstance().playMusic("login.mp3", true);
    }

    theLayer.owner = {};
    theLayer.owner.onWarrior = onWarrior;
    theLayer.owner.onMage = onMage;
    theLayer.owner.onPriest = onPriest;
    theLayer.owner.onGender = onGender;
    theLayer.owner.onChange = onChange;
    theLayer.owner.onConfirm = onConfirm;

    var node = cc.BuilderReader.load("sceneNewUser.ccbi", theLayer.owner);
    theLayer.addChild(node);

    engine.ui.regMenu(theLayer.owner.menuRoot);

    var rect = cc.size(400, 80);
    var sprite = cc.Scale9Sprite.create("empity.png");
    theEditbox = cc.EditBox.create(rect, sprite);
    theEditbox.setPlaceholderFontName(UI_FONT);
    theEditbox.setPlaceholderFontSize(UI_SIZE_XL);
    theEditbox.setPlaceholderFontColor(cc.c3b(127, 102, 65));
    theEditbox.setPlaceHolder(translate(engine.game.language, "sceneNewUserRoleName"));
    theEditbox.setFontName(UI_FONT);
    theEditbox.setFontColor(cc.c3b(49, 34, 13));
    theEditbox.setFontSize(UI_SIZE_XL);
    theEditbox.setMaxLength(UI_NAME_LENGTH);
    theEditbox.makeTextAlignCenter();
    theLayer.owner.nodeName.addChild(theEditbox);

    //add confirm button
    theButton = buttonNormalXL("buttontext-confirm.png", BUTTON_OFFSET, theLayer, onConfirm);
    theButton.setPosition(theLayer.owner.nodeButton1.getPosition());
    theLayer.owner.menuRoot.addChild(theButton);

    theLayer.currButton = null;

    theRole.ClassId = 0;
    theRole.Gender = 1;
    theRole.HairStyle = Math.floor(Math.random()*3);
    theRole.HairColor = Math.floor(Math.random()*COLOR_HAIR.length);
    theRole.fix();

    theAvatar = new avatar.UIAvatar({scale: 1.2});

    theRole.ClassId = -1;
    theLayer.owner.nodeRole.addChild(theAvatar.node);

    //default is warrior
    theLayer.owner.onWarrior(theLayer.owner.btnWarrior);

    interval = 0;
    theLayer.update = update;
    theLayer.scheduleUpdate();
}

var interval = 0;
function update(delta){
//    interval += delta;
//    if( interval > 5 ){
//        engine.event.sendNTFEvent(103, {sign: -1});
//        interval = 0;
//    }
}

function onEvent(event){
//    if( event.NTF == Message_OnEnterForeground ){
//        reboot();
//        return true;
//    }
}

function onExit()
{
}

function scene()
{
    return {
        onEnter: onEnter,
        onNotify: onEvent,
        onExit: onExit
    };
}

exports.scene = scene;