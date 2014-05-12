//
//  CallbackManager.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-7.
//
//

#ifndef __DungeonJS__CallbackManager__
#define __DungeonJS__CallbackManager__

#include "cocos2d.h"
#include "ScriptingCore.h"

class JSCallback:
public cocos2d::CCObject
{
public:
    static JSCallback* alloc(JSFunction* func, unsigned argc, JSObject* obj = NULL);
    static JSCallback* alloc(JSObject* owner, const std::string &fname, unsigned argc);
    void setArgument(int index, const jsval &value);
    void setArgumentInt(int index, int value);
    void setArgumentDouble(int index, double value);
    void setArgumentBool(int index, bool value);
    void setArgumentString(int index, const std::string &value);
    
    void doCallback();
    
    void setDebugTag(const char* str);
    
private:
    JSCallback();
    ~JSCallback();
    
    std::string mFuncName;
    JSFunction* mFunc;
    JSObject* mObj;
    
    jsval* mArgv;
    unsigned mArgc;
    
    std::string mDebugTag;
};

class CallbackManager:
public cocos2d::CCObject
{
public:
    static CallbackManager* getInstance();
    
    void start();
    void reset();
    void tick(float delta);
    
    void postCallback(JSCallback* pCall);
    
private:
    CallbackManager();
    ~CallbackManager();
    
    pthread_mutex_t mMutex;
    bool mScheduled;
    cocos2d::CCArray mMsgList1;
    cocos2d::CCArray mMsgList2;
    cocos2d::CCArray *mpCurrMsgList;
};

#endif /* defined(__DungeonJS__CallbackManager__) */
