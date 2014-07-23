//
//  CallbackManager.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-7.
//
//

#include "CallbackManager.h"
#include "SimpleAudioEngine.h"

using namespace cocos2d;
using namespace std;
using namespace CocosDenshion;

/*** JSCallback ***/

JSCallback::JSCallback()
{
    mFunc = NULL;
    mArgv = NULL;
    mArgc = 0;
}

JSCallback::~JSCallback()
{
    mFunc = NULL;
    mArgc = 0;
    if( mArgv != NULL )
    {
        delete [] mArgv;
        mArgv = NULL;
    }
}

JSCallback* JSCallback::alloc(JSFunction *func, unsigned int argc, JSObject* obj)
{
    JSCallback *pRet = new JSCallback();
    pRet->mFunc = func;
    pRet->mArgc = argc;
    pRet->mArgv = new jsval[argc];
    pRet->mObj = obj;
    
    return pRet;
}

JSCallback* JSCallback::alloc(JSObject* owner, const std::string &fname, unsigned argc)
{
    JSCallback *pRet = new JSCallback();
    pRet->mFuncName = fname;
    pRet->mFunc = NULL;
    pRet->mArgc = argc;
    pRet->mArgv = new jsval[argc];
    pRet->mObj = owner;
    
    return pRet;
}

void JSCallback::setArgument(int index, const jsval &value)
{
    if( index < mArgc )
    {
        mArgv[index] = value;
    }
}

void JSCallback::setArgumentInt(int index, int value)
{
    jsval v = INT_TO_JSVAL(value);
    setArgument(index, v);
}

void JSCallback::setArgumentDouble(int index, double value)
{
    jsval v = DOUBLE_TO_JSVAL(value);
    setArgument(index, v);
}

void JSCallback::setArgumentBool(int index, bool value)
{
    if( value )
    {
        setArgument(index, JSVAL_TRUE);
    }
    else
    {
        setArgument(index, JSVAL_FALSE);
    }
}

void JSCallback::setArgumentString(int index, const string &value)
{
    JSContext *cx = ScriptingCore::getInstance()->getGlobalContext();
    jsval v = c_string_to_jsval(cx, value.c_str());
    setArgument(index, v);
}

void JSCallback::setDebugTag(const char *str)
{
    mDebugTag = str;
}

void JSCallback::doCallback()
{
    JSContext *cx = ScriptingCore::getInstance()->getGlobalContext();
    jsval ret;
    if( mFunc != NULL )
    {
        jsval fval = OBJECT_TO_JSVAL(JS_GetFunctionObject(mFunc));
        if( mObj == NULL )
        {
            JS_CallFunctionValue(cx, NULL, fval, mArgc, mArgv, &ret);
        }
        else{
            JS_CallFunctionValue(cx, mObj, fval, mArgc, mArgv, &ret);
        }
    }
    else
    {
        JS_CallFunctionName(cx, mObj, mFuncName.c_str(), mArgc, mArgv, &ret);
    }
}

/*** CallbackManager ***/

CallbackManager::CallbackManager()
{
    mpCurrMsgList = &mMsgList1;
    mScheduled = false;
    pthread_mutex_init(&mMutex, NULL);
}

CallbackManager::~CallbackManager()
{
    pthread_mutex_destroy(&mMutex);
}

CallbackManager* CallbackManager::getInstance()
{
    static CallbackManager cm;
    return &cm;
}

void CallbackManager::start()
{
    if( !mScheduled )
    {
        CCDirector::sharedDirector()->getScheduler()->scheduleSelector(schedule_selector(CallbackManager::tick), this, 0, false);
        
        mScheduled = true;
        
    }
}

void CallbackManager::reset()
{
    pthread_mutex_lock(&mMutex);
    mMsgList1.removeAllObjects();
    mMsgList2.removeAllObjects();
    mpCurrMsgList = &mMsgList1;
    pthread_mutex_unlock(&mMutex);
}

void CallbackManager::postCallback(JSCallback *pCall)
{
    pthread_mutex_lock(&mMutex);
    mpCurrMsgList->addObject(pCall);
    pthread_mutex_unlock(&mMutex);
}

void CallbackManager::tick(float delta)
{
    pthread_mutex_lock(&mMutex);
    CCArray *process = mpCurrMsgList;
    mpCurrMsgList = mpCurrMsgList == &mMsgList1 ? &mMsgList2 : &mMsgList1;
    pthread_mutex_unlock(&mMutex);
    
    CCObject *pObj = NULL;
    CCARRAY_FOREACH(process, pObj)
    {
        JSCallback *pCall = (JSCallback*)pObj;
        pCall->doCallback();
        //pCall->release();
    }
    process->removeAllObjects();
}