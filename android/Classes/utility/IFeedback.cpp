//
//  IFeedback.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-13.
//
//

#include "IFeedback.h"

static IFeedback* sFeedbackInstance = NULL;

void setFeedback(IFeedback* pFeedback)
{
    sFeedbackInstance = pFeedback;
}

IFeedback* getFeedback()
{
    return sFeedbackInstance;
}