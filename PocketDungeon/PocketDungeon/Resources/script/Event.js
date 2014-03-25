/**
 * User: hammer
 * Date: 13-10-12
 * Time: 下午4:20
 *
 *  RPC Handler : void function(rsp, data)
 *  NTF Handler : bool function(rsp)
 *
 */

var director = cc.Director.getInstance();
var scheduler = director.getScheduler();
var testConnections = null;

function Event()
{
    //RPC
    this.RPCSEQ = 0;
    this.RPCSENT = {};

    //processor
    this.HANDLE_NTF = [];
    this.FLAG_HOLDNTF = false;
    this.HOLD_NTF = [];

    //Connection
    this.TCPFD = -1;
    this.SERVER_IP = "0.0.0.0";
    this.SERVER_PORT = 0;
    this.SERVER_PID = null;
    this.SERVER_RID = null;
    this.SENDMODE = 0;
}

Event.prototype.start = function()
{
    //scheduler.scheduleCallbackForTarget(this, onTick, 0, cc.REPEAT_FOREVER, 0, false);
    //init system callback
    system.setEnterBackgroundCallback(onEnterBackground);
    system.setEnterForegroundCallback(onEnterForeground);
    //init iap
    iap.setCallback(onPaymentResult, this);
    iap.init();
}

Event.prototype.testServers = function(serverList)
{
    testConnections = [];
    for(var k in serverList){
        debug("SERVER="+JSON.stringify(serverList[k]));
        var fd = tcp.create(serverList[k].ip, serverList[k].port, onRecvCallback);
        testConnections[k] = {
            fd: fd,
            ip: serverList[k].ip,
            port: serverList[k].port
        };
        tcp.send(fd, JSON.stringify({
            CNF: 103,
            arg: {sign: k}
        }));
    }
}

Event.prototype.selectTestServer = function(index)
{
    if( testConnections == null ) return;
    var conn = testConnections[index];
    this.TCPFD = conn.fd;
    this.SERVER_IP = conn.ip;
    this.SERVER_PORT = conn.port;
    //clean other connections
    for(var k in testConnections)
    {
        if( k != index ){
            //tcp.destroy(testConnections[k].fd);
        }
    }
    testConnections = null;
}

//try to connect server
Event.prototype.connectServer = function(ip, port)
{
    if( this.TCPFD >= 0 )
    {
        if( ip == this.SERVER_IP && port == this.SERVER_PORT )
        {
            return;
        }
        tcp.destroy(this.TCPFD);
    }
    this.TCPFD = tcp.create(ip, port, onRecvCallback);
    this.SERVER_IP = ip;
    this.SERVER_PORT = port;
}

Event.prototype.setPassport = function(passport)
{
    this.SERVER_PID = passport;
}

Event.prototype.getPassport = function()
{
    return this.SERVER_PID;
}

Event.prototype.setRuntimeId = function(runtimeId)
{
    this.SERVER_RID = runtimeId;
}

Event.prototype.setSendMode = function(mode)
{
    this.SENDMODE = mode;
}

//send a rpc event to server
Event.prototype.sendRPCEvent = function(cmd, args, callback, thiz, data)
{
    if( this.TCPFD < 0 )
    {
        error("Event.sendRPCEvent: Server not connected.");
        return;
    }
    var rpc = {};
    rpc.id = this.RPCSEQ;
    rpc.cmd = cmd;
    rpc.arg = args;
    rpc.callback = callback;
    rpc.thiz = thiz;
    rpc.data = data;
    rpc.time = Date.now();
    this.RPCSEQ++;
    this.RPCSENT[rpc.id] = rpc;

    var pkg = {};
    pkg.PID = this.SERVER_PID;
    pkg.RID = this.SERVER_RID;
    pkg.REQ = rpc.id;
    pkg.CMD = rpc.cmd;
    if( rpc.arg != null ){
        pkg.arg = rpc.arg;
    }

    //copyProperties(pkg, rpc.arg);
    tcp.send(this.TCPFD, JSON.stringify(pkg), this.SENDMODE);
}

//send a notification event to server
Event.prototype.sendNTFEvent = function(cnf, args)
{
    if( this.TCPFD < 0 )
    {
        error("Event.sendNTFEvent: Server not connected.");
        return;
    }
    var pkg = {};
    if( this.SERVER_PID != null )
    {
        pkg.PID = this.SERVER_PID;
    }
    if( this.SERVER_RID != null )
    {
        pkg.RID = this.SERVER_RID;
    }
    pkg.CNF = cnf;
    pkg.arg = args;

    if( engine.box.filter(pkg) ){
        //process blackbox
        engine.box.process(pkg);
    }
    else{
        //send to original server
        tcp.send(this.TCPFD, JSON.stringify(pkg), this.SENDMODE);
    }
}

