//
//  IAP.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-8-14.
//
//

#include "IAP.h"
#include "CallbackManager.h"

using namespace std;

IAPJSDelegate* IAPJSDelegate::getInstance()
{
    static IAPJSDelegate inst;
    return &inst;
}

void IAPJSDelegate::setCallback(JSObject *obj, JSFunction *func)
{
    mObject = obj;
    mFunc = func;
}

void IAPJSDelegate::onPaymentResult(PaymentResult result, int product, string message)
{
    JSCallback *callback = JSCallback::alloc(mFunc, 3, mObject);
    callback->setArgumentInt(0, result);
    callback->setArgumentInt(1, product);
    callback->setArgumentString(2, message);
    CallbackManager::getInstance()->postCallback(callback);
    callback->release();
}

JSBool jsbIAPInitPayment(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getIAP()->setIAPDelegate(IAPJSDelegate::getInstance());
    getIAP()->initPayment();
    return JS_TRUE;
}

JSBool jsbIAPIsEnabled(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( getIAP()->isPaymentEnabled() )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    return JS_TRUE;
}

JSBool jsbIAPSetCallback(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("iap.setCallback(func, obj): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSFunction* func = JS_ValueToFunction(cx, argv[0]);
    JSObject* obj = NULL;
    if( argc > 1 )
    {
        JS_ValueToObject(cx, argv[1], &obj);
    }
    
    IAPJSDelegate::getInstance()->setCallback(obj, func);
    
    return JS_TRUE;
}

JSBool jsbIAPMakePayment(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if ( argc < 4 )
    {
        CCLog("iap.makePayment(billno, product, quantity, username, zoneId): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strBillNo(arg0);
    string billno = strBillNo;
    int product = -1;
    JS_ValueToInt32(cx, argv[1], &product);
    int quantity = 1;
    JS_ValueToInt32(cx, argv[2], &quantity);
    JSString *arg3 = JS_ValueToString(cx, argv[3]);
    JSStringWrapper strUserName(arg3);
    string username = strUserName;
    int zoneId = 0;
    if( argc > 4 ){
        JS_ValueToInt32(cx, argv[4], &zoneId);
    }
    getIAP()->makePayment(billno, product, quantity, username, zoneId);
    
    return JS_TRUE;
}

JSBool jsbIAPGetStoreName(JSContext* cx, unsigned argc, JS::Value* vp)
{
    string storeName;
    getIAP()->getStoreName(storeName);
    jsval ret = c_string_to_jsval(cx, storeName.c_str());
    JS_SET_RVAL(cx, vp, ret);
    
    return JS_TRUE;
}

void registerIAP(JSContext* cx, JSObject* global)
{
    JSObject *sys = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vSys = OBJECT_TO_JSVAL(sys);
    JS_SetProperty(cx, global, "iap", &vSys);
    
    JS_DefineFunction(cx, sys, "init", jsbIAPInitPayment, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "isEnabled", jsbIAPIsEnabled, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "setCallback", jsbIAPSetCallback, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "makePayment", jsbIAPMakePayment, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, sys, "getStoreName", jsbIAPGetStoreName, 0, JSPROP_READONLY | JSPROP_PERMANENT);
}