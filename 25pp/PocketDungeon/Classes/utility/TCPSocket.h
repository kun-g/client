 //
//  TCPSocket.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-9-8.
//
//

#ifndef __DungeonJS__TCPSocket__
#define __DungeonJS__TCPSocket__

#include <string>

typedef enum
{
    TCP_OK = 0,
    TCP_DISCONNECTED,   //1
    TCP_TIMEOUT,        //2
    TCP_FAIL_INIT,      //3
    TCP_FAIL_CONNECT,   //4
    TCP_FAIL_SEND,      //5
    TCP_FAIL_RECV,      //6
}TCPState;

typedef enum
{
    SEND_FLAG_SIZE = 0,
    SEND_FLAG_MSGPK,
    SEND_FLAG_AES,
}TCPSendFlag;

#define TCPFM_SIZE (0x01)
#define TCPFM_MSGPK (0x02)
#define TCPFM_AES (0x04)
#define TCPFM_BSON (0x08)

typedef void (*TCPCallback)(std::string&, TCPState, void*);

//init tcp socket with server ip and port
int tcpCreate(const char* ip, int port);

//set tco callback
void tcpSetCallback(int fd, TCPCallback callback, void* userData = NULL);

//connect with server
void tcpConnect(int fd);

//send data to server
void tcpSend(int fd, const std::string &data, const uint8_t &flags = TCPFM_SIZE);

//close connection
void tcpClose(int fd);

//cleanup tcp socket
void tcpCleanup(int fd);

#endif /* defined(__DungeonJS__TCPSocket__) */
