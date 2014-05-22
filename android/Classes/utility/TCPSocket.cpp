//
//  TCPSocket.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-9-8.
//
//

#include "TCPSocket.h"

#include "cocos2d.h"
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <map>
#include <deque>
#include <errno.h>

using namespace std;
using namespace cocos2d;

#define RECONNECT_DELAY (5)

#pragma pack(1)
typedef struct
{
    uint8_t flags;
    uint16_t length;
}msg_head;
#pragma pack(0)

typedef struct
{
    string data;
    unsigned char flags;
}send_type;

typedef enum
{
    STATE_DISCONNECT = 0,
    STATE_CONNECTING,
    STATE_CONNECTED,
}TcpInnerState;

typedef struct
{
    int id;
    int sock;
    sockaddr_in address;
    TCPCallback callback;
    void* userdata;
    TcpInnerState state;
    pthread_t twriter;
    pthread_t treader;
    pthread_mutex_t sendlock;
    pthread_cond_t sendalert;
    pthread_mutex_t releaselock;
    deque<send_type> sendqueue;
    bool cleanFlag;
    int threadRef;
    unsigned char sendFlags;
}TcpSocket;

map<int, TcpSocket*> gTcpSocketList;
int gFdIndex = 0;

void dumpBinary(void* data, size_t size)
{
    uint8_t* p = (uint8_t*)data;
    printf("--------\n");
    for(size_t i = 0; i<size; ++i)
    {
        printf("%2x ", p[i]);
    }
    printf("\n---------\n");
}

void decodePackage(string &output, const msg_head &head, void* data, const size_t &size)
{
    //final: if no msgpack
    output = string((char*)data, size);
}

void encodePackage(void* &out, size_t &size, const uint8_t &flags, const string &input)
{
    msg_head head;
    head.flags = flags;
    head.length = 0;
    void* pBuffer = NULL;
    size_t bufferSize = 0;
    //raw data
    pBuffer = (void*)input.c_str();
    bufferSize = input.length();
    //final: without aes
    size = bufferSize + sizeof(msg_head);
    char* buff = (char*)malloc(size);
    head.length = htons(bufferSize);
    memcpy(buff, &head, sizeof(msg_head));
    memcpy(buff+sizeof(msg_head), pBuffer, bufferSize);
    out = buff;
}

void dumpTcpSocket(const TcpSocket &s)
{
    printf(" --- TCP SOCKET --- \n");
    printf(" ID = %d\n", s.id);
    printf(" SOCK = %d\n", s.sock);
    printf(" STATE = %d\n", s.state);
    printf(" ------------------ \n");
}

void invokeCallback(TcpSocket *s, string &data, TCPState state)
{
    //CCLog("*** {%d} INVOKE = %p", s->id, s);//debug
    if( s->callback != NULL )
    {
        s->callback(data, state, s->userdata);
    }
}

void retainSocket(TcpSocket *s)
{
    pthread_mutex_lock(&s->releaselock);
    s->threadRef++;
    pthread_mutex_unlock(&s->releaselock);
}

void releaseSocket(TcpSocket *s)
{
    pthread_mutex_lock(&s->releaselock);
    s->threadRef--;
    pthread_mutex_unlock(&s->releaselock);
    if( s->threadRef <= 0 )
    {
        //CCLog("***(%d) SOCKET DIES.", s->id);
        pthread_mutex_destroy(&s->releaselock);
        gTcpSocketList.erase(s->id);
        delete s;
    }
}

void rebuildSocket(TcpSocket* s)
{
    //CCLog("... rebuild socket ...");
    //CCLog("*** {%d} REBUILD = %p", s->id, s);//debug
    if( s->sock >= 0 )
    {
        close(s->sock);
        //CCLog("*** |%d|-> socket(%d) close", s->id, s->sock);//debug
    }
    s->sock = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP);
    //CCLog("*** |%d|-> claim socket(%d)", s->id, s->sock);//debug
    s->state = STATE_DISCONNECT;
    if( s->sock < 0 )
    {
        CCLog("[error] (%d)failed to rebuild socket:\n%s", s->id, strerror(errno));
    }
}

