//
//  ISystem.h
//  DungeonRaiders
//
//  Created by 马 颂文 on 13-2-19.
//  Copyright (c) 2013年 Trin Game. All rights reserved.
//

#ifndef __DungeonRaiders__ISystem__
#define __DungeonRaiders__ISystem__

#include <string>
#include <vector>

enum SystemLanguage
{
    Language_Other = 0,
    Language_SimplifiedChinese,
    Language_English,
};

enum NetStatus
{
    NetStatus_NotConnected = 0,
    NetStatus_WIFI,
    NetStatus_WAN,
};

class AlertDelegate
{
public:
    virtual void onAlertResult(int button) = 0;
};

class ISystem
{
public:
    virtual ~ISystem(){};
    
    //get system directory in defined types
    virtual void getDocumentPath(std::string &out) = 0;
    virtual void getResourcePath(std::string &out) = 0;

    //get the system language
    virtual SystemLanguage getSystemLanguage() = 0;
    
    //get the bundle version
    virtual void getVersion(std::string &out) = 0;
    
    //get the unique device id
    virtual void getDeviceId(std::string &out) = 0;
    
    //pop alert message
    virtual void alert(std::string title,
                       std::string message,
                       AlertDelegate* pCallback,
                       std::string cancel,
                       std::string button1,
                       std::string button2,
                       std::string button3) = 0;
    
    //schedule local notification
    virtual void scheduleLocalNotification(std::string key, double time, std::string message, std::string button) = 0;
    
    //query scheduled local notifications
    virtual void scheduledLocalNotifications(std::vector<std::string> &keylist) = 0;
    
    //cancel local notification
    virtual void unscheduleLocalNotification(std::string key) = 0;
    
    //cancel all local notifications
    virtual void unscheduleAllLocalNotifications() = 0;
    
    //set application badge number
    virtual void setAppBadgeNumber(int number) = 0;
    
    //open url
    virtual void openURL(std::string url) = 0;
    
    //check if jailbroken
    virtual bool isJailbroken() = 0;
    
    //check if pirated
    virtual bool isPirated() = 0;
    
    //check network status
    virtual NetStatus checkNetworkStatus() = 0;
    
    //file operations
    virtual bool isPathExist(std::string filepath) = 0;
    
    virtual bool createDirectoryAtPath(std::string path) = 0;
    
    virtual bool removeDirectory(std::string path) = 0;
    
    //system perferences
    virtual bool getPreference(std::string key, std::string &out) = 0;
    
    virtual bool isFirstLaunch() = 0;
    
    int viewSizeWidth = 640;
    int viewSizeHeight = 960;
    void setViewSizeWidth(int width);
    int getViewSizeWidth();
    void setViewSizeHeight(int height);
    int getViewSizeHeight();
};

//set and access to system
void setSystem(ISystem *pSystem);
ISystem* getSystem();

#endif /* defined(__DungeonRaiders__ISystem__) */
