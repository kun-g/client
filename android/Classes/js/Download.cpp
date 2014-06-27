//
//  Download.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-7-8.
//
//

#include "Download.h"
#include "curl/curl.h"
#include "CallbackManager.h"

using namespace cocos2d;
using namespace std;

class DownloadHandle:
public CCObject
{
public:
    int type;//0=download 1=upload
    size_t existlen;
    pthread_t thread;
    JSFunction* callback;
    string url;
    string dst;
};

int onProgress(void *clientp, double dltotal, double dlnow, double ultotal, double ulnow)
{
    DownloadHandle* hand = (DownloadHandle*)clientp;
    
    JSCallback *call = JSCallback::alloc(hand->callback, 3);
    call->setArgumentInt(0, 0);//0-working 1-success -1-broken
    
    if( hand->type == 0 )
    {
        call->setArgumentDouble(1, dlnow);
        call->setArgumentDouble(2, dltotal);
    }
    else
    {
        call->setArgumentDouble(1, ulnow);
        call->setArgumentDouble(2, ultotal);
    }
    CallbackManager::getInstance()->postCallback(call);
    call->release();
    
    return 0;
}

void* downloadWorker(void* h)
{
    DownloadHandle *hand = (DownloadHandle*)h;
    bool exist = false;
    size_t length = 0;
    {
        FILE * read = fopen(hand->dst.c_str(), "rb");
        if( read != NULL )
        {
            exist = true;
            fseek(read, 0, SEEK_END);
            length = ftell(read);
            hand->existlen = length;
            fclose(read);
        }
        else
        {
            exist = false;
        }
        read = NULL;
    }
    
    FILE* DownloadingFile = fopen(hand->dst.c_str(), "wb");
    
    CURLcode code = CURLE_OK;
    
    CURL *handle = curl_easy_init();
    if( handle == NULL )
    {
        CCLog("<error> failed to init easy handle.");
    }
    
    curl_easy_setopt(handle, CURLOPT_URL, hand->url.c_str());
    curl_easy_setopt(handle, CURLOPT_WRITEDATA, DownloadingFile);
    //curl_easy_setopt(handle, CURLOPT_VERBOSE, 1L);
    
    if( exist )
    {
        CCLog("<error> existing file, try resume from %d.", (int)hand->existlen);
        curl_easy_setopt(handle, CURLOPT_RESUME_FROM, length);
    }
    
    //progress
    curl_easy_setopt(handle, CURLOPT_PROGRESSDATA, hand);
    curl_easy_setopt(handle, CURLOPT_PROGRESSFUNCTION, onProgress);
    curl_easy_setopt(handle, CURLOPT_NOPROGRESS, 0);
    
    code = curl_easy_perform(handle);
    
    if( code == CURLE_RANGE_ERROR )
    {
        CCLog("<error> server do not support resume, redownload.");
        curl_easy_setopt(handle, CURLOPT_RESUME_FROM, 0);
        hand->existlen = 0;
        code = curl_easy_perform(handle);
    }
    
    curl_easy_cleanup(handle);
    
    if( DownloadingFile != NULL )
    {
        fclose(DownloadingFile);
        DownloadingFile = NULL;
    }
    
    if( code != CURLE_OK )
    {
        CCLog("<error> failed to download file(%d).", code);
        
        JSCallback *call = JSCallback::alloc(hand->callback, 3);
        call->setArgumentInt(0, -1);//0-working 1-success -1-broken
        call->setArgumentDouble(1, 0);
        call->setArgumentDouble(2, 0);
        CallbackManager::getInstance()->postCallback(call);
    }
    else
    {
        CCLog("<info> download successfully.");
        
        JSCallback *call = JSCallback::alloc(hand->callback, 3);
        call->setArgumentInt(0, 1);//0-working 1-success -1-broken
        call->setArgumentDouble(1, 0);
        call->setArgumentDouble(2, 0);
        CallbackManager::getInstance()->postCallback(call);
    }
    
    //release the handle
    hand->release();
    
    return NULL;
}

void* uploadWorker(void* h)
{
    DownloadHandle *hand = (DownloadHandle*)h;
        
    FILE *fupload = fopen(hand->dst.c_str(), "r");
    if( !fupload )
    {
        CCLog("<error> No such file(%s) to upload.", hand->dst.c_str());
        return NULL;
    }
    
    fseek(fupload, 0, SEEK_END);
    size_t length = ftell(fupload);
    fseek(fupload, 0, SEEK_SET);
    
    CURLcode code = CURLE_OK;
    
    CURL *handle = curl_easy_init();
    if( handle == NULL )
    {
        CCLog("<error> failed to init easy handle.");
    }
    
    curl_easy_setopt(handle, CURLOPT_URL, hand->url.c_str());
    curl_easy_setopt(handle, CURLOPT_READDATA, fupload);
    curl_easy_setopt(handle, CURLOPT_INFILESIZE_LARGE, (curl_off_t)length);
    //curl_easy_setopt(handle, CURLOPT_VERBOSE, 1L);
    
    //progress
    curl_easy_setopt(handle, CURLOPT_PROGRESSDATA, hand);
    curl_easy_setopt(handle, CURLOPT_PROGRESSFUNCTION, onProgress);
    curl_easy_setopt(handle, CURLOPT_NOPROGRESS, 0);
    
    code = curl_easy_perform(handle);
    
    curl_easy_cleanup(handle);
    
    fclose(fupload);
    
    if( code != CURLE_OK )
    {
        CCLog("<error> failed to upload file(%d).", code);
        
        JSCallback *call = JSCallback::alloc(hand->callback, 3);
        call->setArgumentInt(0, -1);//0-working 1-success -1-broken
        call->setArgumentDouble(1, 0);
        call->setArgumentDouble(2, 0);
        CallbackManager::getInstance()->postCallback(call);
    }
    else
    {
        CCLog("<info> upload successfully.");
        
        JSCallback *call = JSCallback::alloc(hand->callback, 3);
        call->setArgumentInt(0, 1);//0-working 1-success -1-broken
        call->setArgumentDouble(1, 0);
        call->setArgumentDouble(2, 0);
        CallbackManager::getInstance()->postCallback(call);
    }
    
    //release the handle
    hand->release();
    
    return NULL;
}

void download(const char* dst, const char* url, JSFunction* callback)
{
    DownloadHandle *pHandle = new DownloadHandle();
    pHandle->type = 0;
    pHandle->existlen = 0;
    pHandle->callback = callback;
    pHandle->url = string(url);
    pHandle->dst = string(dst);
    
    pthread_create(&pHandle->thread, NULL, downloadWorker, pHandle);
}

void upload(const char* dst, const char* url, JSFunction* callback)
{
    DownloadHandle *pHandle = new DownloadHandle();
    pHandle->type = 1;
    pHandle->existlen = 0;
    pHandle->callback = callback;
    pHandle->url = string(url);
    pHandle->dst = string(dst);
    
    pthread_create(&pHandle->thread, NULL, uploadWorker, pHandle);
}