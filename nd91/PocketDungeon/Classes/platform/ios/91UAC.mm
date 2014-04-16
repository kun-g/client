//
//  Nd91UAC.cpp
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#include "91UAC.h"
#include "PublishVersions.h"
#include "cocos2d.h"

#define PP25FILE ("PP25Pay.plist")

using namespace cocos2d;
using namespace std;

static bool gNd91Inited = false;
static int gNd91ViewOpened = 0;

void initNd91()
{
    NSLog(@"init Nd91");
    [[NSNotificationCenter defaultCenter] addObserver:[Nd91Delegate sharedInstance] selector:@selector(onNd91InitComplete:) name:(NSString*)kNdCPInitDidFinishNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:[Nd91Delegate sharedInstance] selector:@selector(onNd91LoginResult:) name:(NSString*)kNdCPLoginNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:[Nd91Delegate sharedInstance] selector:@selector(onNd91PaymentResult:) name:(NSString*)kNdCPBuyResultNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:[Nd91Delegate sharedInstance] selector:@selector(onNd91LeaveUI:) name:(NSString*)kNdCPLeavePlatformNotification object:nil];
    [[NdComPlatform defaultPlatform] NdSetScreenOrientation:UIDeviceOrientationPortrait];
    [[NdComPlatform defaultPlatform] NdSetAutoRotation:NO];
    [[NdComPlatform defaultPlatform] NdHideToolBar];
    
    //[[NdComPlatform defaultPlatform] NdSetDebugMode:0];//set for debug use
}

void Nd91UAC::initUAC()
{
    if( !gNd91Inited )
    {
        initNd91();
        gNd91Inited = true;
    }
    
    NdInitConfigure* config = [[[NdInitConfigure alloc] init] autorelease];
    config.appid = ND91_APPID;//APP ID
    config.appKey = ND91_APPKEY;
    config.versionCheckLevel = ND_VERSION_CHECK_LEVEL_STRICT;
    [[NdComPlatform defaultPlatform] NdInit:config];
    
    [[Nd91Delegate sharedInstance] setUACDelegate:this->getUACDelegate()];
}

void Nd91UAC::presentLoginView()
{
    [[NdComPlatform defaultPlatform] NdLogin:0];
    gNd91ViewOpened = 1;
}

void Nd91UAC::presentManageView()
{
    [[NdComPlatform defaultPlatform] NdEnterPlatform:0];
    gNd91ViewOpened = 2;
}

void Nd91UAC::onPause()
{
}

void Nd91UAC::onResume()
{
    [[NdComPlatform defaultPlatform] NdPause];
}

void Nd91UAC::logout()
{
    [[NdComPlatform defaultPlatform] NdLogout:1];
}

void Nd91UAC::getUserName(std::string &name)
{
    NSString* userName = [[NdComPlatform defaultPlatform] loginUin];
    name = string([userName cStringUsingEncoding:NSUTF8StringEncoding]);
}

void Nd91UAC::getUserId(std::string &token)
{
    NSString* userId = [[NdComPlatform defaultPlatform] loginUin];
    token = string([userId cStringUsingEncoding:NSUTF8StringEncoding]);
}

void Nd91UAC::initPayment()
{
    if( !gNd91Inited )
    {
        initNd91();
        gNd91Inited = true;
    }
    
    [[Nd91Delegate sharedInstance] setIAPDelegate:this->getIAPDelegate()];
    //load products
    @autoreleasepool {
        string fullpath = CCFileUtils::sharedFileUtils()->fullPathForFilename(PP25FILE);
        NSString* strPath = [NSString stringWithCString:fullpath.c_str() encoding:NSUTF8StringEncoding];
        mProducts = [NSArray arrayWithContentsOfFile:strPath];
        [mProducts retain];
    }
}

bool Nd91UAC::isPaymentEnabled()
{
    return true;
}

