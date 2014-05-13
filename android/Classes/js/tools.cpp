//
//  tools.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-7.
//
//

#include "tools.h"
#include "ISystem.h"
#include "unzip.h"
#include <iconv.h>
#include <dirent.h>

#if (CC_TARGET_PLATFORM != CC_PLATFORM_WIN32)
#include <sys/types.h>
#include <sys/stat.h>
#include <errno.h>
#endif

using namespace cocos2d;
using namespace std;

#define BUFFER_SIZE    8192
#define MAX_FILENAME   512

string RemoveFileExt(const string& filePath) {
    size_t pos = filePath.rfind('.');
    if (0 < pos) {
        return filePath.substr(0, pos);
    }
    else {
        return filePath;
    }
}

bool writeStringToFile(const char* file, const string &str)
{
    FILE *f = fopen(file, "w");
    if( f != NULL )
    {
        fwrite(str.c_str(), str.length(), 1, f);
        fclose(f);
        f = NULL;
        return true;
    }
    else
    {
        CCLog("<error> can not write file(%s)", file);
        return false;
    }
}

bool appendStringToFile(const char* file, const string &str)
{
    FILE *f = fopen(file, "a");
    if( f != NULL )
    {
        fwrite(str.c_str(), str.length(), 1, f);
        fclose(f);
        f = NULL;
        return true;
    }
    else
    {
        CCLog("<error> can not append file(%s)", file);
        return false;
    }
}

bool writeDataToFile(const char* file, const unsigned char* data, size_t len)
{
    FILE *f = fopen(file, "w");
    if( f != NULL )
    {
        fwrite(data, sizeof(unsigned char), len, f);
        fclose(f);
        f = NULL;
        return true;
    }
    else
    {
        CCLog("<error> can not write binary file(%s)", file);
        return false;
    }
}

bool readStringFromFile(const char* file, string &str)
{
    bool ret = true;
    unsigned long size = 0;
    unsigned char* pData = 0;
    pData = CCFileUtils::sharedFileUtils()->getFileData(file, "rb", &size);
    if( pData != NULL )
    {
        char* pStr = (char*)malloc(size+1);
        if (pStr != NULL)
        {
            pStr[size] = '\0';
            if (size > 0)
            {
                memcpy(pStr, pData, size);
            }
            
            str = string(pStr);
            
            free(pStr);
        }
    }
    else
    {
        ret = false;
    }
    CC_SAFE_DELETE_ARRAY(pData);
    
    return ret;
}

bool createDirectory(const char* path)
{
#if (CC_TARGET_PLATFORM != CC_PLATFORM_WIN32)
    mode_t processMask = umask(0);
    int ret = mkdir(path, S_IRWXU | S_IRWXG | S_IRWXO);
    umask(processMask);
    if (ret != 0 && (errno != EEXIST))
    {
        return false;
    }
    
    return true;
#else
    BOOL ret = CreateDirectoryA(path, NULL);
	if (!ret && ERROR_ALREADY_EXISTS != GetLastError())
	{
		return false;
	}
    return true;
#endif
}

bool removeFile(const char* file)
{
    int ret = remove(file);
    CCLOG("removeFile(%s): failed: %s", file, strerror(errno));
    return ret==0;
}

bool renameFile(const char* src, const char* dst)
{
    return rename(src, dst)==0;
}

