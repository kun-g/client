//
//  GameCenter.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-13.
//
//

#ifndef __PocketDungeon__GameCenter__
#define __PocketDungeon__GameCenter__

#include <string>
#include <vector>

class GameCenterDelegate
{
public:
    virtual ~GameCenterDelegate(){}
    
    virtual void localPlayerAuthenticated() = 0;
    virtual void friendListRetrived() = 0;
};

class GameCenter
{
public:
    static GameCenter* getInstance();
    
    void setDelegate(GameCenterDelegate* delgate);
    
    //authenticate
    bool isLocalPlayerAuthenticated();
    void authenticateLocalPlayer(bool forceLogin = false);
    
    //retrive info
    void queryFriendList();
    void retriveFriendList(std::vector<std::string> &out);
    void retrivePlayerGCID(std::string &out);
    void retrivePlayerAlias(std::string &out);
    void retrivePlayerDisplayName(std::string &out);
    
    //constructor
    GameCenter();
private:
    GameCenterDelegate* mpDelegate;
    bool mForceLogin;
    std::vector<std::string> mFriendList;
};

#endif /* defined(__PocketDungeon__GameCenter__) */
