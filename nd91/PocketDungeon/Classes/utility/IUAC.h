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
    virtual void onLoggedIn(const std::string &token) = 0;
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
    
    virtual void initUAC() = 0;
    virtual void presentLoginView() = 0;
    virtual void presentManageView() = 0;
    virtual void logout() = 0;
    
    virtual void onPause();
    virtual void onResume();
    
    virtual void getUserName(std::string &name) = 0;
    virtual void getUserId(std::string &token) = 0;
    
private:
    UACDelegate *mpDelegate;
};

void setUAC(IUAC* pUAC);
IUAC* getUAC();

#endif /* defined(__PocketDungeon__IUAC__) */
