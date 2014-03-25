//
//  PP25UAC.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#include "PP25UAC.h"
#import <PPAppPlatformKit/PPUIKit.h>
#include "PublishVersions.h"
#include "cocos2d.h"

#define PP25FILE ("PP25Pay.plist")

using namespace cocos2d;
using namespace std;

static bool gPP25Inited = false;
static NSMutableArray* gPurchaseList = nil;

void initPP25()
{
    //NSLog(@"init PP25");
    [[PPAppPlatformKit sharedInstance] setAppId:PP25_APPID AppKey:PP25_APPKEY];
    [[PPAppPlatformKit sharedInstance] setIsLogOutPushLoginView:NO];
    [[PPAppPlatformKit sharedInstance] setIsLongComet:YES];
    [[PPAppPlatformKit sharedInstance] setIsOpenRecharge:YES];
    [[PPAppPlatformKit sharedInstance] setRechargeAmount:18];
    [[PPAppPlatformKit sharedInstance] setIsNSlogData:NO];//debug
    [[PPAppPlatformKit sharedInstance] setDelegate:[PPDelegate sharedInstance]];
}

void PP25UAC::initUAC()
{
    if( !gPP25Inited )
    {
        initPP25();
        gPP25Inited = true;
    }
    //so, setDelegate first and init later
    [[PPDelegate sharedInstance] setUACDelegate:this->getUACDelegate()];
    [PPUIKit sharedInstance];
}

void PP25UAC::presentLoginView()
{
    [[PPAppPlatformKit sharedInstance] showLogin];
}

void PP25UAC::presentManageView()
{
    [[PPAppPlatformKit sharedInstance] showCenter];
}

void PP25UAC::logout()
{
    [[PPAppPlatformKit sharedInstance] PPlogout];
}

void PP25UAC::getUserName(std::string &name)
{
    NSString* userName = [[PPAppPlatformKit sharedInstance] currentUserName];
    name = string([userName cStringUsingEncoding:NSUTF8StringEncoding]);
}

void PP25UAC::getUserId(std::string &token)
{
    uint64_t userId = [[PPAppPlatformKit sharedInstance] currentUserId];
    char strId[32];
    memset(strId, 0, sizeof(strId));
    sprintf(strId, "%llu", userId);
    token = string(strId);
}

void PP25UAC::initPayment()
{
    if( !gPP25Inited )
    {
        initPP25();
        gPP25Inited = true;
    }
    //load products
    @autoreleasepool {
        string fullpath = CCFileUtils::sharedFileUtils()->fullPathForFilename(PP25FILE);
        NSString* strPath = [NSString stringWithCString:fullpath.c_str() encoding:NSUTF8StringEncoding];
        mProducts = [NSArray arrayWithContentsOfFile:strPath];
        [mProducts retain];
        if( gPurchaseList != nil ){
            [gPurchaseList release];
        }
        gPurchaseList = [NSMutableArray array];
        [gPurchaseList retain];
    }
    //set delegate first, then init
    [[PPDelegate sharedInstance] setIAPDelegate:this->getIAPDelegate()];
}

bool PP25UAC::isPaymentEnabled()
{
    return true;
}

void PP25UAC::makePayment(string billno, int product, uint32_t quantity, string username, int zoneId)
{
    //find product
    @autoreleasepool {
        NSDictionary* detail = [mProducts objectAtIndex:product];
        if( detail != nil ){
            NSString* strBillNo = [NSString stringWithUTF8String:billno.c_str()];
            NSString* strUserName = [NSString stringWithUTF8String:username.c_str()];
            NSString* strTitle = [detail objectForKey:@"title"];
            NSNumber* numPrice = [detail objectForKey:@"price"];
            int cost = [numPrice intValue]*quantity;
            
            //record purchase
            NSMutableDictionary* payment = [NSMutableDictionary dictionary];
            [payment setObject:strBillNo forKey:@"BillNo"];
            [payment setObject:[NSNumber numberWithInt:product] forKey:@"Product"];
            [payment setObject:[NSNumber numberWithInt:quantity] forKey:@"Quantity"];
            [payment setObject:strUserName forKey:@"UserName"];
            [payment setObject:[NSNumber numberWithInt:zoneId] forKey:@"ZoneId"];
            [gPurchaseList addObject:payment];
            
            //NSLog(@"*** MAKEPAYMENT\nCOST=%d\nBILLNO=%@\nTITLE=%@\nROLE=%@\nZONE=%d\n\n",
            //      cost, strBillNo, strTitle, strUserName, zoneId);
            
            [[PPAppPlatformKit sharedInstance] exchangeGoods:cost BillNo:strBillNo BillTitle:strTitle RoleId:strUserName ZoneId:zoneId];
        }
        else{
            NSLog(@"PP25UAC.makePayment: product(%d) not found.", product);
        }
    }
}

