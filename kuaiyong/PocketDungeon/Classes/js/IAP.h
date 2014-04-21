//
//  IAP.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-8-14.
//
//

#ifndef __DungeonJS__IAP__
#define __DungeonJS__IAP__

#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"
#include "IIAP.h"
#include <string>

class IAPJSDelegate :
public IAPDelegate
{
public:
    static IAPJSDelegate* getInstance();
    
    void setCallback(JSObject* obj, JSFunction* func);
    
    void onPaymentResult(PaymentResult result, int product, std::string message);
    
private:
    JSObject* mObject;
    JSFunction* mFunc;
};

JSBool jsbIAPInitPayment(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbIAPIsEnabled(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbIAPSetCallback(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbIAPMakePayment(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbIAPGetStoreName(JSContext* cx, unsigned argc, JS::Value* vp);

void registerIAP(JSContext* cx, JSObject* global);

#endif /* defined(__DungeonJS__IAP__) */
