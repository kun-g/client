//
//  tools.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-7.
//
//

#ifndef __DungeonJS__tools__
#define __DungeonJS__tools__

#include "cocos2d.h"

std::string RemoveFileExt(const std::string& filePath);
bool writeStringToFile(const char* file, const std::string &str);
bool appendStringToFile(const char* file, const std::string &str);
bool readStringFromFile(const char* file, std::string &str);
bool writeDataToFile(const char* file, const unsigned char* data, size_t len);
bool createDirectory(const char* path);
bool removeFile(const char* file);
bool renameFile(const char* src, const char* dst);
bool unzip(const char* dest, const char* pack);
#endif /* defined(__DungeonJS__tools__) */
