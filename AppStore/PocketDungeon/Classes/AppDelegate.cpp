#include "AppDelegate.h"

#include "cocos2d.h"
#include "SimpleAudioEngine.h"
#include "ScriptingCore.h"
#include "jsb_cocos2dx_auto.hpp"
#include "jsb_cocos2dx_extension_auto.hpp"
#include "jsb_cocos2dx_extension_manual.h"
#include "cocos2d_specifics.hpp"
#include "js_bindings_chipmunk_registration.h"
#include "js_bindings_ccbreader.h"
#include "js_bindings_system_registration.h"
#include "jsb_opengl_registration.h"
#include "XMLHTTPRequest.h"

#include "ISystem.h"
#include "NativeAPI.h"
#include "CallbackManager.h"
#include "System.h"
#include "curl.h"
#include "PublishVersions.h"

USING_NS_CC;
using namespace CocosDenshion;

AppDelegate::AppDelegate()
{
    //init CURL
    curl_global_init(CURL_GLOBAL_DEFAULT);
}

AppDelegate::~AppDelegate()
{
    //finalize CURL
    curl_global_cleanup();
    //    SimpleAudioEngine::end();
}

bool AppDelegate::applicationDidFinishLaunching()
{
    preInitAPI();
    // initialize director
    CCDirector *pDirector = CCDirector::sharedDirector();
    pDirector->setOpenGLView(CCEGLView::sharedOpenGLView());
    
    // turn on display FPS
    //pDirector->setDisplayStats(true);
    
    // set FPS. the default value is 1.0/60 if you don't call this
    pDirector->setAnimationInterval(1.0 / 60);
    
    //check for first launch
    if( getSystem()->isFirstLaunch() ){
        //clear update folder
        CCLOG("-- FIRST LAUNCH --");
        string docpath;
        getSystem()->getDocumentPath(docpath);
        string udpath = docpath + "update/";
        getSystem()->removeDirectory(udpath);
        string dypath = docpath + "dynamic.json";
        getSystem()->removeDirectory(dypath);
    }
    
    CCDictionary *pSetup = CCDictionary::createWithContentsOfFile("Setup.plist");
    string display;
    {//set display
        CCSize winSize = pDirector->getWinSize();
        float aspectRatio = winSize.height/winSize.width;
        
        CCArray *pResolutions = (CCArray*)pSetup->objectForKey("Resolutions");
        if( pResolutions != NULL )
        {
            float fitScore = 10;
            float fitWidth = 0;
            float fitHeight = 0;
            
            CCObject *pObj = NULL;
            CCARRAY_FOREACH(pResolutions, pObj)
            {
                CCDictionary *pRes = (CCDictionary*)pObj;
                CCString *pPath = (CCString*)pRes->objectForKey("path");
                CCString *pWidth = (CCString*)pRes->objectForKey("width");
                CCString *pHeight = (CCString*)pRes->objectForKey("height");
                
                float width, height, score;
                sscanf(pWidth->getCString(), "%f", &width);
                sscanf(pHeight->getCString(), "%f", &height);
                
                if( winSize.width >= width && winSize.height >= height )
                {
                    score = 0;
                    float aspect = height/width;
                    float dist = fabsf(aspect - aspectRatio);
                    if( dist < fitScore )
                    {
                        fitScore = dist;
                        fitWidth = width;
                        fitHeight = height;
                        display = pPath->getCString();
                    }
                }
                else
                {
                    score = 8;
                }
            }
            
            //set best resolution
            pDirector->getOpenGLView()->setDesignResolutionSize(fitWidth, fitHeight, kResolutionShowAll);
            CCLog("Resolution Adapter: %dx%d (%s) = %f", (int)fitWidth, (int)fitHeight, display.c_str(), fitScore);
        }
    }
    //set search paths
    {
        CCArray *pSearchPaths = (CCArray*)pSetup->objectForKey("SearchPaths");
        CCString *pUpdatePath = (CCString*)pSetup->objectForKey("UpdatePath");
        
        vector<string> searchPaths;
        string res;
        string upd;
        getSystem()->getResourcePath(res);
        getSystem()->getDocumentPath(upd);
        
        if( pUpdatePath != NULL )
        {
            upd += pUpdatePath->getCString();
        }
        else
        {
            upd += "update/";
        }
        
        CCObject *pObj = NULL;
        CCARRAY_FOREACH(pSearchPaths, pObj)
        {
            CCString *pPath = (CCString*)pObj;
            string path = pPath->getCString();
            size_t pos = path.find("*");
            if( pos != string::npos )
            {
                path.replace(pos, 1, display);
            }
            searchPaths.push_back(upd+path);
            searchPaths.push_back(res+path);
            
            CCLog("Path: %s", path.c_str());
        }
        CCFileUtils::sharedFileUtils()->setSearchPaths(searchPaths);
    }
    
    //init js script core
    ScriptingCore* sc = ScriptingCore::getInstance();
    sc->addRegisterCallback(register_all_cocos2dx);
    sc->addRegisterCallback(register_all_cocos2dx_extension);
    sc->addRegisterCallback(register_cocos2dx_js_extensions);
    sc->addRegisterCallback(register_all_cocos2dx_extension_manual);
    sc->addRegisterCallback(register_CCBuilderReader);
    sc->addRegisterCallback(jsb_register_chipmunk);
    sc->addRegisterCallback(jsb_register_system);
    sc->addRegisterCallback(JSB_register_opengl);
    sc->addRegisterCallback(MinXmlHttpRequest::_js_register);

    //custom register callbacks
    sc->addRegisterCallback(registerNativeAPI);
    
    sc->start();
    
    postInitAPI();
    
    CCScriptEngineProtocol *pEngine = ScriptingCore::getInstance();
    CCScriptEngineManager::sharedManager()->setScriptEngine(pEngine);
    ScriptingCore::getInstance()->runScript("main.js");
    
    //start callback manager
    CallbackManager::getInstance()->start();
    
    return true;
}

void handle_signal(int signal) {
    static int internal_state = 0;
    ScriptingCore* sc = ScriptingCore::getInstance();
    // should start everything back
    CCDirector* director = CCDirector::sharedDirector();
    if (director->getRunningScene()) {
        director->popToRootScene();
    } else {
        CCPoolManager::sharedPoolManager()->finalize();
        if (internal_state == 0) {
            //sc->dumpRoot(NULL, 0, NULL);
            sc->start();
            internal_state = 1;
        } else {
            sc->runScript("main.js");
            internal_state = 0;
        }
    }
}

// This function will be called when the app is inactive. When comes a phone call,it's be invoked too
void AppDelegate::applicationDidEnterBackground()
{
    CCDirector::sharedDirector()->pause();

    // if you use SimpleAudioEngine, it must be pause
    // SimpleAudioEngine::sharedEngine()->pauseBackgroundMusic();
    triggerEnterBackground();
    onPauseApp();
}

// this function will be called when the app is active again
void AppDelegate::applicationWillEnterForeground()
{
    CCDirector::sharedDirector()->resume();
    
    triggerEnterForeground();
    onResumeApp();
}