int sendMsg(int sockFd, const send_type &data)
{
    int ret = 0;
    size_t len;
    char* sendbuffer;
    
    encodePackage((void*&)sendbuffer, len, data.flags, data.data);
    
    int sent = 0;
    while( sent < len )
    {
        //CCLog("*** | socket(%d) send", sockFd);//debug
        int s = (int)send(sockFd, sendbuffer+sent, len-sent, 0);
        //CCLog("*** | send return(%d)", s);//debug
        if( s >= 0 )
        {
            sent += s;
        }
        else
        {
            ret = s;
            break;
        }
    }
    free(sendbuffer);
    CCLog("SEND(%d):\n%s\n", ret, data.data.c_str());
    return ret;
}

void* reader(void* handle)
{
    TcpSocket* s = (TcpSocket*)handle;
    retainSocket(s);
    
    //CCLog("*** {%d} READER = %p", s->id, s);//debug
    //dumpTcpSocket(*s);//debug
    
    void* recvBuffer = NULL;
    bool headed = false;
    msg_head msgHead;
    msgHead.flags = 0;
    msgHead.length = -1;
    int buffLen = sizeof(msgHead);
    int buffOff = 0;
    char* buffer = (char*)&msgHead;
    while( s->state == STATE_CONNECTED )
    {
        //CCLog("*** |%d|-> socket(%d) recv", s->id, s->sock);//debug
        int rc = (int)recv(s->sock, buffer, buffLen-buffOff, 0);
        //CCLog("*** | recv return (%d)", rc);//debug
        if( rc < 0 )
        {
            if( s->sock >= 0 ){
                pthread_mutex_lock(&s->releaselock);
                //CCLog("*** close socket(%d)", s->sock);//debug
                close(s->sock);
                s->sock = -1;
                s->state = STATE_DISCONNECT;
                pthread_mutex_unlock(&s->releaselock);
            }
            
            if( !s->cleanFlag ){
                string out = string(strerror(errno))+" : reader rc<0";
                invokeCallback(s, out, TCP_FAIL_RECV);
            }
            
            //CCLog("(%d)Recv failed: %s", s->id, out.c_str());//debug
        }
        else if( rc == 0 )
        {
            pthread_mutex_lock(&s->releaselock);
            //CCLog("*** close socket(%d)", s->sock);//debug
            close(s->sock);
            s->sock = -1;
            s->state = STATE_DISCONNECT;
            pthread_mutex_unlock(&s->releaselock);
            
            string out = string("remote server disconnected.");
            invokeCallback(s, out, TCP_DISCONNECTED);
            
            //CCLog("(%d)Remove Server Disconnected.", s->id);//debug
        }
        else
        {
            //debug section +++
//            printf("recv(%d) = \n", rc);
//            for(int i=0; i<rc; ++i)
//            {
//                char v = buffer[i];
//                int k = v;
//                printf("%x ", k);
//            }
//            printf("\n--------------\n");
            //debug section ---
            buffOff += rc;
            buffer += rc;
            
            if( buffOff > buffLen )
            {
                CCLog("!!!!!! buffOff > buffLen !!!!!!");
            }
            if( !headed )
            {//read header
                if( buffOff >= buffLen )
                {//header completed
                    msgHead.length = ntohs(msgHead.length);
                    if( msgHead.length < 0 )
                    {
                        CCLog("[error] (%d)reader: wrong msg header(%d).", s->id, msgHead.length);
                    }
                    buffLen = msgHead.length;
                    recvBuffer = malloc(buffLen);
                    buffOff = 0;
                    buffer = (char*)recvBuffer;
                    headed = true;
                }
            }
            else
            {//read content
                if( buffOff >= buffLen )
                {//content completed
                    string data;
                    decodePackage(data, msgHead, recvBuffer, buffLen);
                    free(recvBuffer);
                    recvBuffer = NULL;
                    msgHead.length = -1;
                    buffLen = sizeof(msgHead);
                    buffOff = 0;
                    buffer = (char*)&msgHead;
                    headed = false;
                    
                    CCLog("RECV:\n%s", data.c_str());
                    invokeCallback(s, data, TCP_OK);
                }
            }
        }
    }
    if( recvBuffer != NULL )
    {
        free(recvBuffer);
        recvBuffer = NULL;
    }
    //CCLog("(%d)READER ENDED", s->id);
    
    releaseSocket(s);
    s->treader = NULL;
    return NULL;
}

