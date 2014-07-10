#ifndef ___CLASSES_CCRECTCLIP_H_
#define ___CLASSES_CCRECTCLIP_H_

#include "cocos2d.h"
#include "cocos-ext.h"

NS_CC_EXT_BEGIN

class CCRectClip :
public cocos2d::CCNode
{
public:
    virtual bool init();
    CREATE_FUNC(CCRectClip);
    
    void setClipRect(const cocos2d::CCRect& rect);
    const cocos2d::CCRect& getClipRect();
    
    virtual void visit();
    
private:
    cocos2d::CCRect mRealRect;
    cocos2d::CCRect mClipRect;
    float mScaleX, mScaleY;
};

NS_CC_EXT_END

#endif
