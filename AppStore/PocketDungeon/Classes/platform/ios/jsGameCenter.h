//
//  jsGameCenter.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-14.
//
//

#ifndef __PocketDungeon__jsGameCenter__
#define __PocketDungeon__jsGameCenter__

#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"

JSBool jsbGameCenterSetCallback(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbGameCenterAuthenticateLocalPlayer(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbGameCenterIsLocalPlayerAuthenticated(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbGameCenterQueryFriendList(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbGameCenterRetriveFriendList(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbGameCenterRetrivePlayerGCID(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbGameCenterRetriveAlias(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbGameCenterRetrivePlayerDisplayName(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbGameCenterReportScore(JSContext* cx, unsigned argc, JS::Value* vp);

void registerGameCenter(JSContext* cx, JSObject* global);

#endif /* defined(__PocketDungeon__jsGameCenter__) */
