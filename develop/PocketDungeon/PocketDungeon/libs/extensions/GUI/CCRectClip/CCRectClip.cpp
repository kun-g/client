#include "CCRectClip.h"

using namespace cocos2d;
using namespace cocos2d::extension;

bool CCRectClip::init()
{
    if( !CCNode::init() )
    {
        return false;
    }
    
    mClipRect = CCRectMake(0, 0, 0, 0);
    
    return true;
}

void CCRectClip::setClipRect(const CCRect& rect)
{
    mClipRect = rect;
    mRealRect.size = mClipRect.size;
}

const CCRect& CCRectClip::getClipRect()
{
    return mClipRect;
}

void CCRectClip::visit()
{
    mRealRect.origin = convertToWorldSpace(mClipRect.origin);
    
    glEnable(GL_SCISSOR_TEST);

    CCEGLView::sharedOpenGLView()->setScissorInPoints(mRealRect.origin.x, mRealRect.origin.y, mRealRect.size.width, mRealRect.size.height);

    CCNode::visit();

    glDisable(GL_SCISSOR_TEST);
}
