//
//  File.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-7.
//
//

#ifndef __DungeonJS__File__
#define __DungeonJS__File__

#include "cocos2d.h"
#include "cocos-ext.h"
#include "ScriptingCore.h"
#include "jsapi.h"
#include "jsfriendapi.h"

JSBool jsbFileRead(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileWrite(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileAppend(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileGetResourcePath(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileGetDocumentPath(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileExist(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileMkDir(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileRemove(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileRemoveDirectory(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileRename(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileUnzip(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileDownload(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileUpload(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileEncrypt(JSContext* cx, unsigned argc, JS::Value* vp);
JSBool jsbFileDecrypt(JSContext* cx, unsigned argc, JS::Value* vp);

void registerFile(JSContext* cx, JSObject* global);

#endif /* defined(__DungeonJS__File__) */
