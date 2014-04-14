//
//  Sys.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-7.
//
//

#ifndef __DungeonJS__Sys__
#define __DungeonJS__Sys__

#include "cocos2d.h"
#include "cocos-ext.h"
#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"
#include "ISystem.h"

void triggerEnterBackground();
void triggerEnterForeground();

class JSAlertDelegate :
public AlertDelegate
{
public:
    static JSAlertDelegate* getInstance();
    
    void setAlertCallback(JSObject* obj, JSFunction* func);
    void onAlertResult(int button);
    
private:
    JSObject* mpObject;
    JSFunction* mpFunc;
};

JSBool jsbSysGetBinaryVersion(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysGetDeviceId(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysAlert(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysScheduleLocalNotification(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysScheduledLocalNotifications(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysUnscheduleLocalNotification(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysUnscheduleAllLocalNotifications(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysSetAppBadgeNumber(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysOpenURL(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysIsJailBroken(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysIsPirated(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysEnterBackgroundCallback(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysEnterForegroundCallback(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysCheckNetworkStatus(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysGetPreference(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSysReset(JSContext* cx, unsigned argc, JS::Value* vp);

void registerSys(JSContext* cx, JSObject* global);

#endif /* defined(__DungeonJS__Sys__) */
