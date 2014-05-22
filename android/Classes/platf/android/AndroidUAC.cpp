//
//  AndroidUAC.cpp
//  PocketDungeon-AppStore
//
//  Created by 马 颂文 on 14-4-20.
//
//

#include "AndroidUAC.h"
#include "../../utility/ISystem.h"

using namespace std;

AndroidUAC::AndroidUAC()
{
    //initialize
}

void AndroidUAC::initUAC()
{
    //init UAC
    getUACDelegate()->onUACReady();
}

void AndroidUAC::presentLoginView()
{
	string deviceId;
	getSystem()->getDeviceId(deviceId);
    getUACDelegate()->onLoggedIn(deviceId, 1);
}

void AndroidUAC::presentManageView()
{
    // TODO
}

void AndroidUAC::setAccountMode(int mode)
{
    //TODO
}

void AndroidUAC::logout()
{
    getUACDelegate()->onLoggedOut();
}

void AndroidUAC::getUserName(string &name)
{
    getSystem()->getDeviceId(name);
}

void AndroidUAC::getUserId(string &token)
{
    getSystem()->getDeviceId(token);
}