//
//  TDGA.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-26.
//
//

#include "TDGA.h"
#include "TalkingData.h"

using namespace std;

TDCCAccount* gTDGAAccount = NULL;

//account
JSBool jsbTDGASetAccountId(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.setAccountId(account): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strAccount(arg0);
    string account = strAccount;
    CCLOG("- TDGA setAccount(%s)", account.c_str());
    //gTDGAAccount = TDCCAccount::setAccount(account.c_str());
    return JS_TRUE;
}

JSBool jsbTDGASetAccountType(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.setAccountType(type): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    int type;
    JS_ValueToInt32(cx, argv[0], &type);
    CCLOG("- TDGA setAccountType(%d)", type);
    //gTDGAAccount->setAccountType((TDCCAccount::TDCCAccountType)type);
    return JS_TRUE;
}

JSBool jsbTDGASetAccountName(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.setAccountName(name): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strAccountName(arg0);
    string name = strAccountName;
    CCLOG("- TDGA setAccountName(%s)", name.c_str());
    //gTDGAAccount->setAccountName(name.c_str());
    return JS_TRUE;
}

JSBool jsbTDGASetLevel(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.setLevel(lvl): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    int level;
    JS_ValueToInt32(cx, argv[0], &level);
    CCLOG("- TDGA setLevel(%d)", level);
    //gTDGAAccount->setLevel(level);
    return JS_TRUE;
}

JSBool jsbTDGASetGender(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.setGender(gender): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    int gender;
    JS_ValueToInt32(cx, argv[0], &gender);
    CCLOG("- TDGA setGender(%d)", gender);
    //gTDGAAccount->setGender((TDCCAccount::TDCCGender)gender);
    return JS_TRUE;
}

JSBool jsbTDGASetAge(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.setAge(age): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    int age;
    JS_ValueToInt32(cx, argv[0], &age);
    CCLOG("- TDGA setAge(%d)", age);
    //gTDGAAccount->setAge(age);
    return JS_TRUE;
}

JSBool jsbTDGASetGameServer(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.setGameServer(server): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strServer(arg0);
    string server = strServer;
    CCLOG("- TDGA setServer(%s)", server.c_str());
    //gTDGAAccount->setGameServer(server.c_str());
    return JS_TRUE;
}

