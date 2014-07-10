//
//  TCP.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-9-9.
//
//

#include "TCP.h"
#include "TCPSocket.h"
#include "CallbackManager.h"

using namespace std;
using namespace cocos2d;

typedef struct
{
    int fd;
    JSFunction* func;
    JSObject* obj;
}TCPFD;

map<int, TCPFD*> gConnections;

TCPFD* getConnection(int fd)
{
    map<int, TCPFD*>::iterator iter = gConnections.find(fd);
    CCAssert(iter != gConnections.end(), "Illegal FD");
    return iter->second;
}

void recvCallback(string &data, TCPState state, void* userData)
{
    TCPFD* pfd = (TCPFD*)userData;
    //CCLog("PTR(%d) CALL = %p", pfd->fd, pfd);//debug
    
    //recv callback
    JSCallback* call = JSCallback::alloc(pfd->func, 3, pfd->obj);
    call->setArgumentInt(0, pfd->fd);
    call->setArgumentString(1, data);
    call->setArgumentInt(2, state);
    CallbackManager::getInstance()->postCallback(call);
    //call->setDebugTag(data.c_str());//test
    call->release();
}

JSBool jsbTcpCreate(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 3 )
    {
        CCLog("tcp.init(ip, port, func, [obj]): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString* arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strIP(arg0);
    string IP = strIP;
    int port = -1;
    JS_ValueToInt32(cx, argv[1], &port);
    JSFunction* func = JS_ValueToFunction(cx, argv[2]);
    JSObject* obj = NULL;
    if( argc > 3 )
    {
        JS_ValueToObject(cx, argv[3], &obj);
    }
    
    int fd = tcpCreate(IP.c_str(), port);
    if( fd >= 0 )
    {
        TCPFD *sfd = new TCPFD();
        sfd->fd = fd;
        sfd->func = func;
        sfd->obj = obj;
        //CCLOG("CreateTCP OBJ=%p", obj);
        gConnections.insert(make_pair(fd, sfd));
        //CCLog("PTR(%d) CREATE = %p", fd, sfd);
        tcpSetCallback(fd, recvCallback, sfd);
        
        JS_SET_RVAL(cx, vp, JS_NumberValue(fd));
    }
    else
    {
        JS_SET_RVAL(cx, vp, JS_NumberValue(-1));
    }
    
    return JS_TRUE;
}

JSBool jsbTcpOpen(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tcp.open(fd): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    int fd = -1;
    JS_ValueToInt32(cx, argv[0], &fd);
    
    tcpConnect(fd);
    
    return JS_TRUE;
}

JSBool jsbTcpSend(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("tcp.send(fd, data, [mode]): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    int fd = -1;
    int mode = 0;
    JS_ValueToInt32(cx, argv[0], &fd);
    JSString* arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strData(arg1);
    string data = strData;
    if( argc > 2 )
    {
        JS_ValueToInt32(cx, argv[2], &mode);
    }
    switch (mode) {
        case 0://default(all)
            tcpSend(fd, data);
            break;
        case 1://no aes
            tcpSend(fd, data, TCPFM_SIZE);
            break;
        case 2://no msgpack
            tcpSend(fd, data, TCPFM_SIZE|TCPFM_AES);
            break;
        case 3://raw
            tcpSend(fd, data, TCPFM_SIZE);
            break;
    }
    
    return JS_TRUE;
}

JSBool jsbTcpClose(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tcp.close(fd): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    int fd = -1;
    JS_ValueToInt32(cx, argv[0], &fd);
    
    tcpClose(fd);
    
    return JS_TRUE;
}

JSBool jsbTcpDestroy(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tcp.destroy(fd): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    int fd = -1;
    JS_ValueToInt32(cx, argv[0], &fd);
    
    tcpCleanup(fd);
    TCPFD *pfd = getConnection(fd);
    gConnections.erase(fd);
    delete pfd;
    //CCLog("PTR(%d) REMOVE", fd);
    
    return JS_TRUE;
}

void clearAllTCPConnections()
{
    for(map<int, TCPFD*>::iterator iter = gConnections.begin(); iter != gConnections.end(); ++iter)
    {
        int fd = iter->first;
        tcpCleanup(fd);
        TCPFD *pfd = getConnection(fd);
        delete pfd;
    }
    gConnections.clear();
}

void registerTcp(JSContext* cx, JSObject* global)
{
    JSObject *tcp = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vTcp = OBJECT_TO_JSVAL(tcp);
    JS_SetProperty(cx, global, "tcp", &vTcp);
    
    JS_DefineFunction(cx, tcp, "create",jsbTcpCreate, 4, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tcp, "open",jsbTcpOpen, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tcp, "send",jsbTcpSend, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tcp, "close",jsbTcpClose, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tcp, "destroy",jsbTcpDestroy, 1, JSPROP_READONLY | JSPROP_PERMANENT);
}