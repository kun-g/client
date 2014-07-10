//
//  IIAP.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-8-14.
//
//

#include "IIAP.h"

using namespace std;

static IIAP* sIAPInstance = NULL;

void setIAP(IIAP* pIAP)
{
    sIAPInstance = pIAP;
}

IIAP* getIAP()
{
    return sIAPInstance;
}

void IIAP::setIAPDelegate(IAPDelegate *pDelegate)
{
    mpDelegate = pDelegate;
}

IAPDelegate* IIAP::getIAPDelegate()
{
    return mpDelegate;
}