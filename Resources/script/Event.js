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

var CONN_UNDEFINED = 0;
var CONN_ESTABLISHED = 1;
var CONN_DISCONNECTED = 2;

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
    this.CONN_STATE = CONN_UNDEFINED;
    this.AWAKE_SENT = false;

    this.SENDQUEUE = [];
    this.RPC_INSECURE_LIST = [];
}

Event.prototype.start = function()
{
    //init system callback
    system.setEnterBackgroundCallback(onEnterBackground);
    system.setEnterForegroundCallback(onEnterForeground);
    //init iap
    iap.setCallback(onPaymentResult, this);
    iap.init();
}

Event.prototype.testServers = function(serverList)
{
    this.CONN_STATE = CONN_UNDEFINED;
    testConnections = [];
    for(var k in serverList){
        var fd = tcp.create(serverList[k].ip, serverList[k].port, onRecvCallback);
        debug("SERVER="+JSON.stringify(serverList[k])+" FD("+fd+")");
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
    debug("SELECT SERVER("+index+")FD("+this.TCPFD+")");
    //clean other connections
    for(var k in testConnections)
    {
        if( k != index ){
            //tcp.destroy(testConnections[k].fd);
        }
    }
    testConnections = null;
    this.CONN_STATE = CONN_ESTABLISHED;
}

//try to connect server
Event.prototype.connectServer = function(ip, port)
{
    debug("CONNECT SERVER("+ip+", "+port+")");
    if( this.TCPFD >= 0 )
    {
        tcp.destroy(this.TCPFD);
    }
    this.TCPFD = tcp.create(ip, port, onRecvCallback);
    this.SERVER_IP = ip;
    this.SERVER_PORT = port;
}

Event.prototype.setPassport = function(passport)
{
    debug("SET PASSPORT = "+passport);
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

    var force = false;
    if( cmd == Request_Awake ) force = true;
    //copyProperties(pkg, rpc.arg);
    var strData  = JSON.stringify(pkg);
    if( cmd != Request_Awake ){
        this.RPC_INSECURE_LIST.push(strData);
    }
    this.sendPackage(this.TCPFD, strData, this.SENDMODE, force);
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
        this.sendPackage(this.TCPFD, JSON.stringify(pkg), this.SENDMODE, false);
    }
}

Event.prototype.sendPackage = function(fd, pkg, mode, force){
    debug("sendPackage = "+JSON.stringify(pkg));
    if( this.CONN_STATE == CONN_DISCONNECTED && !force && this.SERVER_PID != null ){
        this.SENDQUEUE.push({
            fd: fd,
            pkg: pkg,
            mode: mode
        });
        this.invokeAwake();
    }
    else{
        tcp.send(this.TCPFD, pkg, mode);
    }
}

Event.prototype.invokeAwake = function(){
    if( !this.AWAKE_SENT ){
        this.sendRPCEvent(Request_Awake, {
            PID: this.SERVER_PID
        }, function(rsp){
            singleton.flushSendQueueAndInsecureRPC();
            singleton.CONN_STATE = CONN_ESTABLISHED;
            singleton.AWAKE_SENT = false;
        }, singleton);
        this.AWAKE_SENT = true;
    }
}

Event.prototype.flushSendQueueAndInsecureRPC = function(){
    for( var k in this.SENDQUEUE ){
        var pak = this.SENDQUEUE[k];
        tcp.send(pak.fd, pak.pkg, pak.mode);
    }
    this.SENDQUEUE = [];
    for(var k in this.RPC_INSECURE_LIST){
        tcp.send(this.TCPFD, this.RPC_INSECURE_LIST[k], this.SENDMODE);
    }
    this.RPC_INSECURE_LIST = [];
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

            this.RPC_INSECURE_LIST = [];//empity insecure list
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
        warn("Network: ("+state+")FD("+fd+")"+data);
        if( singleton.CONN_STATE > CONN_UNDEFINED
            && fd == singleton.TCPFD ){
            debug("** DISCONNECTED");
            singleton.CONN_STATE = CONN_DISCONNECTED;
            singleton.AWAKE_SENT = false;
            if( state != TCP_DISCONNECTED ){
                singleton.invokeAwake();
            }
        }
    }
}

function onEnterBackground()
{
    debug("onEnterBackground");
    if( engine.user.isInited() ){
        singleton.processNotification(Message_OnEnterBackground);
        engine.user.saveProfile();

        if( engine.user.player.Energy <= 50 ){
            var time = engine.user.player.estimateEnergyRecoverTimer();
            system.scheduleLocalNotification(
                "energyRecover",
                time,
                "老大我已经完全恢复了精力。赶紧去把外面嚣张的怪物都砍翻吧，世界和平就靠你啦。",
                "出征");
        }

        engine.user.bounty.setScheduleLocalNotification();
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