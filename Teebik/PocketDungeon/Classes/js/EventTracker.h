//
//  EventTracker.h
//  PocketDungeon-Teebik
//
//  Created by Jovismac on 14-9-10.
//
//

#ifndef PocketDungeon_Teebik_EventTracker_h
#define PocketDungeon_Teebik_EventTracker_h

#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"
#include <string>

JSBool jsbEventTrackerCreateGAIEvent(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbEventTrackerCreateAFEvent(JSContext* cx, unsigned argc, JS::Value* vp);

void registerEventTracker(JSContext* cx, JSObject* global);

#endif