void* writer(void* handle)
{
    TcpSocket* s = (TcpSocket*)handle;
    retainSocket(s);
    
    //CCLog("*** {%d} WRITER = %p", s->id, s);//debug
    
    //dumpTcpSocket(*s);//debug
    pthread_mutex_init(&s->sendlock, NULL);
    pthread_cond_init(&s->sendalert, NULL);
    
    while( !s->cleanFlag )
    {
        switch (s->state) {
            case STATE_DISCONNECT:
            {//try to connect to server
                //CCLog("(%d)... connecting ...", s->id);
                
                pthread_mutex_lock(&s->releaselock);
                s->state = STATE_CONNECTING;
                pthread_mutex_unlock(&s->releaselock);
                
                if( connect(s->sock, (sockaddr*)&s->address, sizeof(s->address)) < 0 )
                {
                    //CCLog("*** connect fail");//debug
                    pthread_mutex_lock(&s->releaselock);
                    s->state = STATE_DISCONNECT;
                    pthread_mutex_unlock(&s->releaselock);
                    
                    string out = string(strerror(errno))+" : writer connect";
                    invokeCallback(s, out, TCP_FAIL_CONNECT);
                    
                    //CCLog("(%d)Connection failed: %s", s->id, out.c_str());//debug
                    rebuildSocket(s);
                    sleep(RECONNECT_DELAY);
                }
                else
                {
                    //CCLog("*** connect ok");//debug
                    pthread_mutex_lock(&s->releaselock);
                    s->state = STATE_CONNECTED;
                    pthread_mutex_unlock(&s->releaselock);
                    
                    //CCLog("--|%d| reader start", s->id);//debug
                    pthread_create(&s->treader, NULL, reader, handle);
                    
                    string out;
                    invokeCallback(s, out, TCP_OK);
                    
                    //CCLog("(%d)Connection sucess.", s->id);//debug
                }
            }
                break;
            case STATE_CONNECTED:
            {//try to send data
                send_type data;
                pthread_mutex_lock(&s->sendlock);
                if( s->sendqueue.empty() )
                {
                    pthread_cond_wait(&s->sendalert, &s->sendlock);
                }
                if( s->state == STATE_CONNECTED )
                {
                    data = s->sendqueue.front();
                    s->sendqueue.pop_front();
                    pthread_mutex_unlock(&s->sendlock);
                    
                    if( sendMsg(s->sock, data) != 0 )
                    {//failed
                        
                        pthread_mutex_lock(&s->sendlock);
                        s->sendqueue.push_front(data);
                        pthread_mutex_unlock(&s->sendlock);
                        
                        pthread_mutex_lock(&s->releaselock);
                        //CCLog("*** socket close (%d)", s->sock);//debug
                        close(s->sock);
                        s->sock = -1;
                        s->state = STATE_DISCONNECT;
                        pthread_mutex_unlock(&s->releaselock);
                        
                        string out = string(strerror(errno)) + " : writer send";
                        invokeCallback(s, out, TCP_FAIL_SEND);
                        
                        //CCLog("(%d)Send failed: %s", s->id, out.c_str());//debug
                    }
                }
                else
                {
                    pthread_mutex_unlock(&s->sendlock);
                    //CCLog("(%d)Send Disconnected.", s->id);//debug
                    pthread_mutex_lock(&s->releaselock);
                    s->state = STATE_DISCONNECT;
                    pthread_mutex_unlock(&s->releaselock);
                }
            }
                break;
            default:
                break;
        }
    }
    pthread_mutex_destroy(&s->sendlock);
    pthread_cond_destroy(&s->sendalert);
    //CCLog("(%d)WRITER RETURNED", s->id);//debug
    
    releaseSocket(s);
    s->twriter = NULL;
    return NULL;
}

int tcpCreate(const char* ip, int port)
{
    TcpSocket *s = new TcpSocket();
    s->id = gFdIndex;
    gFdIndex++;
    s->sock = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP);
    CCLog("*** |%d|-> claim socket(%d)", s->id, s->sock);//debug
    if( s->sock >= 0 )
    {
        memset(&s->address, 0, sizeof(s->address));
        s->address.sin_family = AF_INET;
        s->address.sin_addr.s_addr = inet_addr(ip);
        s->address.sin_port = htons(port);
        s->state = STATE_DISCONNECT;
        s->callback = NULL;
        s->treader = NULL;
        s->twriter = NULL;
        s->cleanFlag = false;
        s->threadRef = 0;
        pthread_mutex_init(&s->releaselock, NULL);
        gTcpSocketList.insert(make_pair(s->id, s));
        
        //dumpTcpSocket(*s);//debug
        CCLog("*** {%d} CREATE = %p", s->id, s);//debug
        
        return s->id;
    }
    else
    {
        return -1;
    }
}

