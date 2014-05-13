//
//  jsGameCenter.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-14.
//
//

#include "jsGameCenter.h"
#include "GameCenter.h"
#include "CallbackManager.h"

using namespace std;

static JSFunction* sGCCB = NULL;

class JSGCDelegate : public GameCenterDelegate
{
public:
    static JSGCDelegate* getInstance()
    {
        static JSGCDelegate ins;
        return &ins;
    }
    
    void localPlayerAuthenticated()
    {
        if( sGCCB != NULL )
        {
            JSCallback* call = JSCallback::alloc(sGCCB, 1);
            call->setArgumentInt(0, 0);
            CallbackManager::getInstance()->postCallback(call);
            call->release();
        }
    }
    
    void friendListRetrived()
    {
        if( sGCCB != NULL )
        {
            JSCallback* call = JSCallback::alloc(sGCCB, 1);
            call->setArgumentInt(0, 1);
            CallbackManager::getInstance()->postCallback(call);
            call->release();
        }
    }
};

JSBool jsbGameCenterSetCallback(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("gamecenter.setCallback(func): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    sGCCB = JS_ValueToFunction(cx, argv[0]);
    GameCenter::getInstance()->setDelegate(JSGCDelegate::getInstance());
    
    return JS_TRUE;
}

JSBool jsbGameCenterAuthenticateLocalPlayer(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc > 0 )
    {
        jsval* argv = JS_ARGV(cx, vp);
        JSBool jsForce;
        JS_ValueToBoolean(cx, argv[0], &jsForce);
        bool force = (jsForce == JS_TRUE);
        GameCenter::getInstance()->authenticateLocalPlayer(force);
    }
    else
    {
        GameCenter::getInstance()->authenticateLocalPlayer();
    }
    
    return JS_TRUE;
}

JSBool jsbGameCenterIsLocalPlayerAuthenticated(JSContext* cx, unsigned argc, JS::Value* vp)
{
    bool flag = GameCenter::getInstance()->isLocalPlayerAuthenticated();
    jsval ret = flag ? JSVAL_TRUE : JSVAL_FALSE;
    JS_SET_RVAL(cx, vp, ret);
    return JS_TRUE;
}

JSBool jsbGameCenterQueryFriendList(JSContext* cx, unsigned argc, JS::Value* vp)
{
    GameCenter::getInstance()->queryFriendList();
    return JS_TRUE;
}

JSBool jsbGameCenterRetriveFriendList(JSContext* cx, unsigned argc, JS::Value* vp)
{
    vector<string> friendList;
    GameCenter::getInstance()->retriveFriendList(friendList);
    
    JSObject* list = JS_NewArrayObject(cx, 0, NULL);
    uint32_t index = 0;
    for(vector<string>::iterator iter = friendList.begin();
        iter != friendList.end(); ++iter)
    {
        string key = *iter;
        jsval vkey = c_string_to_jsval(cx, key.c_str());
        
        if( JS_SetElement(cx, list, index, &vkey) )
        {
            index++;
        }
    }
    
    jsval ret = OBJECT_TO_JSVAL(list);
    JS_SET_RVAL(cx, vp, ret);
    
    return JS_TRUE;
}

JSBool jsbGameCenterRetrivePlayerGCID(JSContext* cx, unsigned argc, JS::Value* vp)
{
    string str;
    GameCenter::getInstance()->retrivePlayerGCID(str);
    jsval out = c_string_to_jsval(cx, str.c_str());
    
    JS_SET_RVAL(cx, vp, out);
    
    return JS_TRUE;
}

JSBool jsbGameCenterRetriveAlias(JSContext* cx, unsigned argc, JS::Value* vp)
{
    string str;
    GameCenter::getInstance()->retrivePlayerAlias(str);
    jsval out = c_string_to_jsval(cx, str.c_str());
    
    JS_SET_RVAL(cx, vp, out);
    
    return JS_TRUE;
}

JSBool jsbGameCenterRetrivePlayerDisplayName(JSContext* cx, unsigned argc, JS::Value* vp)
{
    string str;
    GameCenter::getInstance()->retrivePlayerDisplayName(str);
    jsval out = c_string_to_jsval(cx, str.c_str());
    
    JS_SET_RVAL(cx, vp, out);
    
    return JS_TRUE;
}

void registerGameCenter(JSContext* cx, JSObject* global)
{
    JSObject *gc = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vGameCenter = OBJECT_TO_JSVAL(gc);
    JS_SetProperty(cx, global, "gamecenter", &vGameCenter);
    
    JS_DefineFunction(cx, gc, "setCallback",jsbGameCenterSetCallback, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, gc, "authenticateLocalPlayer",jsbGameCenterAuthenticateLocalPlayer, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, gc, "isLocalPlayerAuthenticated",jsbGameCenterIsLocalPlayerAuthenticated, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, gc, "queryFriendList",jsbGameCenterQueryFriendList, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, gc, "getFriendList",jsbGameCenterRetriveFriendList, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, gc, "getPlayerGCID",jsbGameCenterRetrivePlayerGCID, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, gc, "getPlayerAlias",jsbGameCenterRetriveAlias, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, gc, "getPlayerDisplayName",jsbGameCenterRetrivePlayerDisplayName, 0, JSPROP_READONLY | JSPROP_PERMANENT);
}