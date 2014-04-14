//
//  Feedback.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-13.
//
//

#ifndef __PocketDungeon__Feedback__
#define __PocketDungeon__Feedback__

#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"

JSBool jsbFeedbackInit(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFeedbackAttachString(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFeedbackAttachNumber(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFeedbackCleanAttach(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFeedbackPresent(JSContext* cx, unsigned argc, JS::Value* vp);

void registerFeedback(JSContext* cx, JSObject* global);

#endif /* defined(__PocketDungeon__Feedback__) */
