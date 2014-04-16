//
//  IFeedback.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-13.
//
//

#ifndef __PocketDungeon__IFeedback__
#define __PocketDungeon__IFeedback__

#include <string>

class IFeedback
{
public:
    virtual ~IFeedback(){};
    
    virtual void initFeedback() = 0;
    
    //set attached variables
    virtual void attachString(std::string key, std::string value) = 0;
    virtual void attachInteger(std::string key, int value) = 0;
    virtual void attachFloat(std::string key, float value) = 0;
    virtual void cleanAttached() = 0;
    
    //functional
    virtual void present() = 0;
};

void setFeedback(IFeedback* pFeedback);
IFeedback* getFeedback();

#endif /* defined(__PocketDungeon__IFeedback__) */
