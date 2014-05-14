//
//  GameCenterUAC.h
//  PocketDungeon-AppStore
//
//  Created by 马 颂文 on 14-4-20.
//
//

#ifndef __PocketDungeon_AppStore__GameCenterUAC__
#define __PocketDungeon_AppStore__GameCenterUAC__

#include "IUAC.h"
#include "IIAP.h"
#include "GameCenter.h"

typedef enum {
    GCUAC_Device = 0,
    GCUAC_AppleId,
}GCUAC_Mode;

class GameCenterUAC : public IUAC, public GameCenterDelegate
{
public:
    GameCenterUAC();
    
    void initUAC();
    void presentLoginView();
    void presentManageView();
    void setAccountMode(int mode);
    void logout();
    void getUserName(std::string &name);
    void getUserId(std::string &token);
    
    //delegates
    void localPlayerAuthenticated();
    void friendListRetrived();
    
private:
    GCUAC_Mode mAccountMode;
    std::string mAccountToken;
};

#endif /* defined(__PocketDungeon_AppStore__GameCenterUAC__) */
