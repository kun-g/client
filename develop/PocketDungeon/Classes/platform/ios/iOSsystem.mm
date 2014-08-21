//
//  iOSsystem.cpp
//  DungeonRaiders
//
//  Created by 马 颂文 on 13-2-19.
//  Copyright (c) 2013年 Trin Game. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "iOSsystem.h"
#import "Reachability.h"
#import <AdSupport/AdSupport.h>
#import "OpenUDID.h"
#import "TalkingData.h"

#include "cocos2d.h"
using namespace cocos2d;

using namespace std;

void iOSsystem::getDocumentPath(string &out)
{
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *dlcPath = [[paths objectAtIndex:0] stringByAppendingString:@"/"];
    out = string([dlcPath cStringUsingEncoding:NSUTF8StringEncoding]);
}

void iOSsystem::getResourcePath(string &out)
{
    out = string([[[NSBundle mainBundle].resourcePath stringByAppendingString:@"/"] cStringUsingEncoding:NSUTF8StringEncoding]);
}

SystemLanguage iOSsystem::getSystemLanguage()
{
    NSString *language = [[NSLocale preferredLanguages] objectAtIndex:0];
    //NSLog(@"Language = %@", language);
    if( [language compare:@"zh-Hans"] == NSOrderedSame )
    {
        return Language_SimplifiedChinese;
    }
    if( [language compare:@"zh-Hant"] == NSOrderedSame )
    {
        return Language_SimplifiedChinese;
    }
    if( [language compare:@"en"] == NSOrderedSame )
    {
        return Language_English;
    }
    return Language_Other;
}

void iOSsystem::getVersion(string &out)
{
    NSString* strVersion = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
    out = string([strVersion cStringUsingEncoding:NSUTF8StringEncoding]);
}

void iOSsystem::getDeviceId(string &out)
{
    out = string(TDCCTalkingDataGA::getDeviceId());
}

void iOSsystem::alert(string title, string message, AlertDelegate *pCallback, string cancel, string button1, string button2, string button3)
{
    @autoreleasepool {
        //process arguments
        NSString* strTitle = [NSString stringWithCString:title.c_str() encoding:NSUTF8StringEncoding];
        NSString* strMessage = [NSString stringWithCString:message.c_str() encoding:NSUTF8StringEncoding];
        NSString* strCancel = [NSString stringWithCString:cancel.c_str() encoding:NSUTF8StringEncoding];
        NSString* strButton1 = nil;
        NSString* strButton2 = nil;
        NSString* strButton3 = nil;
        
        //check button number
        int buttonCount = 0;
        if( !button1.empty() )
        {
            buttonCount = 1;
            strButton1 = [NSString stringWithCString:button1.c_str() encoding:NSUTF8StringEncoding];
        }
        if( !button2.empty() )
        {
            buttonCount = 2;
            strButton2 = [NSString stringWithCString:button2.c_str() encoding:NSUTF8StringEncoding];
        }
        if( !button3.empty() )
        {
            buttonCount = 3;
            strButton3 = [NSString stringWithCString:button3.c_str() encoding:NSUTF8StringEncoding];
        }
        
        //create alert view
        UIAlertView* alertView = nil;
        switch (buttonCount) {
            case 0:
            {
                alertView = [[UIAlertView alloc] initWithTitle:strTitle
                                                       message:strMessage
                                                      delegate:[SystemDelegate sharedSystemDelegate]
                                             cancelButtonTitle:strCancel
                                             otherButtonTitles:nil];
            }
                break;
            case 1:
            {
                alertView = [[UIAlertView alloc] initWithTitle:strTitle
                                                       message:strMessage
                                                      delegate:[SystemDelegate sharedSystemDelegate]
                                             cancelButtonTitle:strCancel
                                             otherButtonTitles:strButton1, nil];
            }
                break;
            case 2:
            {
                alertView = [[UIAlertView alloc] initWithTitle:strTitle
                                                       message:strMessage
                                                      delegate:[SystemDelegate sharedSystemDelegate]
                                             cancelButtonTitle:strCancel
                                             otherButtonTitles:strButton1, strButton2, nil];
            }
                break;
            case 3:
            {
                alertView = [[UIAlertView alloc] initWithTitle:strTitle
                                                       message:strMessage
                                                      delegate:[SystemDelegate sharedSystemDelegate]
                                             cancelButtonTitle:strCancel
                                             otherButtonTitles:strButton1, strButton2, strButton3, nil];
            }
                break;
            default://wrong arguments.
                return;
        }
        //register callback
        [[SystemDelegate sharedSystemDelegate] setAlertDelegate:pCallback];
        
        //show alert view
        [alertView show];
        [alertView release];
    }
}

void iOSsystem::scheduleLocalNotification(std::string key, double time, std::string message, std::string button)
{
    @autoreleasepool {
        //process arguments
        NSString* strKey = [NSString stringWithCString:key.c_str() encoding:NSUTF8StringEncoding];
        NSDate* fireDate = [NSDate dateWithTimeIntervalSince1970:time];
        NSString* strMessage = [NSString stringWithCString:message.c_str() encoding:NSUTF8StringEncoding];
        NSString* strButton = [NSString stringWithCString:button.c_str() encoding:NSUTF8StringEncoding];
        
        UILocalNotification* notification = [[UILocalNotification alloc] init];
        notification.timeZone = [NSTimeZone defaultTimeZone];
        notification.fireDate = fireDate;
        notification.applicationIconBadgeNumber = 1;
        notification.alertBody = strMessage;
        notification.alertAction = strButton;
        notification.soundName = UILocalNotificationDefaultSoundName;
        
        //set key
        NSDictionary* keys = [NSDictionary dictionaryWithObject:strKey forKey:@"key"];
        notification.userInfo = keys;
        
        [[UIApplication sharedApplication] scheduleLocalNotification:notification];
        
        [notification release];
    }
}

