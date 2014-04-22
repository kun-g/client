//
//  GameCenterUAC.cpp
//  PocketDungeon-AppStore
//
//  Created by 马 颂文 on 14-4-20.
//
//

#include "GameCenterUAC.h"
#include "ISystem.h"

using namespace std;

#define ACCOUNT_DEVICE 1
#define ACCOUNT_GAMECENTER 5

GameCenterUAC::GameCenterUAC()
{
    mAccountMode = GCUAC_Device;
}

void GameCenterUAC::initUAC()
{
    GameCenter::getInstance()->setDelegate(this);
    string strMode;
    if( getSystem()->getPreference("GCMode", strMode) ){
        if( strMode == "1" )
        {
            mAccountMode = GCUAC_AppleId;
            getSystem()->getPreference("GCToken", mAccountToken);
        };
    }
    getUACDelegate()->onUACReady();
}

void GameCenterUAC::presentLoginView()
{
    printf("presetLoginView");
    if( mAccountMode == GCUAC_Device ){
        string deviceId;
        getSystem()->getDeviceId(deviceId);
        mAccountToken = deviceId;
        getUACDelegate()->onLoggedIn(deviceId, ACCOUNT_DEVICE);
        GameCenter::getInstance()->authenticateLocalPlayer();
    }
    else{
        getUACDelegate()->onLoggedIn(mAccountToken, ACCOUNT_GAMECENTER);
    }
}

void GameCenterUAC::presentManageView()
{
    if( GameCenter::getInstance()->isLocalPlayerAuthenticated() ){
        GameCenter::getInstance()->showGameCenterView();
    }
    else{
        GameCenter::getInstance()->authenticateLocalPlayer(true);
    }
}

void GameCenterUAC::setAccountMode(int mode)
{
    mAccountMode = (GCUAC_Mode)mode;
    string strMode = "0";
    if( mode != 0 ) { strMode = "1"; }
    getSystem()->setPreference("GCMode", strMode);
}

void GameCenterUAC::logout()
{
    getUACDelegate()->onLoggedOut();
}

void GameCenterUAC::getUserName(string &name)
{
    if( mAccountMode == GCUAC_Device ){
        getSystem()->getDeviceId(name);
    }
    else{
        name = mAccountToken;
    }
}

void GameCenterUAC::getUserId(string &token)
{
    GameCenter::getInstance()->retrivePlayerGCID(token);
}

void GameCenterUAC::localPlayerAuthenticated()
{
    string token;
    GameCenter::getInstance()->retrivePlayerGCID(token);
    if( mAccountMode != GCUAC_AppleId
       || mAccountToken != token )
    {
        mAccountToken = token;
        getSystem()->setPreference("GCToken", mAccountToken);
        getUACDelegate()->onAccountChanged(token, ACCOUNT_GAMECENTER);
    }
}

void GameCenterUAC::friendListRetrived()
{
    //do nothing for now
}