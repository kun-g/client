/**
 * User: hammer
 * Date: 14-1-4
 * Time: 下午7:29
 */

var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libKit = loadModule("uiKit.js");
var theLayer;

var MODE_NORMAL = 0;
var MODE_EXIT = 1;
var theMode;

function onClose(sender){
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    theMode = MODE_EXIT;
    theLayer.node.animationManager.runAnimationsForSequenceNamed("close");
}

function onToggleMusic(sender){
    var audio = cc.AudioEngine.getInstance();
    var volume = audio.getMusicVolume();
    if( volume == 0 ){
        audio.setMusicVolume(MUSIC_VOLUME);
        engine.game.getConfig().flag_music = true;
    }
    else{
        audio.setMusicVolume(0);
        engine.game.getConfig().flag_music = false;
    }
    updateMusicLabel();
    volume = audio.getEffectsVolume();
    if( volume == 0 ){
        audio.setEffectsVolume(SFX_VOLUME);
        engine.game.getConfig().flag_sfx = true;
    }
    else{
        audio.setEffectsVolume(0);
        engine.game.getConfig().flag_sfx = false;
    }
    engine.game.saveConfig();
}

function onToggleSfx(sender){
    system.exit();
}

function calcNetwork(tiems,handler) {
	var i = 0;
	var res =[];
	for (i = 0; i< tiems;i++) {
		helper(function(td) {
            debug(td+"  p2");
			res.push(td);
		});
	}
	var r = res.reduce(function (a,b) {return a+b;})/tiems;
    debug(r+"  dddddddd")
	handler(r);
}

function helper(handler) {
	var n = Date();
	var f = function (ret) {
        debug(ret+"  p1");
		handler(Date() -n);
	}
	engine.event.sendRPCEvent(103, {sign: 1}, f);
}

function onFeedback(sender){
	var res = calcNetwork(20, function(r) {
			libKit.showAlert(res);
	});
    //libKit.showAlert("客服电话:0571-85133085\n邮箱:support@tringame.com\n官方QQ交流群号:121017982");
}

function onUACManage(sender){
    uac.presentManageView();
}

function onResetData(sender){
    libKit.confirm("数据出错时请重置数据\n重置数据不会有任何损失", libKit.CONFIRM_DEFAULT, function(){
        engine.user.clearProfile();
        reboot();
    });
}

function onLogout(sender){
    uac.logout();
    reboot();
}

function updateMusicLabel(){
    var audio = cc.AudioEngine.getInstance();
    var volume = audio.getMusicVolume();
    var sfc = cc.SpriteFrameCache.getInstance();
    if( volume == 0 ){
        theLayer.owner.btnMusic.setNormalSpriteFrame(sfc.getSpriteFrame("setting-dkyy1.png"));
        theLayer.owner.btnMusic.setSelectedSpriteFrame(sfc.getSpriteFrame("setting-dkyy2.png"));
    }
    else{
        theLayer.owner.btnMusic.setNormalSpriteFrame(sfc.getSpriteFrame("setting-gbyy1.png"));
        theLayer.owner.btnMusic.setSelectedSpriteFrame(sfc.getSpriteFrame("setting-gbyy2.png"));
    }
}

function onUIAnimationCompleted(name){
    if( theMode == MODE_EXIT ){
        engine.ui.popLayer();
    }
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("setting");
}

function show(){
    theLayer = engine.ui.newLayer({
        onActivate: onActivate
    });
    var mask = blackMask();
    theLayer.addChild(mask);

    cacheSprite("setting-dkyy1.png");
    cacheSprite("setting-dkyy2.png");
    cacheSprite("setting-gbyy1.png");
    cacheSprite("setting-gbyy2.png");
    cacheSprite("setting-tcyx1.png");
    cacheSprite("setting-tcyx2.png");

    theLayer.owner = {};
    theLayer.owner.onClose = onClose;
    theLayer.owner.onToggleMusic = onToggleMusic;
    theLayer.owner.onToggleSfx = onToggleSfx;
    theLayer.owner.onFeedback = onFeedback;
    theLayer.owner.onUACManage = onUACManage;
    theLayer.owner.onResetData = onResetData;
    theLayer.owner.onLogout = onLogout;
    theLayer.node = cc.BuilderReader.load("sceneSetting.ccbi", theLayer.owner);
    theLayer.addChild(theLayer.node);
    theMode = MODE_NORMAL;
    theLayer.node.animationManager.setCompletedAnimationCallback(theLayer, onUIAnimationCompleted);
    theLayer.node.animationManager.runAnimationsForSequenceNamed("open");
    theLayer.owner.btnSfx.setVisible(false);
    if( engine.game.getConfig().binary_channel == "AppStore" ){
        cacheSprite("setting-gamecenter1.png");
        cacheSprite("setting-gamecenter2.png");
        var sfc = cc.SpriteFrameCache.getInstance();
        theLayer.owner.btnUACManage.setNormalSpriteFrame(sfc.getSpriteFrame("setting-gamecenter1.png"));
        theLayer.owner.btnUACManage.setSelectedSpriteFrame(sfc.getSpriteFrame("setting-gamecenter2.png"));
    }
    else if (engine.game.getConfig().binary_channel == "ADND91"){
        theLayer.owner.btnSfx.setVisible(true);
    }

    engine.ui.regMenu(theLayer.owner.menuRoot);

    updateMusicLabel();
}

exports.show = show;