void iOSsystem::scheduledLocalNotifications(std::vector<std::string> &keylist)
{
    @autoreleasepool {
        keylist.clear();
        
        NSArray* list = [UIApplication sharedApplication].scheduledLocalNotifications;
        for(UILocalNotification* notification in list)
        {
            NSString* strKey = [notification.userInfo objectForKey:@"key"];
            string key = [strKey cStringUsingEncoding:NSUTF8StringEncoding];
            keylist.push_back(key);
        }
    }
}

void iOSsystem::unscheduleLocalNotification(std::string key)
{
    @autoreleasepool {
        NSString* target = [NSString stringWithCString:key.c_str() encoding:NSUTF8StringEncoding];
        
        NSArray* list = [[UIApplication sharedApplication] scheduledLocalNotifications];
        for(UILocalNotification* notification in list)
        {
            NSString* strKey = [notification.userInfo objectForKey:@"key"];
            if( [strKey compare:target] == NSOrderedSame )
            {//found
                [[UIApplication sharedApplication] cancelLocalNotification:notification];
                break;
            }
        }
    }
}

void iOSsystem::unscheduleAllLocalNotifications()
{
    [[UIApplication sharedApplication] cancelAllLocalNotifications];
}

void iOSsystem::setAppBadgeNumber(int number)
{
    [[UIApplication sharedApplication] setApplicationIconBadgeNumber:number];
}

void iOSsystem::openURL(string url)
{
    NSString* strURL = [[NSString alloc] initWithCString:url.c_str() encoding:NSUTF8StringEncoding];
    NSURL* objURL = [[NSURL alloc] initWithString:strURL];
    [[UIApplication sharedApplication] openURL:objURL];
    [objURL release];
    [strURL release];
}

bool iOSsystem::isJailbroken()
{//not implemented
    return false;
}

bool iOSsystem::isPirated()
{
    return false;
}

NetStatus iOSsystem::checkNetworkStatus()
{
    NetworkStatus status = [[Reachability reachabilityForInternetConnection] currentReachabilityStatus];
    switch (status) {
        case ReachableViaWiFi:
            return NetStatus_WIFI;
        case ReachableViaWWAN:
            return NetStatus_WAN;
        case NotReachable:
            return NetStatus_NotConnected;
    }
    return NetStatus_NotConnected;
}

bool iOSsystem::isPathExist(string file)
{
    NSFileManager *manager = [NSFileManager defaultManager];
    return [manager fileExistsAtPath:[NSString stringWithCString:file.c_str() encoding:NSUTF8StringEncoding]];
}

bool iOSsystem::createDirectoryAtPath(string path)
{
    NSFileManager *manager = [NSFileManager defaultManager];
    return [manager createDirectoryAtPath:[NSString stringWithCString:path.c_str() encoding:NSUTF8StringEncoding] withIntermediateDirectories:YES attributes:NULL error:NULL];
}

bool iOSsystem::removeDirectory(string path)
{
    NSFileManager *manager = [NSFileManager defaultManager];
    return [manager removeItemAtPath:[NSString stringWithCString:path.c_str() encoding:NSUTF8StringEncoding] error:nil];
}

bool iOSsystem::getPreference(string key, string &out)
{
    //special values 测试使用的代码
    if( key == "flag_debug" ){
        out = string("1");
        return YES;
    }
//    if( key == "flag_blackbox" ){
//        out = string("1");
//        return YES;
//    }
    
    bool ret = true;
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString* strKey = [[NSString alloc] initWithCString:key.c_str() encoding:NSUTF8StringEncoding];
    id value = [defaults objectForKey:strKey];
    if( value == nil )
    {
        ret = false;
        out = "";
    }
    else
    {
        NSString* strOut = [value description];
        out = [strOut cStringUsingEncoding:NSUTF8StringEncoding];
    }
    [strKey release];
    
    return ret;
}

bool iOSsystem::isFirstLaunch()
{
    bool ret;
    @autoreleasepool {
        NSString* lastVersion = [[NSUserDefaults standardUserDefaults] stringForKey:@"LastVersion"];
        NSString* currVersion = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
        if( [currVersion compare:lastVersion] == NSOrderedSame ){
            ret = false;
        }
        else{
            ret = true;
            [[NSUserDefaults standardUserDefaults] setObject:currVersion forKey:@"LastVersion"];
            [[NSUserDefaults standardUserDefaults] synchronize];
        }
    }
    return ret;
}

/*** System Delegate ***/

@implementation SystemDelegate

+(SystemDelegate*) sharedSystemDelegate
{
    static SystemDelegate* sInstance = [[SystemDelegate alloc] init];
    return sInstance;
}

-(void)setAlertDelegate:(AlertDelegate *)pAlertDelegate
{
    mpAlertDelegate = pAlertDelegate;
}

-(void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    mpAlertDelegate->onAlertResult(buttonIndex);
}

@end


