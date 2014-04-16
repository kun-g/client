//
//  IUAC.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#include "IUAC.h"

static IUAC* sUACInstance = NULL;

void setUAC(IUAC* pUAC)
{
    sUACInstance = pUAC;
}

IUAC* getUAC()
{
    return sUACInstance;
}

void IUAC::setUACDelegate(UACDelegate *pDelegate)
{
    mpDelegate = pDelegate;
}

UACDelegate* IUAC::getUACDelegate()
{
    return mpDelegate;
}

void IUAC::onResume(){}
void IUAC::onPause(){}