bool unzip(const char *dest, const char *pack)
{
    // Open the zip file
    unzFile zipfile = unzOpen(pack);
    if (! zipfile)
    {
        CCLOG("unzip: can not open downloaded zip file %s", pack);
        return false;
    }
    
    // Get info about the zip file
    unz_global_info global_info;
    if (unzGetGlobalInfo(zipfile, &global_info) != UNZ_OK)
    {
        CCLOG("unzip: can not read file global info of %s", pack);
        unzClose(zipfile);
    }
    
    // Buffer to hold data read from the zip file
    char readBuffer[BUFFER_SIZE];
    
    CCLOG("unzip: start uncompressing");
    
    // Loop to extract all files.
    string destpath = string(dest);
    uLong i;
    for (i = 0; i < global_info.number_entry; ++i)
    {
        // Get info about current file.
        unz_file_info fileInfo;
        char fileName[MAX_FILENAME];
        if (unzGetCurrentFileInfo(zipfile,
                                  &fileInfo,
                                  fileName,
                                  MAX_FILENAME,
                                  NULL,
                                  0,
                                  NULL,
                                  0) != UNZ_OK)
        {
            CCLOG("unzip: can not read file info");
            unzClose(zipfile);
            return false;
        }
        
        string fullPath = destpath + fileName;
        
        // Check if this entry is a directory or a file.
        const size_t filenameLength = strlen(fileName);
        if (fileName[filenameLength-1] == '/')
        {
            // Entry is a direcotry, so create it.
            // If the directory exists, it will failed scilently.
            if (!createDirectory(fullPath.c_str()))
            {
                CCLOG("unzip: can not create directory %s", fullPath.c_str());
                unzClose(zipfile);
                return false;
            }
        }
        else
        {
            // Entry is a file, so extract it.
            
            // Open current file.
            if (unzOpenCurrentFile(zipfile) != UNZ_OK)
            {
                CCLOG("unzip: can not open file %s", fileName);
                unzClose(zipfile);
                return false;
            }
            
            // Create a file to store current file.
            FILE *out = fopen(fullPath.c_str(), "wb");
            if (! out)
            {
                CCLOG("unzip: can not open destination file %s", fullPath.c_str());
                unzCloseCurrentFile(zipfile);
                unzClose(zipfile);
                return false;
            }
            
            // Write current file content to destinate file.
            int error = UNZ_OK;
            do
            {
                error = unzReadCurrentFile(zipfile, readBuffer, BUFFER_SIZE);
                if (error < 0)
                {
                    CCLOG("unzip: can not read zip file %s, error code is %d", fileName, error);
                    unzCloseCurrentFile(zipfile);
                    unzClose(zipfile);
                    return false;
                }
                
                if (error > 0)
                {
                    fwrite(readBuffer, error, 1, out);
                }
            } while(error > 0);
            
            fclose(out);
        }
        
        unzCloseCurrentFile(zipfile);
        
        // Goto next entry listed in the zip file.
        if ((i+1) < global_info.number_entry)
        {
            if (unzGoToNextFile(zipfile) != UNZ_OK)
            {
                CCLOG("unzip: can not read next file");
                unzClose(zipfile);
                return false;
            }
        }
    }
    
    CCLOG("unzip: end uncompressing");
    
    return true;
}

void utf8ToUnicode(const std::string& src, std::wstring& dst)
{
    iconv_t cd = iconv_open("UTF-16LE", "UTF-8");
    if( cd == (iconv_t)-1 )
    {
        CCLOG("converion: not available");
    }
    
    char* input = NULL;
    char* output = NULL;
    size_t inleft = 0;
    size_t outleft = 0;
    
    //prepare input
    inleft = src.length();
    size_t insize = inleft+1;
    input = (char*)malloc(sizeof(char)*insize);
    memcpy(input, src.c_str(), insize-1);
    input[insize-1] = '\0';
    char* fin = input;
    
    //prepare output
    size_t outsize = insize;
    outleft = (inleft+1)*4;
    output = (char*)malloc(sizeof(wchar_t)*outsize);
    wchar_t* fout = (wchar_t*)output;
    size_t orgin = outleft;
    
    size_t rc = iconv(cd, &input, &inleft, &output, &outleft);
    size_t lenByte = orgin - outleft;
    //append a terminal character
    wchar_t end = L'\0';
    output = (char*)fout;
    memcpy(output+lenByte, &end, sizeof(wchar_t));
    
    if( rc == -1 )
    {
        CCLOG("conversion: error");
        switch (errno) {
                /* See "man 3 iconv" for an explanation. */
            case EILSEQ:
                CCLOG("Invalid multibyte sequence.\n");
                break;
            case EINVAL:
                CCLOG("Incomplete multibyte sequence.\n");
                break;
            case E2BIG:
                CCLOG("No more room.\n");
                break;
            default:
                CCLOG("Error: %s.\n", strerror (errno));
        }
    }
    
    dst = wstring(fout);
    //clean up
    free(fin);
    free(fout);
    iconv_close(cd);
}

