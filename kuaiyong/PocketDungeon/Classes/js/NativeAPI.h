//
//  NativeAPI.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-5.
//
//

#ifndef __DungeonJS__NativeAPI__
#define __DungeonJS__NativeAPI__

#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"

void registerNativeAPI(JSContext* cx, JSObject* global);

#endif /* defined(__DungeonJS__NativeAPI__) */
