//
//  Http.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-5.
//
//

#ifndef __DungeonJS__Http__
#define __DungeonJS__Http__

#include "cocos2d.h"
#include "cocos-ext.h"
#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"

class Http:
public cocos2d::CCObject
{
public:
    static Http* getInstance();
    
    void setURL(const char* url);
    void setCallback(JSFunction* callback, JSObject* object);
    void sendRequest(const char* data, unsigned length);
    void recvResponse(cocos2d::extension::CCHttpClient *client, cocos2d::extension::CCHttpResponse *response);
    
private:
    Http();
    ~Http();
    
    std::string mURL;
    JSFunction* mCallbackFunction;
    JSObject* mCallbackObject;
};

/** JS Binding **/

JSBool jsbSetURL(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSetCallback(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbSendRequest(JSContext* cx, unsigned argc, JS::Value* vp);

void registerHttp(JSContext* cx, JSObject* global);

#endif /* defined(__DungeonJS__Http__) */
