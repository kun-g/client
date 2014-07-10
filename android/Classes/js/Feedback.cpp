//
//  Feedback.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-13.
//
//

#include "Feedback.h"
#include "utility/IFeedback.h"
#include <string>

using namespace std;

JSBool jsbFeedbackInit(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getFeedback()->initFeedback();
    return JS_TRUE;
}

JSBool jsbFeedbackAttachString(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("feedback.attachString(key, value): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strKey(arg0);
    JSStringWrapper strValue(arg1);
    string key = strKey;
    string value = strValue;
    
    getFeedback()->attachString(key, value);
    
    return JS_TRUE;
}

JSBool jsbFeedbackAttachNumber(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("feedback.attachNumber(key, value): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strKey(arg0);
    string key = strKey;
    
    if( JSVAL_IS_INT(argv[1]) )
    {
        int val;
        JS_ValueToInt32(cx, argv[1], &val);
        getFeedback()->attachInteger(key, val);
    }
    else
    {
        double val;
        JS_ValueToNumber(cx, argv[1], &val);
        getFeedback()->attachFloat(key, val);
    }
    
    return JS_TRUE;
}

JSBool jsbFeedbackCleanAttach(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getFeedback()->cleanAttached();
    return JS_TRUE;
}

JSBool jsbFeedbackPresent(JSContext* cx, unsigned argc, JS::Value* vp)
{
    getFeedback()->present();
    return JS_TRUE;
}

void registerFeedback(JSContext* cx, JSObject* global)
{
    JSObject *fb = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vFeedback = OBJECT_TO_JSVAL(fb);
    JS_SetProperty(cx, global, "feedback", &vFeedback);
    
    JS_DefineFunction(cx, fb, "init", jsbFeedbackInit, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, fb, "attachString", jsbFeedbackAttachString, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, fb, "attachNumber", jsbFeedbackAttachNumber, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, fb, "cleanAttach", jsbFeedbackCleanAttach, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, fb, "present", jsbFeedbackPresent, 0, JSPROP_READONLY | JSPROP_PERMANENT);
}