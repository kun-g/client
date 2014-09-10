//
//  NativeAPI.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-5.
//
//

#include "NativeAPI.h"
#include "CCPlatformConfig.h"

#include "loadModule.h"
#include "Http.h"
#include "System.h"
#include "File.h"
#include "IAP.h"
#include "TCP.h"
#include "Feedback.h"
#include "UAC.h"
#include "TDGA.h"
#include "EventTracker.h"

#if defined(CC_TARGET_OS_IPHONE)
    #include "jsGameCenter.h"
#endif

void registerNativeAPI(JSContext* cx, JSObject* global)
{
    //add custom api to here
    registerLoadModule(cx, global);
    registerHttp(cx, global);
    registerSys(cx, global);
    registerFile(cx, global);
    registerTDGA(cx, global);
    registerIAP(cx, global);
    registerTcp(cx, global);
    registerFeedback(cx, global);
    registerUAC(cx, global);
    if( CC_TARGET_PLATFORM == CC_PLATFORM_IOS )
    {
        registerGameCenter(cx, global);
    }
    registerEventTracker(cx, global);
    
}