//
//  UAC.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#include "UAC.h"
#include "CallbackManager.h"

using namespace std;

UACJSDelegate* UACJSDelegate::getInstance()
{
    static UACJSDelegate ins;
    return &ins;
}

void UACJSDelegate::setCallback(JSObject *obj)
{
    mObject = obj;
}

void UACJSDelegate::onUACReady()
{
    JSCallback* call = JSCallback::alloc(mObject, "onUACReady", 0);
    CallbackManager::getInstance()->postCallback(call);
    call->release();
}

void UACJSDelegate::onLoggedIn(const string &token, int accountType)
{
    int argc = 2;
    if( accountType < 0 ){ argc = 1; }
    JSCallback* call = JSCallback::alloc(mObject, "onLoggedIn", argc);
    call->setArgumentString(0, token);
    if( accountType >= 0 ){
        call->setArgumentInt(1, accountType);
    }
    CallbackManager::getInstance()->postCallback(call);
    call->release();
}

void UACJSDelegate::onAccountChanged(const string &token, int accountType)
{
    int argc = 2;
    if( accountType < 0 ){ argc = 1; }
    JSCallback* call = JSCallback::alloc(mObject, "onAccountChanged", argc);
    call->setArgumentString(0, token);
    if( accountType >= 0 ){
        call->setArgumentInt(1, accountType);
    }
    CallbackManager::getInstance()->postCallback(call);
    call->release();
}

void UACJSDelegate::onLoggedOut()
{
    JSCallback* call = JSCallback::alloc(mObject, "onLoggedOut", 0);
    CallbackManager::getInstance()->postCallback(call);
    call->release();
}

void UACJSDelegate::onLoginViewClosed()
{
    JSCallback* call = JSCallback::alloc(mObject, "onLoginViewClosed", 0);
    CallbackManager::getInstance()->postCallback(call);
    call->release();
}

void UACJSDelegate::onManageViewClosed()
{
    JSCallback* call = JSCallback::alloc(mObject, "onManageViewClosed", 0);
    CallbackManager::getInstance()->postCallback(call);
    call->release();
}

JSBool jsbUACInit(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getUAC()->setUACDelegate(UACJSDelegate::getInstance());
    getUAC()->initUAC();
    return JS_TRUE;
}

JSBool jsbUACSetDelegate(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 ){
        CCLog("uac.setDelegate(obj): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    JSObject* obj = NULL;
    JS_ValueToObject(cx, argv[0], &obj);
    UACJSDelegate::getInstance()->setCallback(obj);
    
    return JS_TRUE;
}

JSBool jsbUACPresentLoginView(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getUAC()->presentLoginView();
    return JS_TRUE;
}

JSBool jsbUACPresentManageView(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getUAC()->presentManageView();
    return JS_TRUE;
}

JSBool jsbUACLogout(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getUAC()->logout();
    return JS_TRUE;
}

JSBool jsbUACGetUserName(JSContext* cx, unsigned argc, JS::Value* vp)
{
    string str;
    getUAC()->getUserName(str);
    jsval ret = c_string_to_jsval(cx, str.c_str());
    JS_SET_RVAL(cx, vp, ret);
    
    return JS_TRUE;
}

JSBool jsbUACGetUserId(JSContext* cx, unsigned argc, JS::Value* vp)
{
    string str;
    getUAC()->getUserId(str);
    jsval ret = c_string_to_jsval(cx, str.c_str());
    JS_SET_RVAL(cx, vp, ret);
    
    return JS_TRUE;
}

void registerUAC(JSContext* cx, JSObject* global)
{
    JSObject *uac = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vUac = OBJECT_TO_JSVAL(uac);
    JS_SetProperty(cx, global, "uac", &vUac);
    
    JS_DefineFunction(cx, uac, "init",jsbUACInit, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, uac, "setDelegate",jsbUACSetDelegate, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, uac, "presentLoginView",jsbUACPresentLoginView, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, uac, "presentManageView",jsbUACPresentManageView, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, uac, "logout",jsbUACLogout, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, uac, "getUserName",jsbUACGetUserName, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, uac, "getUserId",jsbUACGetUserId, 0, JSPROP_READONLY | JSPROP_PERMANENT);
}