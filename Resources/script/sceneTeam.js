/**
 * User: hammer
 * Date: 13-9-25
 * Time: 下午2:41
 */
var libRole = loadModule("role.js");
var libUIC = loadModule("UIComposer.js");
var libTable = loadModule("table.js");
var libUIKit = loadModule("uiKit.js");
var theLayer = null;

//runtime variables
var theTeamCount = 3;
var roleInfos = [];
var treasureDisplay;
var kickCost;
var party = [];
var state = [];

//use to team up for two players
function hideLastPlayer()
{
    theLayer.owner.spLine3.setColor(cc.c3b(85, 85, 85));
    theLayer.owner.btnKick3.setVisible(false);
    theLayer.owner.nodeLine3.setVisible(false);
    theLayer.owner.labelName3.setVisible(false);
    theLayer.owner.btnRoleInfo3.setVisible(false);
}

function onRefreshCallback(rsp, sid)
{
    if( rsp.RET == RET_OK )
    {
        var r = new libRole.Role(rsp.arg);
        r.fix();
        party[sid] = r;
        updateRoleInfo(sid, r);
    }
    else
    {
        loadModule("uiKit.js").showErrorMessage(rsp);
        updateRoleInfo(sid, party[sid]);
    }
    state[sid] = true;
}

function onClose(sender)
{
    cc.AudioEngine.getInstance().playEffect("cancel.mp3");
    engine.ui.popLayer();
}

function onKick(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var sid = sender.getTag();
    if( state[sid] === true )
    {
        //updateRoleInfo(sid, null);
        state[sid] = false;
        engine.event.sendRPCEvent(Request_StageRefreshMercenaryList, {sid:sid-1}, onRefreshCallback, theLayer, sid);
    }
}

function onRoleInfo(sender){
    cc.AudioEngine.getInstance().playEffect("card2.mp3");
    var sid = sender.getTag();
    if( state[sid] === true )
    {
        libUIKit.showRoleInfo(roleInfos[sid].name.getString());
    }
}

function onStart(sender)
{
    cc.AudioEngine.getInstance().playEffect("card2.mp3");

    //false check
    if( party[1] == null || party[2] == null )
    {
        return;
    }

    requestBattle(engine.user.dungeon.stage, party);
    engine.ui.popLayer();
}

function updateRoleInfo(id, role)
{
    if( role != null )
    {
        var RoleClass = libTable.queryTable(TABLE_ROLE, role.ClassId);
        roleInfos[id].avatar.setRole(role);
        roleInfos[id].name.setString(role.Name);
        appendVipIcon(roleInfos[id].name, role.vip);
        roleInfos[id].desc.setString("Lv."+role.Level+" "+RoleClass.className);
        roleInfos[id].power.setString(role.getPower());
        //--- vip panel ---
        if( role.vip != null && +role.vip > 0 ){
            roleInfos[id].nodeVip.setVisible(true);
        }
        else{
            roleInfos[id].nodeVip.setVisible(false);
        }
    }
    else
    {
        roleInfos[id].avatar.setRole(null);
        roleInfos[id].name.setString("");
        appendVipIcon(roleInfos[id].name, -1);
        roleInfos[id].desc.setString("");
        roleInfos[id].power.setString("");
        roleInfos[id].nodeVip.setVisible(false);
    }
}

function onNotify(ntf)
{
    switch(ntf.NTF)
    {
        case Message_UpdateTreasure:
        {
            treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
            return false;
        }
        case Message_UpdateMercenaryList:
        {
            debug("TEAM = \n"+JSON.stringify(engine.session.team));
            for(var k=0; k<2; ++k)
            {
                var r = engine.session.team[k];
                party[k+1] = r;
                updateRoleInfo(k+1, r);
                state[k+1] = true;
            }
            return true;
        }
    }
    return false;
}

function onEnter()
{
    theLayer = this;

    this.owner = {};
    this.owner.onClose = onClose;
    this.owner.onKick = onKick;
    this.owner.onStart = onStart;
    this.owner.onRoleInfo = onRoleInfo;

    var node = libUIC.loadUI(this, "sceneSelect.ccbi", {
        btnOk: {
            ui: "UIButtonL",
            menu: "menuRoot",
            func: onStart,
            label: "buttontext-confirm.png"
        },
        nodeTreasure: {
            ui: "UITreasure",
            id: "treasureDisplay"
        },
        nodeCost: {
            ui: "UIPrice",
            id: "kickCost"
        },
        nodeRole1: {
            ui: "UIAvatar",
            id: "role1"
        },
        nodeRole2: {
            ui: "UIAvatar",
            id: "role2"
        },
        nodeRole3: {
            ui: "UIAvatar",
            id: "role3"
        }
    });

    this.addChild(node);
    //register menu root
    engine.ui.regMenu(this.owner.menuRoot);

    //assign variables
    treasureDisplay = this.ui.treasureDisplay;
    kickCost = this.ui.kickCost;
    //role 1
    var role1 = {};
    role1.avatar = this.ui.role1;
    role1.name = this.owner.labelName1;
    role1.desc = this.owner.labelDesc1;
    role1.power = this.owner.labPower1;
    role1.nodeVip = this.owner.nodeVip1;
    roleInfos[0] = role1;
    //role 2
    var role2 = {};
    role2.avatar = this.ui.role2;
    role2.name = this.owner.labelName2;
    role2.desc = this.owner.labelDesc2;
    role2.power = this.owner.labPower2;
    role2.nodeVip = this.owner.nodeVip2;
    roleInfos[1] = role2;
    //role 3
    var role3 = {};
    role3.avatar = this.ui.role3;
    role3.name = this.owner.labelName3;
    role3.desc = this.owner.labelDesc3;
    role3.power = this.owner.labPower3;
    role3.nodeVip = this.owner.nodeVip3;
    roleInfos[2] = role3;

    //set values
    treasureDisplay.setTreasure(engine.user.inventory.Gold, engine.user.inventory.Diamond);
    updateRoleInfo(0, engine.user.actor);
    party[0] = engine.user.actor;

    //test cost value
    kickCost.setPrice({gold: 5});

    if( engine.session.team.length < 2 ){
        cc.Director.getInstance().getScheduler().scheduleCallbackForTarget(this, function(){
            //send rpc request
            libUIKit.waitRPC(Request_StageRequireMercenaryList, null, function(rsp){
                if( rsp.RET != RET_OK ){
                    libUIKit.showErrorMessage(rsp);
                }
            }, theLayer);
        }, 0, 0, 0, false);
    }
    else{
        engine.event.processNotification(Message_UpdateMercenaryList);
    }
    if( theTeamCount == 2 ){
        hideLastPlayer();
    }

    //register broadcast
    loadModule("broadcastx.js").instance.simpleInit(this);
    
    
}

function onExit()
{
    loadModule("broadcastx.js").instance.close();
}

function onActivate(){
    engine.pop.resetAllFlags();
    engine.pop.setFlag("tutorial");
    engine.pop.invokePop("team");
}

function show(teamCount){
    theTeamCount = teamCount;
    engine.ui.newLayer({
        onEnter: onEnter,
        onExit: onExit,
        onNotify: onNotify,
        onActivate: onActivate
    })
}

exports.show = show;