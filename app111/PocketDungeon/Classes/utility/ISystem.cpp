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

void ISystem::setViewSizeWidth(int width)
{
    viewSizeWidth = width;
}

int ISystem::getViewSizeWidth()
{
    return viewSizeWidth;
}

void ISystem::setViewSizeHeight(int height)
{
    viewSizeHeight = height;
}

int ISystem::getViewSizeHeight()
{
    return viewSizeHeight;
}
