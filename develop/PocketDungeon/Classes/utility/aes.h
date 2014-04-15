//
//  aes.h
//  AESEncoder
//
//  Created by 马 颂文 on 13-8-12.
//  Copyright (c) 2013年 TrinGame. All rights reserved.
//

#ifndef AESEncoder_aes_h
#define AESEncoder_aes_h

unsigned int AESRESIZE(unsigned int s);

void DEFAULTKEY();

void AESKEY(const char* k);

void AESKEYDICT(int keys[], int sz);

void DEAES(unsigned char in[], unsigned char out[], unsigned int resized);

void ENAES(unsigned char in[], unsigned char out[], unsigned int resized);

#endif
