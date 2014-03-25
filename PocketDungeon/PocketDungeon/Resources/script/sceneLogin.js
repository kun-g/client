/**
 * User: hammer
 * Date: 13-7-5
 * Time: 下午6:50
 */

var role = loadModule("role.js");
var ui = loadModule("UIComposer.js");
var libUIKit = loadModule("uiKit.js");
var theLayer = null;
var update_url = "";
var update_tar = 0;
var update_cnt = 0;
var update_process = 0;
var theSuppressLogin = false;

var loadReady;
var loadFlag;
var tutorialId;

var remoteServer = [
    {"ip":"61.174.8.226", "port":7756},
    {"ip":"101.69.181.231", "port":7756}
];

var localServer = [
    {"ip":"61.174.8.226", "port":7757},
    {"ip":"101.69.181.231", "port":7757}
];

var currentServer;
var serverLabel;
var btnChange;
var btnStart;

var echo_reply;
var echo_rv;
var echo_bv;
var echo_rvurl;
var echo_bvurl;

function onUACReady(){
    uac.presentLoginView();
}

function onLoggedIn(token){
    debug("onLoggedIn("+token+")");
    theLayer.btnLogin.setVisible(false);
    //send login request
    var arg = {};
    arg.id = uac.getUserName();
    arg.tp = engine.game.getConfig().account_type;
    arg.bv = system.getBinaryVersion();
    arg.rv = engine.game.getConfig().resource_version;
    arg.ch = engine.game.getConfig().binary_channel;
    arg.tk = token;

    engine.session.accountName = uac.getUserName();
    engine.session.accountId = uac.getUserId();

    engine.event.sendRPCEvent(Request_AccountLogin, arg, LoginResp, theLayer);
}

function onLoggedOut(){
    debug("onLoggedOut");
    reboot();
}

function onLoginViewClosed(){
    debug("onLoginViewClosed");
}

function onManageViewClosed(){
    debug("onManageViewClosed");
}

var uacDelegate = {};
uacDelegate.onUACReady = onUACReady;
uacDelegate.onLoggedIn = onLoggedIn;
uacDelegate.onLoggedOut = onLoggedOut;
uacDelegate.onLoginViewClosed = onLoginViewClosed;
uacDelegate.onManageViewClosed = onManageViewClosed;

function onEvent(event)
{
    switch (event.NTF) {
        case Message_SyncBegin:
        {
            debug("开始同步");
            updateLoading("正在同步数据", 0.3, true);
            return true;
        }
        case Message_SyncUpdate:
        {
            debug("同步中");
            var segment = 0.5/event.arg.total;
            var process = 0.3+segment*event.arg.count;
            updateLoading("正在同步数据", process);
            return true;
        }
        case Message_SyncEnd:
        {
            debug("同步完成");
            if( engine.user.actor.Gender == 0 ){
                tdga.setGender(2);
            }
            else{
                tdga.setGender(1);
            }
            engine.user.actor.fix();
            tdga.setLevel(engine.user.actor.Level);

            updateLoading("正在登陆", 0.8, true);
            engine.event.processNotification(Message_LoadReady, LOAD_MENU);

            return true;
        }
        case Message_LoadReady:
        {
            loadReady = true;
            loadFlag = event.arg;
            updateLoading("正在进入游戏", 1);

            return true;
        }
        case Message_StartTutorial:
        {
            tutorialId = event.arg;
            return true;
        }
        case Event_Echo:
        {
            if( event.sign >= 0 && !echo_reply ){
                echo_reply = true;
                theLayer.stopActionByTag(0);//stop the race
                engine.event.selectTestServer(event.sign);
                echo_rv = event.rv;
                echo_bv = event.bv;
                echo_rvurl = event.rvurl;
                echo_bvurl = event.bvurl;
                invokeLogin();
                //startLogin();
            }
            return true;
        }
    }
    return false;
}

function updateInvoke()
{
    var cur = engine.game.getConfig().resource_version;
    if( cur < update_tar )
    {
        var toupdate = cur+1;
        var http = update_url+toupdate;
        var target = file.getDocumentPath()+PATH_DOWNLOAD+"update.zip";
        debug("Updating RES("+toupdate+") @ "+http);
        file.download(target, http, updateCallback);
        updateLoading("正在下载更新", update_process);
    }
    else
    {
        //clear game profile
        engine.user.clearAllProfiles();
        //restart game
        reboot();
    }
}

function updateCallback(status, dlnow, dltotal)
{
    var segment = 1/update_cnt;
    switch(status)
    {
        case -1:
        {//更新失败
            updateLoading("下载失败，请稍后再试", update_process);
        }
            break;
        case 0:
        {//更新进度
            var step = segment*dlnow/dltotal;
            var progress = update_process + step;
            updateLoading("正在下载更新", progress, true);
        }
            break;
        case 1:
        {//更新完成
            //安装更新
            var update = file.getDocumentPath()+PATH_DOWNLOAD+"update.zip";
            var target = file.getDocumentPath();
            if( file.unzip(target, update) )
            {
                var cur = engine.game.getConfig().resource_version;
                cur += 1;
                engine.game.getConfig().resource_version = cur;
                engine.game.saveConfig();

                update_process += segment;
            }
            file.remove(update);
            updateInvoke();
        }
            break;
    }
}

