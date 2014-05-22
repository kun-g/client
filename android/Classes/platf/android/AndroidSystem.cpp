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
    JniMethodInfo t;
    jstring ret;
    if( JniHelper::getStaticMethodInfo(t, "com/tringame/SystemInvoke", "getBundleVersion", "()Ljava/lang/String;") ){
        ret = (jstring)t.env->CallStaticObjectMethod(t.classID, t.methodID);
        t.env->DeleteLocalRef(t.classID);
        out = JniHelper::jstring2string(ret);
    }
    else{
        out = string("undefined");
    }
}

void AndroidSystem::getDeviceId(string &out)
{
    JniMethodInfo t;
    jstring ret;
    if( JniHelper::getStaticMethodInfo(t, "com/tringame/SystemInvoke", "getDeviceId", "()Ljava/lang/String;") ){
        ret = (jstring)t.env->CallStaticObjectMethod(t.classID, t.methodID);
        t.env->DeleteLocalRef(t.classID);
        out = JniHelper::jstring2string(ret);
    }
    else{
        out = string("undefined");
    }
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
    JniMethodInfo t;
    if( JniHelper::getStaticMethodInfo(t, "com/tringame/SystemInvoke", "openURL", "(Ljava/lang/String;)V") ){
        jstring jurl = t.env->NewStringUTF(url.c_str());
        t.env->CallStaticVoidMethod(t.classID, t.methodID, jurl);
        t.env->DeleteLocalRef(t.classID);
    }
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
    JniMethodInfo t;
    int ret = 0;
    if( JniHelper::getStaticMethodInfo(t, "com/tringame/SystemInvoke", "checkNetworkStatus", "()I") ){
        ret = t.env->CallStaticIntMethod(t.classID, t.methodID);
        t.env->DeleteLocalRef(t.classID);
    }
    if( ret == 0 ){
        return NetStatus_NotConnected;
    }
    else{
        return NetStatus_WIFI;
    }
}

bool AndroidSystem::isPathExist(string file)
{
    return CCFileUtils::sharedFileUtils()->isFileExist(file.c_str());
}

bool AndroidSystem::createDirectoryAtPath(string path)
{
    JniMethodInfo t;
    bool ret = false;
    if( JniHelper::getStaticMethodInfo(t, "com/tringame/SystemInvoke", "createDirectoryAtPath", "(Ljava/lang/String;)Z") ){
        jstring jpath = t.env->NewStringUTF(path.c_str());
        ret = t.env->CallStaticBooleanMethod(t.classID, t.methodID, jpath);
        t.env->DeleteLocalRef(t.classID);
        t.env->DeleteLocalRef(jpath);
    }
    return ret;
}

bool AndroidSystem::removeDirectory(string path)
{
    JniMethodInfo t;
    bool ret = false;
    if( JniHelper::getStaticMethodInfo(t, "com/tringame/SystemInvoke", "removeDirectory", "(Ljava/lang/String;)Z") ){
        jstring jpath = t.env->NewStringUTF(path.c_str());
        ret = t.env->CallStaticBooleanMethod(t.classID, t.methodID, jpath);
        t.env->DeleteLocalRef(t.classID);
        t.env->DeleteLocalRef(jpath);
    }
    return ret;
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