void tcpSetCallback(int fd, TCPCallback callback, void* userData)
{
    map<int, TcpSocket*>::iterator iter = gTcpSocketList.find(fd);
    if( iter !=gTcpSocketList.end() )
    {
        TcpSocket* s = iter->second;
        //CCLog("*** {%d} CALL = %p", s->id, s);//debug
        
        s->callback = callback;
        s->userdata = userData;
    }
    else
    {
        CCLog("[error] (%d)SetCallback: No such socket fd.", fd);
    }
}

void tcpConnect(int fd)
{
    //CCLog("tcpConnect(%d)", fd);
    map<int, TcpSocket*>::iterator iter = gTcpSocketList.find(fd);
    if( iter !=gTcpSocketList.end() )
    {
        TcpSocket* s = iter->second;
        //CCLog("*** {%d} CONNECT = %p", s->id, s);//debug
        
        if( s->sock < 0 )
        {
            rebuildSocket(s);
        }
        if( s->twriter == NULL )
        {
            //dumpTcpSocket(*s);
            //CCLog("--|%d| writer start", s->id);//debug
            pthread_create(&s->twriter, NULL, writer, s);
        }
        else
        {
            CCLog("[warning] (%d)Connect: Socket is connecting.", fd);
        }
    }
    else
    {
        CCLog("[error] (%d)Connect: No such socket fd.", fd);
    }
}

void tcpSend(int fd, const std::string &data, const uint8_t &flags)
{
    //CCLog("tcpSend(%d)", fd);
    map<int, TcpSocket*>::iterator iter = gTcpSocketList.find(fd);
    if( iter !=gTcpSocketList.end() )
    {
        TcpSocket* s = iter->second;
        //CCLog("*** {%d} SEND = %p", s->id, s);//debug
        //CCLog("TRY SEND:\n%s", data.c_str());//debug
        if( s->state == STATE_CONNECTED )
        {
            pthread_mutex_lock(&s->sendlock);
            send_type sdata;
            sdata.flags = flags;
            sdata.data = data;
            s->sendqueue.push_back(sdata);
            pthread_mutex_unlock(&s->sendlock);
            pthread_cond_signal(&s->sendalert);
            
        }
        else
        {
            CCLog("[warning] (%d)Send: Socket not connected. Auto connecting.", fd);
            pthread_mutex_lock(&s->sendlock);
            send_type sdata;
            sdata.flags = flags;
            sdata.data = data;
            s->sendqueue.push_back(sdata);
            pthread_mutex_unlock(&s->sendlock);
            tcpConnect(fd);
            pthread_cond_signal(&s->sendalert);//let writer go
        }
    }
    else
    {
        CCLog("[error] (%d)Send: No such socket fd.", fd);
    }
}

void tcpClose(int fd)
{
    //CCLog("tcpClose(%d)", fd);//debug
    map<int, TcpSocket*>::iterator iter = gTcpSocketList.find(fd);
    if( iter !=gTcpSocketList.end() )
    {
        TcpSocket* s = iter->second;
        //CCLog("*** {%d} socket close = %p", s->id, s);//debug
        if( s->state == STATE_CONNECTED && s->sock >= 0 )
        {
            close(s->sock);
            s->sock = -1;
            s->state = STATE_DISCONNECT;
        }
    }
    else
    {
        CCLog("[error] (%d)Close: No such socket fd.", fd);
    }
}

void tcpCleanup(int fd)
{
    //CCLog("tcpCleanup(%d)", fd);//debug
    map<int, TcpSocket*>::iterator iter = gTcpSocketList.find(fd);
    if( iter !=gTcpSocketList.end() )
    {
        TcpSocket* s = iter->second;
        //CCLog("*** {%d} CLEAN = %p", s->id, s);//debug
        s->cleanFlag = true;
        //close first
        if( s->state == STATE_CONNECTED
           && s->sock >= 0 )
        {
            //CCLog("*** socket close (%d)", s->sock);//debug
            close(s->sock);
            s->sock = -1;
            s->state = STATE_DISCONNECT;
        }
        
        //cleanup everything
        pthread_cond_signal(&s->sendalert);
    }
    else
    {
        CCLog("[error] (%d)Cleanup: No such socket fd.", fd);
    }
}