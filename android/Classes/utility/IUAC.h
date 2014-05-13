//
//  IUAC.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#ifndef __PocketDungeon__IUAC__
#define __PocketDungeon__IUAC__

#include <string>



class UACDelegate
{
public:
    virtual void onUACReady() = 0;
    virtual void onLoggedIn(const std::string &token, int accountType) = 0;
    virtual void onAccountChanged(const std::string &token, int accountType) = 0;
    virtual void onLoggedOut() = 0;
    
    virtual void onLoginViewClosed() = 0;
    virtual void onManageViewClosed() = 0;
};

class IUAC
{
public:
    virtual ~IUAC(){};
    
    void setUACDelegate(UACDelegate *pDelegate);
    UACDelegate* getUACDelegate();
    
    //init uac module
    virtual void initUAC() = 0;
    
    //present login view / start to login
    virtual void presentLoginView() = 0;
    
    //present account manage view
    virtual void presentManageView() = 0;
    
    //logout current account
    virtual void logout() = 0;
    
    //switch account mode
    virtual void setAccountMode(int mode) = 0;
    
    virtual void getUserName(std::string &name) = 0;
    virtual void getUserId(std::string &token) = 0;
    
private:
    UACDelegate *mpDelegate;
};

void setUAC(IUAC* pUAC);
IUAC* getUAC();

#endif /* defined(__PocketDungeon__IUAC__) */
