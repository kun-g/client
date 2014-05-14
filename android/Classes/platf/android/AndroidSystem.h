//
//  AndroidSystem.h
//  DungeonRaiders
//
//  Created by 马 颂文 on 13-2-19.
//  Copyright (c) 2013年 Trin Game. All rights reserved.
//

#ifndef __DungeonRaiders__AndroidSystem__
#define __DungeonRaiders__AndroidSystem__

#include <iostream>
#include "ISystem.h"

class AndroidSystem : public ISystem
{
public:

    void getDocumentPath(std::string &out);
    void getResourcePath(std::string &out);
    
    SystemLanguage getSystemLanguage();
    
    void getVersion(std::string &out);
    
    void getDeviceId(std::string &out);
    
    void alert(std::string title,
               std::string message,
               AlertDelegate* pCallback,
               std::string cancel,
               std::string button1,
               std::string button2,
               std::string button3);
    
    void scheduleLocalNotification(std::string key, double time, std::string message, std::string button);
    
    void scheduledLocalNotifications(std::vector<std::string> &keylist);
    
    void unscheduleLocalNotification(std::string key);
    
    void unscheduleAllLocalNotifications();
    
    void setAppBadgeNumber(int number);
    
    void openURL(std::string url);
    
    bool isJailbroken();
    
    bool isPirated();
    
    NetStatus checkNetworkStatus();
    
    bool isPathExist(std::string file);
    
    bool createDirectoryAtPath(std::string path);
    
    bool removeDirectory(std::string path);
    
    bool getPreference(std::string key, std::string &out);
    
    void setPreference(std::string key, std::string val);
    
    bool isFirstLaunch();
};

#endif /* defined(__DungeonRaiders__AndroidSystem__) */
