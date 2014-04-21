//
//  iOSfeedback.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-13.
//
//

#ifndef __PocketDungeon__iOSfeedback__
#define __PocketDungeon__iOSfeedback__

#include "IFeedback.h"

class iOSfeedback: public IFeedback
{
public:
    iOSfeedback();
    
    void initFeedback();
    
    //set attached variables
    void attachString(std::string key, std::string value);
    void attachInteger(std::string key, int value);
    void attachFloat(std::string key, float value);
    void cleanAttached();
    
    //functional
    void present();
    
private:
    NSMutableDictionary* mAttached;
};

#endif /* defined(__PocketDungeon__iOSfeedback__) */
