//
//  UAC.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#ifndef __PocketDungeon__UAC__
#define __PocketDungeon__UAC__

#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"
#include "utility/IUAC.h"
#include <string>

class UACJSDelegate :
public UACDelegate
{
public:
    static UACJSDelegate* getInstance();
    
    void setCallback(JSObject* obj);
    
    void onUACReady();
    void onLoggedIn(const std::string &token, int accountType);
    void onAccountChanged(const std::string &token, int accountType);
    void onLoggedOut();
    
    void onLoginViewClosed();
    void onManageViewClosed();
    
private:
    JSObject* mObject;
};

JSBool jsbUACInit(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbUACSetDelegate(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbUACSetAccountMode(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbUACPresentLoginView(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbUACPresentManageView(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbUACLogout(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbUACGetUserName(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbUACGetUserId(JSContext* cx, unsigned argc, JS::Value* vp);

void registerUAC(JSContext* cx, JSObject* global);

#endif /* defined(__PocketDungeon__UAC__) */
