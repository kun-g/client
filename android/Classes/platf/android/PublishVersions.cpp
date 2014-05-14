//
//  PublishVersions.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#include "PublishVersions.h"

#import "../../utility/ISystem.h"
#import "AndroidSystem.h"
#import "../../utility/IIAP.h"
#import "AndroidIAP.h"
#import "../../utility/IUAC.h"
#import "AndroidUAC.h"

void preInitAPI()
{
    setSystem(new AndroidSystem());//set ios system
    setUAC(new AndroidUAC());
    setIAP(new AndroidIAP());
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