Event.prototype.processNotification = function(snf, args, force)
{
    //default values
    if( force == null ){
        force = false;
    }

    try{
        var ntf = null;
        if( typeof(snf) != "object" )
        {
            ntf = {};
            ntf.NTF = snf;
            if( args != null )
            {
                ntf.arg = args;
            }
        }
        else
        {
            ntf = snf;
        }

        //process notification
        if( this.FLAG_HOLDNTF && !force )
        {
            this.HOLD_NTF.push(ntf);
            return;
        }

        for(var k=this.HANDLE_NTF.length-1; k>=0; --k)
        {
            var handler = singleton.HANDLE_NTF[k];
            if( handler.func.apply(handler.thiz, [ntf]) )
            {//processed
                return;
            }
        }
        warn("processNotification: Unprocessed notification:\n"+JSON.stringify(ntf));
    }
    catch(e)
    {
        traceError(e);
    }
}

//easy function for processing response(s)
Event.prototype.processResponses = function(rsps)
{
    if( Array.isArray(rsps) ){
        for(var k in rsps){
            singleton.postResponse(rsps[k]);
        }
    }
    else{
        singleton.postResponse(rsps);
    }
}

//post a single response event
Event.prototype.postResponse = function(resp)
{
    if( resp.REQ != null )
    {//RPC response
        if( this.RPCSENT[resp.REQ] != null )
        {
            var rpc = this.RPCSENT[resp.REQ];
            rpc.callback.apply(rpc.thiz, [resp, rpc.data]);
            delete this.RPCSENT[resp.REQ];
        }
        else
        {
            error("Event.postResponse: RPC call not found("+resp.REQ+"):\n"+JSON.stringify(resp));
        }
    }
    else
    {//notification response
        this.processNotification(resp);
    }
}

Event.prototype.pushNTFHandler = function(callback, thiz)
{
    var handler = {};
    handler.func = callback;
    handler.thiz = thiz;
    this.HANDLE_NTF.push(handler);
}

Event.prototype.popNTFHandler = function()
{
    this.HANDLE_NTF.pop();
}

Event.prototype.removeNTFHandler = function(thiz)
{
    this.HANDLE_NTF = this.HANDLE_NTF.filter(function(handler){
        if( handler.thiz === thiz ) return false;
        return true;
    });
}

Event.prototype.holdNotifications = function()
{
    debug("* HOLD NOTIFICATIONS");
    this.FLAG_HOLDNTF = true;
}

Event.prototype.releaseNotifications = function()
{
    debug("* RELEASE NOTIFICATIONS");
    this.FLAG_HOLDNTF = false;
    for(var k in this.HOLD_NTF)
    {
        var ntf = this.HOLD_NTF[k];
        this.processNotification(ntf);
    }
    this.HOLD_NTF = [];
}

Event.prototype.isHoldingNotifications = function()
{
    return this.FLAG_HOLDNTF;
}

/*** PRIVATE FUNCTIONS ***/

function onRecvCallback(fd, data, state)
{
    if( state == TCP_OK )
    {
        if( data != null )
        {
            try
            {
                var obj = JSON.parse(data);
                if( Array.isArray(obj) )
                {//multi-response
                    for(var k in obj)
                    {
                        if( typeof(obj[k]) == "object" )
                            singleton.postResponse(obj[k]);
                        else
                            debug("Reject Event: "+JSON.stringify(obj[k]));
                    }
                }
                else
                {//single-response
                    singleton.postResponse(obj);
                }
            }
            catch(e)
            {
                debug("ERROR DETAIL = \n"+JSON.stringify(e));
                traceError(e);
            }
        }
        else
        {
            warn("Network: Connected to server("+fd+").");
        }
    }
    else
    {
        warn("Network: ("+state+")"+data);
    }
}

function onEnterBackground()
{
    debug("onEnterBackground");
    if( engine.user.isInited() ){
        singleton.processNotification(Message_OnEnterBackground);
        engine.user.saveProfile();

        system.unscheduleLocalNotification("energyRecover");
        if( engine.user.player.Energy <= 50 ){
            var time = engine.user.player.estimateEnergyRecoverTimer();
            system.scheduleLocalNotification(
                "energyRecover",
                time,
                "你的勇士已经完全恢复了精力。赶紧去把外面嚣张的怪物都砍翻吧，世界和平就靠你啦。",
                "马上出征");
        }
    }
}

function onEnterForeground()
{
    debug("onEnterForeground");
    singleton.processNotification(Message_OnEnterForeground);
}

function onPaymentResult(result, product, message)
{
    debug("on PaymentResult: "+result+"\nProduct: "+product+"\nMessage: "+message);

    singleton.processNotification(Message_PaymentResult,
        {
            result: result,
            product: product,
            message: message
        });
}

var singleton = new Event();

exports.instance = singleton;