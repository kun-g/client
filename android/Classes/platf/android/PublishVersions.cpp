//
//  PublishVersions.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#include "PublishVersions.h"

#include "../../utility/ISystem.h"
#include "AndroidSystem.h"
#include "../../utility/IIAP.h"
#include "AndroidIAP.h"
#include "../../utility/IUAC.h"
#include "AndroidUAC.h"

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