function updateLoading(title, percentage, instant)
{
    theLayer.TargetPercentage = percentage;
    theLayer.BeginPercentage = theLayer.CurrentPercentage;
    theLayer.CatchTimer = 0;
    theLayer.label.setString(title);
    if( instant === true ){
        theLayer.CurrentPercentage = percentage;
        var rect = cc.rect(theLayer.loadrect.x, theLayer.loadrect.y, theLayer.loadrect.width, theLayer.loadrect.height);
        rect.width *= percentage;
        theLayer.clip.setClipRect(rect);
    }
}

function onAlert(button){
    reboot();
}

function LoginResp(rsp){
    switch(rsp.RET){
        case RET_OK:
        {
            engine.event.processNotification(Message_AccountLoginSuccess, rsp.arg);
        }break;
        case RET_AppVersionNotMatch:
        {
            var alert = libUIKit.alert();
            alert.setContent("游戏需要更新新的版本\n是否立即更新?");
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
                            system.openURL(rsp.arg.url);
                        }));
                    },
                    obj: alert,
                    type: BUTTONTYPE_DEFAULT
                }
            ]);
        }break;
        case RET_ResourceVersionNotMatch:
        {
            debug("Updating RES from "+rsp.arg.url);
            update_url = rsp.arg.url;
            update_tar = rsp.arg.tar;
            //check last slash
            if( update_url[update_url.length-1] != "/" ){
                update_url += "/";
            }
            var cur = engine.game.getConfig().resource_version;
            update_cnt = update_tar - cur;
            if( update_cnt > 0 ){
                update_process = 0;
                updateInvoke();
            }
            else{
                libUIKit.showAlert("此版本不能识别，请重新下载安装。");
            }
        }break;
        case RET_AccountHaveNoHero:
        {
            newUserFlag = true;

            engine.user.initProfile("new");
            engine.event.setPassport(rsp.arg.pid);
            engine.ui.newScene(loadModule("openScene.js").scene());
        }break;
    }
}

function invokeLogin()
{
    /* 暂时不在此做硬版本检测
    if( echo_bv != system.getBinaryVersion() ){
        var alert = libUIKit.alert();
        alert.setContent("游戏需要更新新的版本\n是否立即更新?");
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
                        system.openURL(echo_bvurl);
                    }));
                },
                obj: alert,
                type: BUTTONTYPE_DEFAULT
            }
        ]);
        return;
    }
    */
    if( echo_rv != engine.game.getConfig().resource_version ){
        debug("Updating RES from "+echo_rvurl);
        update_url = echo_rvurl;
        update_tar = echo_rv;
        //check last slash
        if( update_url[update_url.length-1] != "/" ){
            update_url += "/";
        }
        var cur = engine.game.getConfig().resource_version;
        update_cnt = update_tar - cur;
        if( update_cnt > 0 ){
            update_process = 0;
            updateInvoke();
        }
        else{
            libUIKit.showAlert("此版本不能识别，请重新下载安装。");
        }
        return;
    }
    startLogin();
}

function startLogin()
{
    theLayer.loadingCircle.setVisible(false);
    theLayer.btnLogin.setVisible(true);

    updateLoading("登录中", 0.05);
    uac.setDelegate(uacDelegate);
    uac.init();
}

function serverTimeOut(){
    theLayer.loadingCircle.setVisible(false);
    system.alert("连接失败","无法连接到服务器，请稍后再试", this, onAlert, "重试");
}

function onStartGame(sender){
    if( engine.game.getConfig().debug ){
        currentServer = localServer;
    }
    else{
        currentServer = remoteServer;//默认外网
    }

    //libUIKit.pushLoading();
    {
        var winSize = cc.Director.getInstance().getWinSize();
        theLayer.loadingCircle = cc.Sprite.create("loading.png");
        theLayer.loadingCircle.setPosition(cc.p(winSize.width/2, winSize.height/2));
        theLayer.addChild(theLayer.loadingCircle);
        var rotate = cc.RotateBy.create(1, 120);
        var repeat = cc.RepeatForever.create(rotate);
        theLayer.loadingCircle.runAction(repeat);
    }
    echo_reply = false;
    engine.event.testServers(currentServer);
    var dy = cc.DelayTime.create(15);
    var call = cc.CallFunc.create(serverTimeOut, theLayer);
    var seq = cc.Sequence.create(dy, call);
    seq.setTag(0);
    theLayer.runAction(seq);
}

