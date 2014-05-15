//
//  AndroidSystem.cpp
//  DungeonRaiders
//
//  Created by 马 颂文 on 13-2-19.
//  Copyright (c) 2013年 Trin Game. All rights reserved.
//

#include "AndroidSystem.h"
#include "cocos2d.h"
#include "platform/android/jni/JniHelper.h"
using namespace cocos2d;

using namespace std;

void AndroidSystem::getDocumentPath(string &out)
{
    out = CCFileUtils::sharedFileUtils()->getWritablePath();
}

void AndroidSystem::getResourcePath(string &out)
{
    out = string("");
}

SystemLanguage AndroidSystem::getSystemLanguage()
{
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
    return NetStatus_WIFI;
}

bool AndroidSystem::isPathExist(string file)
{
    return CCFileUtils::sharedFileUtils()->isFileExist(file.c_str());
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
    out = CCUserDefault::sharedUserDefault()->getStringForKey(key.c_str());
    return true;
}

void AndroidSystem::setPreference(string key, string val)
{
    CCUserDefault::sharedUserDefault()->setStringForKey(key.c_str(), val);
    CCUserDefault::sharedUserDefault()->flush();
}

bool AndroidSystem::isFirstLaunch()
{
    string launchFlag;
    getPreference("LAUNCH_FLAG", launchFlag);
    if( launchFlag != "" ){
        return false;
    }
    else{
        setPreference("LAUNCH_FLAG", "1");
        return true;
    }
}