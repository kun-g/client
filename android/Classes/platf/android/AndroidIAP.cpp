//
//  AndroidIAP.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-8-15.
//
//

#include "cocos2d.h"
#include "AndroidIAP.h"

using namespace cocos2d;
using namespace std;

void AndroidIAP::initPayment()
{
    // TODO
}

bool AndroidIAP::isPaymentEnabled()
{
    return false;
}

void AndroidIAP::makePayment(string billno, int product, uint32_t quantity, string username, int zoneId)
{
    // TODO
}

void AndroidIAP::getStoreName(string &name)
{
    name = "AndroidStore";
}