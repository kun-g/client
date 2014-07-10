//
//  system.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-7.
//
//

#include "System.h"
#include "CallbackManager.h"
#include "tools.h"
#include "SimpleAudioEngine.h"
#include "TCP.h"

using namespace cocos2d;
using namespace std;
using namespace CocosDenshion;

static JSFunction* sEBGC = NULL;
static JSFunction* sEFGC = NULL;

void triggerEnterBackground()
{
    if( sEBGC != NULL )
    {
        JSContext* cx = ScriptingCore::getInstance()->getGlobalContext();
        jsval ret;
        JS_CallFunction(cx, NULL, sEBGC, 0, NULL, &ret);
    }
}

void triggerEnterForeground()
{
    if( sEFGC != NULL )
    {
        JSContext* cx = ScriptingCore::getInstance()->getGlobalContext();
        jsval ret;
        JS_CallFunction(cx, NULL, sEFGC, 0, NULL, &ret);
    }
}

/*** JSAlertDelegate ***/

JSAlertDelegate* JSAlertDelegate::getInstance()
{
    static JSAlertDelegate inst;
    return &inst;
}

void JSAlertDelegate::setAlertCallback(JSObject *obj, JSFunction *func)
{
    mpObject = obj;
    mpFunc = func;
}

void JSAlertDelegate::onAlertResult(int button)
{
    JSCallback *call = JSCallback::alloc(mpFunc, 1, mpObject);
    call->setArgumentInt(0, button);
    CallbackManager::getInstance()->postCallback(call);
    call->release();
}

/*** System Bindings ***/

JSBool jsbSysGetBinaryVersion(JSContext* cx, unsigned argc, JS::Value* vp)
{
    string version;
    getSystem()->getVersion(version);
    jsval out = c_string_to_jsval(cx, version.c_str());
    
    JS_SET_RVAL(cx, vp, out);
    
    return JS_TRUE;
}

JSBool jsbSysGetDeviceId(JSContext* cx, unsigned argc, JS::Value* vp)
{
    string deviceId;
    getSystem()->getDeviceId(deviceId);
    jsval out = c_string_to_jsval(cx, deviceId.c_str());
    
    JS_SET_RVAL(cx, vp, out);
    
    return JS_TRUE;
}

//system.alert(title, message, object, func, cancel, otherbuttons...)
JSBool jsbSysAlert(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 5 )
    {
        CCLog("system.alert(title, message, cbObj, cbFunc, cancel ...): wrong argument.");
        return JS_TRUE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    //title
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strTitle(arg0);
    string title = strTitle;
    //message
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strMessage(arg1);
    string message = strMessage;
    //object
    JSObject *obj = NULL;
    JS_ValueToObject(cx, argv[2], &obj);
    //function
    JSFunction *func = JS_ValueToFunction(cx, argv[3]);
    //cancel
    JSString *arg4 = JS_ValueToString(cx, argv[4]);
    JSStringWrapper strCancel(arg4);
    string cancel = strCancel;
    //other buttons
    string button1;
    string button2;
    string button3;
    if( argc > 5 )
    {
        JSString *arg5 = JS_ValueToString(cx, argv[5]);
        JSStringWrapper strButton1(arg5);
        string label = strButton1;
        button1 = label;
    }
    if( argc > 6 )
    {
        JSString *arg6 = JS_ValueToString(cx, argv[6]);
        JSStringWrapper strButton2(arg6);
        string label = strButton2;
        button2 = label;
    }
    if( argc > 7 )
    {
        JSString *arg7 = JS_ValueToString(cx, argv[7]);
        JSStringWrapper strButton3(arg7);
        string label = strButton3;
        button3 = label;
    }
    
    JSAlertDelegate::getInstance()->setAlertCallback(obj, func);
    getSystem()->alert(title, message, JSAlertDelegate::getInstance(), cancel, button1, button2, button3);
    
    return JS_TRUE;
}

