//
//  TDGA.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-26.
//
//

#ifndef __PocketDungeon__TDGA__
#define __PocketDungeon__TDGA__

#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"
#include <string>

//account
JSBool jsbTDGASetAccountId(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGASetAccountType(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGASetAccountName(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGASetLevel(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGASetGender(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGASetAge(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGASetGameServer(JSContext* cx, unsigned argc, JS::Value* vp);

//payment & virtual currency
JSBool jsbTDGAPaymentRequest(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGAPaymentSuccess(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGAReward(JSContext* cx, unsigned argc, JS::Value* vp);

//item
JSBool jsbTDGAItemPurchase(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGAItemUse(JSContext* cx, unsigned argc, JS::Value* vp);

//quest
JSBool jsbTDGAQuestBegin(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGAQuestComplete(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbTDGAQuestFailed(JSContext* cx, unsigned argc, JS::Value* vp);

//event
JSBool jsbTDGAEvent(JSContext* cx, unsigned argc, JS::Value* vp);

void registerTDGA(JSContext* cx, JSObject* global);

#endif /* defined(__PocketDungeon__TDGA__) */
