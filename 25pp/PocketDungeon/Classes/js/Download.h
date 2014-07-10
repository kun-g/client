//
//  Download.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-8.
//
//

#ifndef __DungeonJS__Download__
#define __DungeonJS__Download__

#include "cocos2d.h"
#include "cocos-ext.h"
#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"

void download(const char* dst, const char* url, JSFunction* callback);

void upload(const char* dst, const char* url, JSFunction* callback);

#endif /* defined(__DungeonJS__Download__) */