//payment & virtual currency
JSBool jsbTDGAPaymentRequest(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 6 )
    {
        CCLog("tdga.paymentRequest(order, item, payc, paytype, vcc, pchannel): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strOrder(arg0);
    string order = strOrder;
    
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strItem(arg1);
    string item = strItem;
    
    double paycount;
    JS_ValueToNumber(cx, argv[2], &paycount);
    
    JSString *arg3 = JS_ValueToString(cx, argv[3]);
    JSStringWrapper strPaytype(arg3);
    string paytype = strPaytype;
    
    double virtualcurrency;
    JS_ValueToNumber(cx, argv[4], &virtualcurrency);
    
    JSString *arg5 = JS_ValueToString(cx, argv[5]);
    JSStringWrapper strChannel(arg5);
    string channel = strChannel;
    
    CCLOG("- TDGA paymentRequest(%s)@%s", item.c_str(), order.c_str());
    //TDCCVirtualCurrency::onChargeRequest(order.c_str(), item.c_str(), paycount, paytype.c_str(), virtualcurrency, channel.c_str());
    
    return JS_TRUE;
}

JSBool jsbTDGAPaymentSuccess(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.paymentSuccess(order): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strOrder(arg0);
    string order = strOrder;
    CCLOG("- TDGA paymentSuccess @%s", order.c_str());
    //TDCCVirtualCurrency::onChargeSuccess(order.c_str());
    return JS_TRUE;
}

JSBool jsbTDGAReward(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("tdga.reward(ammount, reason): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    double ammount;
    JS_ValueToNumber(cx, argv[0], &ammount);
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strReason(arg1);
    string reason = strReason;
    CCLOG("- TDGA onReward(%s)x%f", reason.c_str(), ammount);
    //TDCCVirtualCurrency::onReward(ammount, reason.c_str());
    return JS_TRUE;
}

//item
JSBool jsbTDGAItemPurchase(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 3 )
    {
        CCLog("tdga.itemPurchase(item, count, price): wrong argument.");
        return JS_FALSE;
    }
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strItem(arg0);
    string item = strItem;
    
    int count;
    JS_ValueToInt32(cx, argv[1], &count);
    
    double price;
    JS_ValueToNumber(cx, argv[2], &price);
    
    CCLOG("- TDGA onPurchase(%s)x%d @%f", item.c_str(), count, price);
    //TDCCItem::onPurchase(item.c_str(), count, price);
    
    return JS_TRUE;
}

JSBool jsbTDGAItemUse(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 2 )
    {
        CCLog("tdga.itemUse(item, count): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strItem(arg0);
    string item = strItem;
    
    int count;
    JS_ValueToInt32(cx, argv[1], &count);
    
    CCLOG("- TDGA onUse(%s)x%d", item.c_str(), count);
    //TDCCItem::onUse(item.c_str(), count);
    
    return JS_TRUE;
}

//quest
JSBool jsbTDGAQuestBegin(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.questBegin(quest): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strQuest(arg0);
    string quest = strQuest;
    
    CCLOG("- TDGA questBegin(%s)", quest.c_str());
    //TDCCMission::onBegin(quest.c_str());
    
    return JS_TRUE;
}

JSBool jsbTDGAQuestComplete(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.questComplete(quest): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strQuest(arg0);
    string quest = strQuest;
    
    CCLOG("- TDGA questCompleted(%s)", quest.c_str());
    //TDCCMission::onCompleted(quest.c_str());
    
    return JS_TRUE;
}

JSBool jsbTDGAQuestFailed(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.questFailed(quest, reason): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strQuest(arg0);
    string quest = strQuest;
    
    JSString *arg1 = JS_ValueToString(cx, argv[1]);
    JSStringWrapper strReason(arg1);
    string reason = strReason;
    
    CCLOG("- TDGA questFailed(%s) @%s", quest.c_str(), reason.c_str());
    //TDCCMission::onFailed(quest.c_str(), reason.c_str());
    
    return JS_TRUE;
}

//event
JSBool jsbTDGAEvent(JSContext* cx, unsigned argc, JS::Value* vp)
{
    if( argc < 1 )
    {
        CCLog("tdga.event(event[, param]): wrong argument.");
        return JS_FALSE;
    }
    
    jsval* argv = JS_ARGV(cx, vp);
    
    JSString *arg0 = JS_ValueToString(cx, argv[0]);
    JSStringWrapper strEvent(arg0);
    string event = strEvent;
    
    if( argc > 1 )
    {
        EventParamMap map;
        JSObject* objParam = NULL;
        JS_ValueToObject(cx, argv[1], &objParam);
        JSIdArray* jia = JS_Enumerate(cx, objParam);
        if( jia != NULL )
        {
            int len = JS_IdArrayLength(cx, jia);
            for(int i=0; i<len; ++i)
            {
                jsid id = JS_IdArrayGet(cx, jia, i);
                jsval val;
                JS_IdToValue(cx, id, &val);
                JSString* jsk = JS_ValueToString(cx, val);
                JSStringWrapper strKey(jsk);
                string key = strKey;
                jsval value;
                JS_GetPropertyById(cx, objParam, id, &value);
                if( JSVAL_IS_STRING(value) == JS_TRUE )
                {
                    JSString* vstr = JS_ValueToString(cx, value);
                    JSStringWrapper strStr(vstr);
                    string str = strStr;
                    printf("TDGA::EVENT PARAM %s = %s", key.c_str(), str.c_str());//debug
                    map.insert(EventParamPair(key.c_str(), str.c_str()));
                }
            }
            JS_DestroyIdArray(cx, jia);
        }
        CCLOG("- TDGA onEvent(%s)", event.c_str());
        //TDCCTalkingDataGA::onEvent(event.c_str(), &map);
    }
    else
    {
        CCLOG("- TDGA onEvent(%s)", event.c_str());
        //TDCCTalkingDataGA::onEvent(event.c_str());
    }
    
    return JS_TRUE;
}

void registerTDGA(JSContext* cx, JSObject* global)
{
    JSObject *tdga = JS_NewObject(cx, NULL, NULL, NULL);
    jsval vTdga = OBJECT_TO_JSVAL(tdga);
    JS_SetProperty(cx, global, "tdga", &vTdga);
    
    JS_DefineFunction(cx, tdga, "setAccountId",jsbTDGASetAccountId, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "setAccountType",jsbTDGASetAccountType, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "setAccountName",jsbTDGASetAccountName, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "setLevel",jsbTDGASetLevel, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "setGender",jsbTDGASetGender, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "setAge",jsbTDGASetAge, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "setGameServer",jsbTDGASetGameServer, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    
    JS_DefineFunction(cx, tdga, "paymentRequest",jsbTDGAPaymentRequest, 6, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "paymentSuccess",jsbTDGAPaymentSuccess, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "reward",jsbTDGAReward, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    
    JS_DefineFunction(cx, tdga, "itemPurchase",jsbTDGAItemPurchase, 3, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "itemUse",jsbTDGAItemUse, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    
    JS_DefineFunction(cx, tdga, "questBegin",jsbTDGAQuestBegin, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "questComplete",jsbTDGAQuestComplete, 1, JSPROP_READONLY | JSPROP_PERMANENT);
    JS_DefineFunction(cx, tdga, "questFailed",jsbTDGAQuestFailed, 2, JSPROP_READONLY | JSPROP_PERMANENT);
    
    JS_DefineFunction(cx, tdga, "event",jsbTDGAEvent, 2, JSPROP_READONLY | JSPROP_PERMANENT);
}