void PP25UAC::getStoreName(std::string &name)
{
    name = "PP25";
}

static PPDelegate* gPPDelegate = nil;

@implementation PPDelegate

- (id)init{
    if( self = [super init] )
    {
        mpUACD = NULL;
        mpIAPD = NULL;
    }
    return self;
}

+ (PPDelegate*) sharedInstance{
    if( gPPDelegate == nil ){
        gPPDelegate = [[PPDelegate alloc] init];
    }
    return gPPDelegate;
}

- (void)setUACDelegate:(UACDelegate *)pInstance{
    //NSLog(@"setUACDelegate = %p", pInstance);
    mpUACD = pInstance;
}

- (void)setIAPDelegate:(IAPDelegate *)pInstance{
    mpIAPD = pInstance;
}

/**
 * @brief   余额大于所购买道具
 * @param   INPUT   paramPPPayResultCode       接口返回的结果编码
 * @return  无返回
 */
- (void)ppPayResultCallBack:(PPPayResultCode)paramPPPayResultCode {
    //NSLog(@"\n\n*** ppPayResultCallBack(%d)\n", paramPPPayResultCode);
    @autoreleasepool {
        NSDictionary* payment = [gPurchaseList lastObject];
        if( payment != nil ){
            PaymentResult pr;
            if( paramPPPayResultCode == PPPayResultCodeSucceed
               || paramPPPayResultCode == PPPayResultCodeUntreatedBillNo
               || paramPPPayResultCode == PPPayResultCodeCommunicationFail ){
                pr = Payment_Success;
            }
            else{
                pr = Payment_Failed;
            }
            NSNumber* numProduct = [payment objectForKey:@"Product"];
            NSString* strBillNo = [payment objectForKey:@"BillNo"];
            //NSLog(@"\n\n** RES=%d\n PRD=%@\n BILL=%@\n", pr, numProduct, strBillNo);
            mpIAPD->onPaymentResult(pr, [numProduct intValue], string([strBillNo cStringUsingEncoding:NSUTF8StringEncoding]));
            [gPurchaseList removeLastObject];
        }
        else{
            NSLog(@"*** payment not found");
        }
    }
}

/**
 * @brief   验证更新成功后
 * @noti    分别在非强制更新点击取消更新和暂无更新时触发回调用于通知弹出登录界面
 * @return  无返回
 */
- (void)ppVerifyingUpdatePassCallBack{
    NSLog(@"ppVerifyingUpdatePassCallBack");
    mpUACD->onUACReady();
}

/**
 * @brief   登录成功回调【任其一种验证即可】
 * @param   INPUT   paramStrToKenKey       字符串token
 * @return  无返回
 */
- (void)ppLoginStrCallBack:(NSString *)paramStrToKenKey{
    mpUACD->onLoggedIn(string([paramStrToKenKey cStringUsingEncoding:NSUTF8StringEncoding]));
}

/**
 * @brief   关闭Web页面后的回调
 * @param   INPUT   paramPPWebViewCode    接口返回的页面编码
 * @return  无返回
 */
- (void)ppCloseWebViewCallBack:(PPWebViewCode)paramPPWebViewCode{
    NSLog(@"*** onCloseWebViewCallBack(%d)", paramPPWebViewCode);
}

/**
 * @brief   关闭SDK客户端页面后的回调
 * @param   INPUT   paramPPPageCode       接口返回的页面编码
 * @return  无返回
 */
- (void)ppClosePageViewCallBack:(PPPageCode)paramPPPageCode{
    NSLog(@"*** onClosePageViewCallBack(%d)", paramPPPageCode);
    switch (paramPPPageCode) {
        case PPLoginViewPageCode:
        case PPRegisterViewPageCode:
            mpUACD->onLoginViewClosed();
            break;
        case PPCenterViewPageCode:
        case PPUpdatePwdViewPageCode:
        case PPAlertSecurityViewPageCode:
            mpUACD->onManageViewClosed();
            break;
    }
}

/**
 * @brief   注销后的回调
 * @return  无返回
 */
- (void)ppLogOffCallBack{
    mpUACD->onLoggedOut();
}

@end