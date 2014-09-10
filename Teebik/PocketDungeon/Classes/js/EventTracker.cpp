//
//  EventTracker.cpp
//  PocketDungeon-Teebik
//
//  Created by Jovismac on 14-9-10.
//
//

#include "EventTracker.h"
#include "iEventTracker.h"

JSBool jsbEventTrackerCreateGAIEvent(JSContext* cx, unsigned argc, JS::Value* vp){
    if (argc < 2 || argc > 4) {
        CCLog("evtTracker.createEvent: wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString* arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strCategory(arg0);
    string category = strCategory;
    
    JSString* arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strAction(arg1);
    string action = strAction;
    
    JSString* arg2 = JS_ValueToString(cx, argv[2]);
    JSStringWrapper strLabel(arg2);
    string label = strLabel;
    
    
    double value;
    JS_ValueToNumber(cx, argv[3], &value);
    createGAIEvent(category, action, label, value);
    return JS_TRUE;
}

JSBool jsbEventTrackerCreateAFEvent(JSContext* cx, unsigned argc, JS::Value* vp){
    if (argc != 2) {
        CCLog("evtTracker.createEvent: wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString* arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strEvent(arg0);
    string event = strEvent;
    
    JSString* arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strValue(arg1);
    string value = strValue;
    
    createAFEvent(event, value);

    return JS_TRUE;
}

void registerEventTracker(JSContext* cx, JSObject* global){
    JSObject* evtTracker = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vEvtTracker = OBJECT_TO_JSVAL(evtTracker);
    JS_SetProperty(cx, global, "evtTracker", &vEvtTracker);
    
    JS_DefineFunction(cx, evtTracker, "createGAIEvent", jsbEventTrackerCreateGAIEvent, 4, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, evtTracker, "createAFEvent", jsbEventTrackerCreateAFEvent, 2, JSPROP_READONLY | JSPROP_PERMANENT);
}