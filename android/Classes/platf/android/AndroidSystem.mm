//
//  AndroidSystem.cpp
//  DungeonRaiders
//
//  Created by 马 颂文 on 13-2-19.
//  Copyright (c) 2013年 Trin Game. All rights reserved.
//

#import "AndroidSystem.h"
#include "cocos2d.h"
using namespace cocos2d;

using namespace std;

void AndroidSystem::getDocumentPath(string &out)
{
    out = string("/");
}

void AndroidSystem::getResourcePath(string &out)
{
    out = string("/");
}

SystemLanguage AndroidSystem::getSystemLanguage()
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

void AndroidSystem::getVersion(string &out)
{
    out = string("1.0.5");
}

void AndroidSystem::getDeviceId(string &out)
{
    out = string("AndroidDeviceId");
}

void AndroidSystem::alert(string title, string message, AlertDelegate *pCallback, string cancel, string button1, string button2, string button3)
{
    // TODO
    CCLog(":: alert:%s: %s",title.c_str(), message.c_str());
}

void AndroidSystem::scheduleLocalNotification(std::string key, double time, std::string message, std::string button)
{
    CCLog(":: scheduleLocalNotification:%s",key.c_str());
}

void AndroidSystem::scheduledLocalNotifications(std::vector<std::string> &keylist)
{
    CCLog(":: scheduledLocalNotifications");
}

void AndroidSystem::unscheduleLocalNotification(std::string key)
{
    CCLog(":: unscheduleLocalNotification:%s",key.c_str());
}

void AndroidSystem::unscheduleAllLocalNotifications()
{
    CCLog(":: unscheduleAllLocalNotifications");
}

void AndroidSystem::setAppBadgeNumber(int number)
{
    // TODO
    CCLog(":: setAppBadgeNumber:%d", number);
}

void AndroidSystem::openURL(string url)
{
    // TODO
    CCLog(":: openURL:%s", url.c_str());
}

bool AndroidSystem::isJailbroken()
{//not implemented
    return false;
}

bool AndroidSystem::isPirated()
{
    return false;
}

NetStatus AndroidSystem::checkNetworkStatus()
{
    // TODO
    return 2;
}

bool AndroidSystem::isPathExist(string file)
{
    // TODO
    return false;
}

bool AndroidSystem::createDirectoryAtPath(string path)
{
    // TODO
    return false;
}

bool AndroidSystem::removeDirectory(string path)
{
    // TODO
    return false;
}

bool AndroidSystem::getPreference(string key, string &out)
{
    // TODO
    return false;
}

void AndroidSystem::setPreference(string key, string val)
{
    // TODO
}

bool AndroidSystem::isFirstLaunch()
{
    // TODO
    return true;
}