JSBool jsbSysScheduleLocalNotification(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 4 )
    {
        CCLog("system.scheduleLocalNotification(key, time, message, button): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString* arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strKey(arg0);
    string key = strKey;
    double time;
    JS_ValueToNumber(cx, argv[1], &time);
    time /= 1000.0;//convert to second
    JSString* arg2 = JS_ValueToString(cx, argv[2]);
    JSStringWrapper strMessage(arg2);
    string message = strMessage;
    JSString* arg3 = JS_ValueToString(cx, argv[3]);
    JSStringWrapper strButton(arg3);
    string button = strButton;
    
    getSystem()->scheduleLocalNotification(key, time, message, button);
    
    return JS_TRUE;
}

JSBool jsbSysScheduledLocalNotifications(JSContext* cx, unsigned argc, JS::Value* vp)
{
    vector<string> keylist;
    getSystem()->scheduledLocalNotifications(keylist);
    
    JSObject* list = JS_NewArrayObject(cx, 0, NULL);
    uint32_t index = 0;
    for(vector<string>::iterator iter = keylist.begin();
        iter != keylist.end(); ++iter)
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

JSBool jsbSysUnscheduleLocalNotification(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("system.unscheduleLocalNotification(key): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString* arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strKey(arg0);
    string key = strKey;
    
    getSystem()->unscheduleLocalNotification(key);
    
    return JS_TRUE;
}

JSBool jsbSysUnscheduleAllLocalNotifications(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getSystem()->unscheduleAllLocalNotifications();
    
    return JS_TRUE;
}

JSBool jsbSysSetAppBadgeNumber(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("system.setAppBadgeNumber(number): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    int32_t number = 0;
    JS_ValueToInt32(cx, argv[0], &number);
    
    getSystem()->setAppBadgeNumber(number);
    
    return JS_TRUE;
}

JSBool jsbSysOpenURL(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("system.openURL(url): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strURL(arg0);
    string url = strURL;
    
    getSystem()->openURL(url);
    
    return JS_TRUE;
}

JSBool jsbSysIsJailBroken(JSContext* cx, unsigned argc, JS::Value* vp)
{
    bool ret = getSystem()->isJailbroken();
    if( ret )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    
    return JS_TRUE;
}

JSBool jsbSysIsPirated(JSContext* cx, unsigned argc, JS::Value* vp)
{
    bool ret = getSystem()->isPirated();
    if( ret )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    
    return JS_TRUE;
}

JSBool jsbSysEnterBackgroundCallback(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("system.setEnterBackgroundCallback: wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    sEBGC = JS_ValueToFunction(cx, argv[0]);
    
    return JS_TRUE;
}

JSBool jsbSysEnterForegroundCallback(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("system.setEnterForegroundCallback: wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    sEFGC = JS_ValueToFunction(cx, argv[0]);
    
    return JS_TRUE;
}

JSBool jsbSysCheckNetworkStatus(JSContext* cx, unsigned argc, JS::Value* vp)
{
    jsval ret = JS_NumberValue(getSystem()->checkNetworkStatus());
    JS_SET_RVAL(cx, vp, ret);
    return JS_TRUE;
}

JSBool jsbSysGetPreference(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("system.openURL(url): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strKey(arg0);
    string key = strKey;
    
    string value;
    getSystem()->getPreference(key, value);
    
    jsval out = c_string_to_jsval(cx, value.c_str());
    JS_SET_RVAL(cx, vp, out);
    
    return JS_TRUE;
}

JSBool jsbSysReset(JSContext* cx, unsigned argc, JS::Value* vp)
{
    //reset tcp connections
    clearAllTCPConnections();
    //reset callback manager
    CallbackManager::getInstance()->reset();
    //reset system callback
    sEBGC = NULL;
    sEFGC = NULL;
    
    return JS_TRUE;
}

JSBool jsbSysExit(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getSystem()->exit();
    return JS_TRUE;
}

void registerSys(JSContext* cx, JSObject* global)
{
    JSObject *sys = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vSys = OBJECT_TO_JSVAL(sys);
    JS_SetProperty(cx, global, "system", &vSys);
    
    JS_DefineFunction(cx, sys, "getBinaryVersion",jsbSysGetBinaryVersion, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "getDeviceId", jsbSysGetDeviceId, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "alert", jsbSysAlert, 8, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "scheduleLocalNotification", jsbSysScheduleLocalNotification, 4, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "scheduledLocalNotifications", jsbSysScheduledLocalNotifications, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "unscheduleLocalNotification", jsbSysUnscheduleLocalNotification, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "unscheduleAllLocalNotifications", jsbSysUnscheduleAllLocalNotifications, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "setAppBadgeNumber", jsbSysSetAppBadgeNumber, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "openURL", jsbSysOpenURL, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "isJailBroken", jsbSysIsJailBroken, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "isPirated", jsbSysIsPirated, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "setEnterBackgroundCallback", jsbSysEnterBackgroundCallback, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "setEnterForegroundCallback", jsbSysEnterForegroundCallback, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "checkNetworkStatus", jsbSysCheckNetworkStatus, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "getPreference", jsbSysGetPreference, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "reset", jsbSysReset, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "exit", jsbSysExit, 0, JSPROP_READONLY | JSPROP_PERMANENT);
}