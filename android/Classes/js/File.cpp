//
//  File.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-7.
//
//

#include "File.h"
#include "tools.h"
#include "utility/ISystem.h"
#include "Download.h"
#include "utility/aes.h"

using namespace std;
using namespace cocos2d;

JSBool jsbFileRead(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc != 1 )
    {
        CCLog("file.read(path): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strPath(arg0);
    string path = strPath;
    string out;
    
    if( readStringFromFile(path.c_str(), out) )
    {
        jsval vret = c_string_to_jsval(cx, out.c_str());
        JS_SET_RVAL(cx, vp, vret);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_NULL);
    }
    return JS_TRUE;
}

JSBool jsbFileWrite(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc != 2 )
    {
        CCLog("file.write(path, content): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strPath(arg0);
    JSStringWrapper strContent(arg1);
    string path = strPath;
    string content = strContent;
    
    if( writeStringToFile(path.c_str(), content) )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    
    return JS_TRUE;
}

JSBool jsbFileAppend(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc != 2 )
    {
        CCLog("file.write(path, content): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strPath(arg0);
    JSStringWrapper strContent(arg1);
    string path = strPath;
    string content = strContent;
    
    if( appendStringToFile(path.c_str(), content) )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    
    return JS_TRUE;
}

JSBool jsbFileGetResourcePath(JSContext* cx, unsigned argc, JS::Value* vp)
{
    ISystem *pSys = getSystem();
    string out;
    pSys->getResourcePath(out);
    jsval vout = c_string_to_jsval(cx, out.c_str());
    JS_SET_RVAL(cx, vp, vout);
    return JS_TRUE;
}

JSBool jsbFileGetDocumentPath(JSContext* cx, unsigned argc, JS::Value* vp)
{
    ISystem *pSys = getSystem();
    string out;
    pSys->getDocumentPath(out);
    jsval vout = c_string_to_jsval(cx, out.c_str());
    JS_SET_RVAL(cx, vp, vout);
    return JS_TRUE;
}

JSBool jsbFileExist(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc != 1 )
    {
        CCLog("file.exist(path): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strPath(arg0);
    string path = strPath;
    string fullPath = CCFileUtils::sharedFileUtils()->fullPathForFilename(path.c_str());
    
    if( CCFileUtils::sharedFileUtils()->isFileExist(fullPath) )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    
    return JS_TRUE;
}

JSBool jsbFileMkDir(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc != 1 )
    {
        CCLog("file.mkdir(path): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strPath(arg0);
    string path = strPath;
    
    if( createDirectory(path.c_str()) )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    return JS_TRUE;
}

JSBool jsbFileRemove(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc != 1 )
    {
        CCLog("file.remove(file): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strPath(arg0);
    string path = strPath;
    
    if( removeFile(path.c_str()) )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    return JS_TRUE;
}

JSBool jsbFileRemoveDirectory(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc != 1 )
    {
        CCLog("file.removeDirectory(file): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strPath(arg0);
    string path = strPath;
    
    if( getSystem()->removeDirectory(path) )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    return JS_TRUE;
}

JSBool jsbFileRename(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("file.rename(src, dst): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strSrc(arg0);
    JSStringWrapper strDst(arg1);
    string src = strSrc;
    string dst = strDst;
    
    if( renameFile(src.c_str(), dst.c_str()) )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    return JS_TRUE;
}

JSBool jsbFileUnzip(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc != 2 )
    {
        CCLog("file.unzip(dest, pack): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strDest(arg0);
    JSStringWrapper strPack(arg1);
    string dest = strDest;
    string pack = strPack;
    
    if( unzip(dest.c_str(), pack.c_str()) )
    {
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
    }
    else
    {
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
    }
    return JS_TRUE;
}

JSBool jsbFileDownload(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("file.download(dst, url, callback(status, now, total)): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSFunction *arg2 = JS_ValueToFunction(cx, argv[2]);
    JSStringWrapper strDst(arg0);
    JSStringWrapper strUrl(arg1);
    string dst = strDst;
    string url = strUrl;
    
    download(dst.c_str(), url.c_str(), arg2);
    
    return JS_TRUE;
}

JSBool jsbFileUpload(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("file.upload(dst, url, callback(status, now, total)): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSFunction *arg2 = JS_ValueToFunction(cx, argv[2]);
    JSStringWrapper strDst(arg0);
    JSStringWrapper strUrl(arg1);
    string dst = strDst;
    string url = strUrl;
    
    upload(dst.c_str(), url.c_str(), arg2);
    
    return JS_TRUE;
}

JSBool jsbFileEncrypt(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 3 )
    {
        CCLog("file.encrypt(key, src, dst): wrong argument.");
        return JS_FALSE;
    }
    
    jsval * argv = JS_ARGV(cx, vp);
    JSString * arg0 = JS_ValueToString(cx, argv[0]);
    JSString * arg1 = JS_ValueToString(cx, argv[1]);
    JSString * arg2 = JS_ValueToString(cx, argv[2]);
    JSStringWrapper strKey(arg0);
    JSStringWrapper strSrc(arg1);
    JSStringWrapper strDst(arg2);
    string key = strKey;
    string src = strSrc;
    string dst = strDst;
    
    size_t size = src.length();
    size = AESRESIZE(size);
    unsigned char * input = (unsigned char *)malloc(size);
    memset(input, ' ', size);
    memcpy(input, src.c_str(), src.length());
    unsigned char * output = (unsigned char *)malloc(size);
    
    AESKEY(key.c_str());
    ENAES(input, output, size);
    
    if( writeDataToFile(dst.c_str(), output, size) )
    {
        free(input);
        free(output);
        
        JS_SET_RVAL(cx, vp, JSVAL_TRUE);
        return JS_TRUE;
    }
    else
    {
        free(input);
        free(output);
        
        JS_SET_RVAL(cx, vp, JSVAL_FALSE);
        return JS_FALSE;
    }
}

JSBool jsbFileDecrypt(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("file.decrypt(key, src): wrong argument.");
        return JS_FALSE;
    }
    
    jsval * argv = JS_ARGV(cx, vp);
    JSString * arg0 = JS_ValueToString(cx, argv[0]);
    JSString * arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strKey(arg0);
    JSStringWrapper strSource(arg1);
    string key = strKey;
    string src = strSource;
    
    size_t size;
    unsigned char * input = CCFileUtils::sharedFileUtils()->getFileData(src.c_str(), "r", (unsigned long*)&size);
    if( input != NULL )
    {
        unsigned char * output = (unsigned char *)malloc(size);
        
        AESKEY(key.c_str());
        DEAES(input, output, size);
        
        jsval ret = c_string_to_jsval(cx, (char*)output, size);
        JS_SET_RVAL(cx, vp, ret);
    
        delete input;
        free(output);
        
        return JS_TRUE;
    }
    else
    {//failed to read file
        return JS_FALSE;
    }
}

void registerFile(JSContext* cx, JSObject* global)
{
    JSObject *file = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vFile = OBJECT_TO_JSVAL(file);
    JS_SetProperty(cx, global, "file", &vFile);
    
    JS_DefineFunction(cx, file, "read", jsbFileRead, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "write", jsbFileWrite, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "getResourcePath", jsbFileGetResourcePath, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "getDocumentPath", jsbFileGetDocumentPath, 0, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "exist", jsbFileExist, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "mkdir", jsbFileMkDir, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "remove", jsbFileRemove, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "removeDirectory", jsbFileRemoveDirectory, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "rename", jsbFileRename, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "unzip", jsbFileUnzip, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "download", jsbFileDownload, 3, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "upload", jsbFileDownload, 3, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "encrypt", jsbFileEncrypt, 3, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, file, "decrypt", jsbFileDecrypt, 2, JSPROP_READONLY | JSPROP_PERMANENT);
}