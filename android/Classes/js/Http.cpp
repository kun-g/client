//
//  Http.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-5.
//
//

#include "Http.h"
#include "HttpClient.h"
#include "ScriptingCore.h"
#include "utility/ISystem.h"

using namespace std;
using namespace cocos2d;
using namespace cocos2d::extension;

Http::Http(){}
Http::~Http(){}

Http* Http::getInstance()
{
    static Http net;
    return &net;
}

void Http::setURL(const char *url)
{
    mURL = url;
}

void Http::setCallback(JSFunction* callback, JSObject* object)
{
    mCallbackFunction = callback;
    mCallbackObject = object;
}

void Http::sendRequest(const char *data, unsigned length)
{
    CCHttpRequest *pRequest = new CCHttpRequest();
    pRequest->setUrl(mURL.c_str());
    pRequest->setRequestType(CCHttpRequest::kHttpPost);
    pRequest->setResponseCallback(this, httpresponse_selector(Http::recvResponse));
    pRequest->setRequestData(data, length);
    CCHttpClient::getInstance()->send(pRequest);
    pRequest->release();
}

void Http::recvResponse(CCHttpClient *client, CCHttpResponse *response)
{
    vector<char> *pBuffer = response->getResponseData();
    const char* pRaw = pBuffer->data();
    JSContext *cx = ScriptingCore::getInstance()->getGlobalContext();
    jsval ret;
    if( pBuffer->size() > 0 )
    {
        jsval args[1];
        args[0] = c_string_to_jsval(cx, pRaw, pBuffer->size());
        JS_CallFunction(cx, mCallbackObject, mCallbackFunction, 1, args, &ret);
    }
    else
    {
        const char* str = "connection timeout";
        jsval args[1];
        args[0] = c_string_to_jsval(cx, str);
        JS_CallFunction(cx, mCallbackObject, mCallbackFunction, 1, args, &ret);
    }
}

/*** JS Binding ***/

JSBool jsbSetURL(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc == 1 )
    {
        //read argument
        jsval* argv = JS_ARGV(cx, vp);
        JSString* str = JS_ValueToString(cx, argv[0]);
        JSStringWrapper url(str);
        string strURL = url;
        
        Http::getInstance()->setURL(strURL.c_str());
        
        return JS_TRUE;
    }
    else
    {
        CCLog("setURL: wrong argument.");
        return JS_FALSE;
    }
}

JSBool jsbSetCallback(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc > 0 )
    {
        //read argument
        jsval* argv = JS_ARGV(cx, vp);
        JSFunction* func = JS_ValueToFunction(cx, argv[0]);
        JSObject* obj = NULL;
        
        if( argc > 1 )
        {
            JS_ValueToObject(cx, argv[1], &obj);
        }
        
        Http::getInstance()->setCallback(func, obj);
        
        return JS_TRUE;
    }
    else
    {
        CCLog("setCallback(func, obj): wrong argument.");
        return JS_FALSE;
    }
}

JSBool jsbSendRequest(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc == 1 )
    {
        //read argument
        jsval* argv = JS_ARGV(cx, vp);
        JSString* str = JS_ValueToString(cx, argv[0]);
        JSStringWrapper data(str);
        string strData = data;
        
        Http::getInstance()->sendRequest(strData.c_str(), strData.length());
        
        return JS_TRUE;
    }
    else
    {
        CCLog("sendRequest: wrong argument.");
        return JS_FALSE;
    }
}

void registerHttp(JSContext* cx, JSObject* global)
{
    JSObject *network = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vNetwork = OBJECT_TO_JSVAL(network);
    JS_SetProperty(cx, global, "http", &vNetwork);
    
    JS_DefineFunction(cx, network, "setURL", jsbSetURL, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, network, "setCallback", jsbSetCallback, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, network, "sendRequest", jsbSendRequest, 1, JSPROP_READONLY | JSPROP_PERMANENT);
}