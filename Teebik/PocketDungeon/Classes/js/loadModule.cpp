//
//  loadModule.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-3.
//
//

#include "loadModule.h"
#include "tools.h"

using namespace cocos2d;
using namespace std;

//static JSObject *sModules = NULL;

void registerLoadModule(JSContext* cx, JSObject* global)
{
    //create modules
    JSObject* Modules = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vModules = OBJECT_TO_JSVAL(Modules);
    JS_SetProperty(cx, global, "modules", &vModules);
    
    JS_DefineFunction(cx, global, "loadModule", loadModule, 1, JSPROP_READONLY | JSPROP_PERMANENT);
}

JSBool loadModule(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc == 1 )
    {
        //read argument
        jsval* argv = JS_ARGV(cx, vp);
        JSString* str = JS_ValueToString(cx, argv[0]);
        JSStringWrapper path(str);
        string moduleName = RemoveFileExt(path);
        
        JSObject* global = ScriptingCore::getInstance()->getGlobalObject();
        jsval GModules;
        JS_GetProperty(cx, global, "modules", &GModules);
        JSObject* modules = JSVAL_TO_OBJECT(GModules);
        //JSObject* modules = sModules;

        jsval vModule;
        JS_GetProperty(cx, modules, moduleName.c_str(), &vModule);
        
        if( !JSVAL_IS_PRIMITIVE(vModule) )
        {
            JSObject *module = JSVAL_TO_OBJECT(vModule);
            jsval vExports;
            JS_GetProperty(cx, module, "exports", &vExports);
            JS_SET_RVAL(cx, vp, vExports);
        }
        else
        {
            JSObject *module = JS_NewObject(cx, NULL, NULL, NULL);
            
            JSObject *exports = JS_NewObject(cx, NULL, NULL, NULL);
            jsval vExports = OBJECT_TO_JSVAL(exports);
            JS_SetProperty(cx, module, "exports", &vExports);
            
            ScriptingCore::getInstance()->runScript(path, module, cx);

            vModule = OBJECT_TO_JSVAL(module);
            JS_SetProperty(cx, modules, moduleName.c_str(), &vModule);
            
            JS_SET_RVAL(cx, vp, vExports);
        }
        
        return JS_TRUE;
    }
    else
    {
        CCLog("loadModule: wrong argument.");
        return JS_FALSE;
    }
}