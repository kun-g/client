//
//  ISystem.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-2.
//
//

#include "ISystem.h"

static ISystem* sSystemInstance = NULL;

void setSystem(ISystem *pSystem)
{
    sSystemInstance = pSystem;
}

ISystem* getSystem()
{
    return sSystemInstance;
}