void Nd91UAC::makePayment(string billno, int product, uint32_t quantity, string username, int zoneId)
{
    //find product
    @autoreleasepool {
        NSDictionary* detail = [mProducts objectAtIndex:product];
        if( detail != nil ){
            //retrive basic info
            NSString* strTitle = [detail objectForKey:@"title"];
            NSNumber* numPrice = [detail objectForKey:@"price"];
            NSString* strBillNo = [NSString stringWithUTF8String:billno.c_str()];
            
            //make order
            NdBuyInfo *buyInfo = [[NdBuyInfo new] autorelease];
            buyInfo.cooOrderSerial = strBillNo;
            buyInfo.productId = [NSString stringWithFormat:@"%d", product];
            buyInfo.productName = strTitle;
            buyInfo.productPrice = numPrice.floatValue;
            buyInfo.productOrignalPrice = numPrice.floatValue;
            buyInfo.productCount = quantity;
            buyInfo.payDescription = [NSString stringWithFormat:@"%d", zoneId];
            
            NSLog(@"*** MAKEPAYMENT\nCOST=%f\nBILLNO=%@\nTITLE=%@\nCOUNT=%d\nZONE=%d\n\n",
                  numPrice.floatValue, strBillNo, strTitle, quantity, zoneId);
            
            if( [[NdComPlatform defaultPlatform] NdUniPayAsyn:buyInfo] < 0 ){
                NSLog(@"*** FAILED TO MAKE PAYMENT AT NdComPlatform");
            }
        }
        else{
            NSLog(@"Nd91UAC.makePayment: product(%d) not found.", product);
        }
    }
}

void Nd91UAC::getStoreName(std::string &name)
{
    name = "Nd91";
}

static Nd91Delegate* gNd91Delegate = nil;

@implementation Nd91Delegate

- (id)init{
    if( self = [super init] )
    {
        mpUACD = NULL;
        mpIAPD = NULL;
    }
    return self;
}

+ (Nd91Delegate*) sharedInstance{
    if( gNd91Delegate == nil ){
        gNd91Delegate = [[Nd91Delegate alloc] init];
    }
    return gNd91Delegate;
}

- (void)onNd91InitComplete:(NSNotification*)notify{
    NSLog(@"Nd91InitComplete");
    mpUACD->onUACReady();
}

- (void)onNd91LoginResult:(NSNotification *)notify{
    NSLog(@"Nd91LoginResult");
    @autoreleasepool {
        NSDictionary* dic = [notify userInfo];
        BOOL bSuccess = [[dic objectForKey:@"result"] boolValue];
        if( [[NdComPlatform defaultPlatform] isLogined] && bSuccess ){
            NSString* sessionId = [[NdComPlatform defaultPlatform] sessionId];
            string token = [sessionId cStringUsingEncoding:NSUTF8StringEncoding];
            mpUACD->onLoggedIn(token);
            [[NdComPlatform defaultPlatform] NdShowToolBar:NdToolBarAtBottomRight];
        }
        else{
            mpUACD->onLoggedOut();
            [[NdComPlatform defaultPlatform] NdHideToolBar];
        }
    }
}

- (void)onNd91PaymentResult:(NSNotification *)notify{
    NSLog(@"Nd91PaymentResult");
    @autoreleasepool {
        NSDictionary* dic = [notify userInfo];
        BOOL bSuccess = [[dic objectForKey:@"result"] boolValue];
        NdBuyInfo* buyInfo = (NdBuyInfo*)[dic objectForKey:@"buyInfo"];
        if( bSuccess ){
            mpIAPD->onPaymentResult(Payment_Success, [buyInfo.productId intValue], string([buyInfo.cooOrderSerial cStringUsingEncoding:NSUTF8StringEncoding]));
        }
        else{
            int nErrorCode = [[dic objectForKey:@"error"] intValue];
            switch (nErrorCode) {
                case ND_COM_PLATFORM_ERROR_USER_CANCEL:
                    mpIAPD->onPaymentResult(Payment_Canceled, [buyInfo.productId intValue], string([buyInfo.cooOrderSerial cStringUsingEncoding:NSUTF8StringEncoding]));
                    break;
                case ND_COM_PLATFORM_ERROR_ORDER_SERIAL_SUBMITTED:
                    mpIAPD->onPaymentResult(Payment_Processing, [buyInfo.productId intValue], string([buyInfo.cooOrderSerial cStringUsingEncoding:NSUTF8StringEncoding]));
                    break;
                default:
                    mpIAPD->onPaymentResult(Payment_Failed, [buyInfo.productId intValue], string([buyInfo.cooOrderSerial cStringUsingEncoding:NSUTF8StringEncoding]));
                    break;
            }
        }
    }
}

- (void) onNd91LeaveUI:(NSNotification *)notify{
    NSLog(@"Nd91LeaveUI");
    if( gNd91ViewOpened == 1 ){
        mpUACD->onLoginViewClosed();
    }
    else if( gNd91ViewOpened == 2 ){
        mpUACD->onManageViewClosed();
    }
}

- (void)setUACDelegate:(UACDelegate *)pInstance{
    mpUACD = pInstance;
}

- (void)setIAPDelegate:(IAPDelegate *)pInstance{
    mpIAPD = pInstance;
}

@end