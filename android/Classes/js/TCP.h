//
//  TCP.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-9-9.
//
//

#ifndef __DungeonJS__TCP__
#define __DungeonJS__TCP__

#include "cocos2d.h"
#include "cocos-ext.h"
#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"
#include "utility/ISystem.h"

void clearAllTCPConnections();

JSBool jsbTcpCreate(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTcpOpen(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTcpSend(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTcpClose(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTcpDestroy(JSContext* cx, unsigned argc, JS::Value* vp);

void registerTcp(JSContext* cx, JSObject* global);

#endif /* defined(__DungeonJS__TCP__) */
