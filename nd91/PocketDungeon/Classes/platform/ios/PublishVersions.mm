//
//  PublishVersions.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#include "PublishVersions.h"

#import "ISystem.h"
#import "iOSsystem.h"
#import "IIAP.h"
#import "AppStoreIAP.h"
#import "IFeedback.h"
#import "iOSfeedback.h"
#import "IUAC.h"
#import "91UAC.h"

#import "TalkingData.h"

void preInitAPI()
{
    setSystem(new iOSsystem());//set ios system
    //setFeedback(new iOSfeedback());//set feedback
    Nd91UAC* Nd91 = new Nd91UAC();
    setUAC(Nd91);
    setIAP(Nd91);
    TDCCTalkingDataGA::onStart(TDGA_APPKEY, CHANNEL_ID_CSTR);
}

void postInitAPI()
{
    
}

void onPauseApp()
{
    getUAC()->onPause();
}

void onResumeApp()
{
    getUAC()->onResume();
}