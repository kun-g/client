//
//  AndroidUAC.h
//  PocketDungeon-AppStore
//
//  Created by 马 颂文 on 14-4-20.
//
//

#ifndef __PocketDungeon_AppStore__AndroidUAC__
#define __PocketDungeon_AppStore__AndroidUAC__

#include "../../utility/IUAC.h"
#include "../../utility/IIAP.h"

class AndroidUAC : public IUAC
{
public:
    AndroidUAC();
    
    void initUAC();
    void presentLoginView();
    void presentManageView();
    void setAccountMode(int mode);
    void logout();
    void getUserName(std::string &name);
    void getUserId(std::string &token);
};

#endif /* defined(__PocketDungeon_AppStore__AndroidUAC__) */