function onEnter()
{
    theLayer = engine.ui.curLayer;

    theLayer.update = update;
    theLayer.scheduleUpdate();

    var director = cc.Director.getInstance();
    var winSize = director.getWinSize();

    var bg = cc.Sprite.create("cover.png");
    bg.setPosition(cc.p(winSize.width/2, winSize.height/2));
    theLayer.addChild(bg);

    //cc.AudioEngine.getInstance().playMusic("boss.mp3", true);

    //make a loading bar
    var pos = cc.p(winSize.width/2, winSize.height/7);
    var bg = cc.Sprite.create("loadingbg.png");
    bg.setPosition(pos);
    theLayer.addChild(bg);

    theLayer.clip = cc.RectClip.create();
    theLayer.addChild(theLayer.clip);
    var bar = cc.Sprite.create("loadingbar.png");
    bar.setPosition(pos);
    var size = bar.getContentSize();
    theLayer.clip.addChild(bar);
    theLayer.loadrect = cc.rect(pos.x - size.width/2, pos.y - size.height/2, size.width, size.height);
    theLayer.clip.setClipRect(theLayer.loadrect);

//    var frame = cc.Sprite.create("loadingframe.png");
//    frame.setPosition(cc.p(winSize.width/2, winSize.height/5));
//    theLayer.addChild(frame);

    var menu = cc.Menu.create();
    menu.setPosition(cc.p(0, 0));
    theLayer.addChild(menu);
    theLayer.btnLogin = cc.MenuItemImage.create("btn-dlyx1.png", "btn-dlyx2.png", function(sender){
        uac.presentLoginView();
    }, theLayer);
    theLayer.btnLogin.setPosition(cc.p(winSize.width/2, winSize.height/4));
    theLayer.btnLogin.setVisible(false);
    menu.addChild(theLayer.btnLogin);

    theLayer.label = cc.LabelTTF.create("", UI_FONT, UI_SIZE_XL, size, cc.TEXT_ALIGNMENT_CENTER);
    theLayer.label.setAnchorPoint(cc.p(0.5, 0.5));
    theLayer.label.setPosition(cc.p(pos.x - 2.5, pos.y-10 + 2.5));
    theLayer.addChild(theLayer.label);

    updateLoading("正在登陆游戏", 0, true);

    theLayer.logo = cc.Sprite.create("pdlogo2.png");
    theLayer.logo.setPosition(cc.p(winSize.width/2, winSize.height));
    theLayer.addChild(theLayer.logo);

    var mv1 = cc.MoveBy.create(0.2, cc.p(0, -210));
    var mv2 = cc.MoveBy.create(0.1, cc.p(0, 10));
    var seq = cc.Sequence.create(mv1, mv2);
    theLayer.logo.runAction(seq);

    loadReady = false;
    tutorialId = -1;

    //增加版本号
    var version = cc.LabelTTF.create(system.getBinaryVersion()+" R"+engine.game.getConfig().resource_version,
        UI_FONT, UI_SIZE_S);
    version.setAnchorPoint(cc.p(0, 1));
    version.setPosition(cc.p(10, winSize.height - 10));
    this.addChild(version);

    if( !theSuppressLogin ){
        onStartGame();
    }

    engine.event.releaseNotifications();
    debug("- LOGIN ENTER -");
}

function onExit()
{
}

function update(delta)
{
    if( theLayer.CurrentPercentage != theLayer.TargetPercentage ){
        theLayer.CatchTimer += delta;
        var alpha = theLayer.CatchTimer/1;
        if( alpha >= 1 ){
            theLayer.CurrentPercentage = theLayer.TargetPercentage;
            theLayer.CatchTimer = 0;
            if( loadReady ){
                var dt = cc.DelayTime.create(0.5);
                var cl = cc.CallFunc.create(function(){
                    if( tutorialId >= 0 ){
                        switch(tutorialId){
                            case 0:
                            case 1:
                                var party = [];
                                party.push(engine.user.actor);
                                requestBattle(0, party);
                                return;
                        }
                    }
                    switch(loadFlag){
                        case LOAD_MENU:
                            loadModule("pops.js").setAnnouncement();
                            engine.ui.newScene(loadModule("sceneMain.js").scene());
                            break;
                        case LOAD_DUNGEON:
                            engine.ui.newScene(loadModule("sceneDungeon.js").scene());
                            break;
                    }
                }, theLayer);
                var sq = cc.Sequence.create(dt, cl);
                theLayer.runAction(sq);
            }
        }
        else{
            theLayer.CurrentPercentage = cc.lerp(theLayer.BeginPercentage, theLayer.TargetPercentage, alpha);
        }
        var rect = cc.rect(theLayer.loadrect.x, theLayer.loadrect.y, theLayer.loadrect.width, theLayer.loadrect.height);
        rect.width *= theLayer.CurrentPercentage;
        theLayer.clip.setClipRect(rect);
    }
}

function scene(suppressLogin)
{
    if( suppressLogin == null ){
        suppressLogin = false;
    }
    theSuppressLogin = suppressLogin;

    return {
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onEvent
    };
}

exports.scene = scene;