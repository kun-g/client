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
#import "TeebikUAC.h"

#import "TalkingData.h"

void preInitAPI()
{
    setSystem(new iOSsystem());//set ios system
    setFeedback(new iOSfeedback());//set feedback
    TeebikUAC* tbk = new TeebikUAC();
    setIAP(tbk);
    setUAC(tbk);
    TDCCTalkingDataGA::onStart(TDGA_APPKEY, CHANNEL_ID_CSTR);
}

void postInitAPI()
{
    
}

void onPauseApp()
{
    
}

void onResumeApp()
{
    
}