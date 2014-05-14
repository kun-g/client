//
//  AppStoreIAP.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-8-15.
//
//

#ifndef __DungeonJS__AppStoreIAP__
#define __DungeonJS__AppStoreIAP__

#include "IIAP.h"

class AndroidIAP:
public IIAP
{
public:
    void initPayment();
    bool isPaymentEnabled();
    void makePayment(std::string billno, int product, uint32_t quantity, std::string username, int zoneId);
    void getStoreName(std::string &name);
};

#endif /* defined(__DungeonJS__AppStoreIAP__) */
