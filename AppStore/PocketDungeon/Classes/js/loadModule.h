//
//  loadModule.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-3.
//
//

#ifndef __DungeonJS__loadModule__
#define __DungeonJS__loadModule__

#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"

void registerLoadModule(JSContext* cx, JSObject* global);

JSBool loadModule(JSContext* cx, unsigned argc, jsval* vp);

#endif /* defined(__DungeonJS__loadModule__) */

