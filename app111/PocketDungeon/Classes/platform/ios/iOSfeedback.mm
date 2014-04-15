//
//  iOSfeedback.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-13.
//
//

#import "AppController.h"
#import "RootViewController.h"
#include "iOSfeedback.h"
#include "UMFeedback.h"
#include "PublishVersions.h"

using namespace std;

iOSfeedback::iOSfeedback()
{
    mAttached = NULL;
}

void iOSfeedback::initFeedback(){}

void iOSfeedback::attachString(std::string key, std::string value)
{
    if( mAttached == NULL )
    {
        mAttached = [[NSMutableDictionary alloc] init];
    }
    NSString* strKey = [NSString stringWithUTF8String:key.c_str()];
    NSString* strValue = [NSString stringWithUTF8String:value.c_str()];
    [mAttached setObject:strValue forKey:strKey];
}

void iOSfeedback::attachInteger(std::string key, int value)
{
    if( mAttached == NULL )
    {
        mAttached = [[NSMutableDictionary alloc] init];
    }
    NSString* strKey = [NSString stringWithUTF8String:key.c_str()];
    NSNumber* numValue = [NSNumber numberWithInt:value];
    [mAttached setObject:numValue forKey:strKey];
}

void iOSfeedback::attachFloat(std::string key, float value)
{
    if( mAttached == NULL )
    {
        mAttached = [[NSMutableDictionary alloc] init];
    }
    NSString* strKey = [NSString stringWithUTF8String:key.c_str()];
    NSNumber* numValue = [NSNumber numberWithFloat:value];
    [mAttached setObject:numValue forKey:strKey];
}

void iOSfeedback::cleanAttached()
{
    if( mAttached != NULL )
    {
        [mAttached release];
        mAttached = NULL;
    }
}

void iOSfeedback::present()
{
    AppController* delegate = (AppController*)[[UIApplication sharedApplication] delegate];
    if( mAttached != NULL )
    {
        [UMFeedback showFeedback:delegate.viewController withAppkey:UMENG_APPKEY dictionary:mAttached];
    }
    else
    {
        [UMFeedback showFeedback:delegate.viewController withAppkey:UMENG_APPKEY];
    }
}