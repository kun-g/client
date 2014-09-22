//
//  TeebikUAC.mm
//  PocketDungeon-Teebik
//
//  Created by Jovismac on 14-8-22.
//
//

#include "TeebikUAC.h"
#include "PublishVersions.h"
#include "cocos2d.h"
#import "AppsFlyerTracker.h"
#import "iEventTracker.h"
#import "AppController.h"

#define SHOPFILE ("AppStore.plist")

using namespace cocos2d;
using namespace std;

static bool gTeebikInited = false;
static bool gTeebikLogging = false;
static TeebikDelegate* gTeebikDelegate = nil;
static AlertViewController* gAlertDelegate = nil;
static int gTeebikViewOpened = 0;

void initTeebik(){
    NSLog(@"initTeebik");
    [[TeebikGameSdk getInstance] init:[TeebikDelegate sharedInstance] launchOptions:nil customAlertView:NO];
//    initTeebikSdk();
    [[TeebikGameSdk getInstance] setGameServer:@"http://122.226.199.14:6499/TBK"]; //61.174.8.29
}

//----------UAC-----------

void TeebikUAC::initUAC(){
    NSLog(@"initUAC");
    gTeebikLogging = false;
    [[TeebikDelegate sharedInstance] setUACDelegate:this->getUACDelegate()];
    if (!gTeebikInited) {
        initTeebik();
        gTeebikInited = true;
    }
    [[TeebikDelegate sharedInstance] initUacSuccess];
}

void TeebikUAC::presentLoginView(){
    NSLog(@"presentLoginView");
    gTeebikLogging = true;
    CCDirector::sharedDirector()->pause();
    [TeebikGameSdk getInstance].loginDelegate = [TeebikDelegate sharedInstance];
    BOOL willSilentLogin = YES; //[[TeebikGameSdk getInstance] canSilentLogin];
    if (willSilentLogin) {
        [[TeebikGameSdk getInstance] login];
    }else{
        UIAlertView* alert = [[UIAlertView alloc] initWithTitle:@"Login Option" message:@"You wanna login as..." delegate:[AlertViewController sharedInstance] cancelButtonTitle:@"Guest" otherButtonTitles:@"User", nil];
        [alert show];
    }
    gTeebikViewOpened = 1;
}

void TeebikUAC::presentManageView(){
    NSLog(@"presentManageView");
//    [[TeebikGameSdk getInstance] bringMenuAndButtonToFront];
    [[TeebikGameSdk getInstance] menuShow];
    gTeebikViewOpened = 2;
}

void TeebikUAC::logout(){
    NSLog(@"logout");
    [TeebikGameSdk getInstance].logoutDelegate = [TeebikDelegate sharedInstance];
    [[TeebikGameSdk getInstance] logout];
}

void TeebikUAC::getUserName(std::string &name){
    NSString *username = [[[TeebikGameSdk getInstance] getUserInfo] objectForKey:@"uid"]; // here we use uid inplace of username
    if (username != nil) {
        name = string([username cStringUsingEncoding:NSUTF8StringEncoding]);
    }else{
        NSLog(@"getUserName: username(uid) is nil");
    }
}

void TeebikUAC::getUserId(std::string &token){
    NSString *uid = [[[TeebikGameSdk getInstance] getUserInfo] objectForKey:@"uid"];
    if (uid != nil) {
        token = string([uid cStringUsingEncoding:NSUTF8StringEncoding]);
    }else{
        NSLog(@"getUserId: uid is nil");
    }
}

//----------IAP-----------

void TeebikUAC::initPayment(){
    NSLog(@"initPayment");
    if (!gTeebikInited) {
        initTeebik();
        gTeebikInited = true;
    }
    [TeebikGameSdk getInstance].paymentDelegate = [TeebikDelegate sharedInstance];
    [[TeebikDelegate sharedInstance] setIAPDelegate:this->getIAPDelegate()];
    [[TeebikDelegate sharedInstance] requestProductData];
}

bool TeebikUAC::isPaymentEnabled(){
    return true;
}

void TeebikUAC::makePayment(std::string billno, int product, uint32_t quantity, std::string username, int zoneId){
    [[TeebikGameSdk getInstance] setGameServer:@"http://122.226.199.14:6499/TBK"]; //61.174.8.29
    [[TeebikDelegate sharedInstance] makePurchase:product];
}

void TeebikUAC::getStoreName(std::string &name){
    name = "AppStore(tb)";
}

//----------------------------------------//
//----------------------------------------//

@implementation TeebikDelegate

- (id)init{
    if( self = [super init] ){
        mpUACD = NULL;
        mpIAPD = NULL;
    }
    return self;
}

+ (TeebikDelegate*) sharedInstance{
    if( gTeebikDelegate == nil ){
        gTeebikDelegate = [[TeebikDelegate alloc] init];
        NSLog(@"gTeebikDelegate init mpUACD = NULL");
    }
    return gTeebikDelegate;
}


- (void)setUACDelegate:(UACDelegate *)pInstance{
    mpUACD = pInstance;
    NSLog(@"setUACDelegate mpUACD = %p", mpUACD);
}

- (void)setIAPDelegate:(IAPDelegate *)pInstance{
    mpIAPD = pInstance;
    NSLog(@"setIAPDelegate mpIAPD = %p", mpIAPD);
}

- (BOOL) isIAPEnabled{
    return true;
}

- (BOOL) productRequested{
    if (mProducts != nil) {
        return YES;
    }else{
        return NO;
    }
}

- (void) requestProductData{
    @autoreleasepool {
        string fullPath = CCFileUtils::sharedFileUtils()->fullPathForFilename(SHOPFILE);
        NSString* strPath = [NSString stringWithCString:fullPath.c_str() encoding:NSUTF8StringEncoding];
        mProductsMeta = [NSArray arrayWithContentsOfFile:strPath];
        [mProductsMeta retain];
    }
}

- (void) makePurchase:(NSInteger)product{
    NSString *productId = [self queryProductByIndex:product];
    NSLog(@"makePurchase: %@", productId);
    [[TeebikGameSdk getInstance] paymentWithProductId:productId];
}

- (int) queryProductIndex:(NSString *)iapId
{
    int product = -1;
    for(int i=0; i<mProductsMeta.count; ++i)
    {
        NSString* pd = [mProductsMeta objectAtIndex:i];
        if( [pd compare:iapId] == NSOrderedSame )
        {
            product = i;
            break;
        }
    }
    return product;
}

- (NSString*) queryProductByIndex:(int)idx
{
    NSString* iapId = [mProductsMeta objectAtIndex:idx];
    return iapId;
}

//-------------- Call Back --------------//
- (void)initUacSuccess{
    if (mpUACD != nil) {
        mpUACD->onUACReady();
    }
}

// 接口为初始化成功后回调
- (void)teebikGameSdkWithInitSuccess{
    //your code here
    NSLog(@"sdk init success");
    gTeebikInited = true;
//    [[TeebikGameSdk getInstance] buttonEnable];
//    CCApplication::sharedApplication()->run();
    if (!gTeebikLogging && mpUACD != nil) {
        mpUACD->onUACReady();
    }
}

// 接口为初始化失败后回调
// 参数 error: 返回造成错误原因的文字信息
- (void)teebikGameSdkWithInitFailed:(NSString *)error{
    gTeebikInited = false;
    [[[UIAlertView alloc] initWithTitle:@"Error" message:error delegate:self cancelButtonTitle:@"Exit App" otherButtonTitles:nil, nil] show];
    
}

// 接口为将要退出APP时回调
- (void)teebikGameSdkWithExitApp {
    // Your code here
}

// 接口为SDK的WebView窗口退出时调用
- (void)teebikGameSdkWithClosedView{
    NSLog(@"teebikGameSdkWithClosedView");
    CCDirector::sharedDirector()->resume();
    switch (gTeebikViewOpened) {
        case 1:
            mpUACD->onLoginViewClosed();
            break;
        case 2:
            mpUACD->onManageViewClosed();
        default:
            break;
    }
}

// 开始显示等待窗
- (void)teebikGameSdkWithProcessDlgStart {
    // Your code here
}

// 停止显示等待窗
- (void)teebikGameSdkWithProcessDlgStop {
    // Your code here
}

// 显示错误提示窗
- (void)teebikGameSdkWithErrorInfo:(NSString *)error {
    // Your code here
}

// 显示警告提示窗
- (void)teebikGameSdkWithWraningInfo:(NSString *)wraning {
    // Your code here
}

// 显示完成或信息提示窗口
- (void)teebikGameSdkWithFinishInfo:(NSString *)info {
    // Your code here
}

//----------------------------------------//
// 接口为注册成功后回调
- (void)teebikGameSdkWithRegisterSuccess {
    // Your code here
    // AppsFlyer iOS Tracking SDK
    createAFEvent("Register", "");
    
    // Google analytics
    [[[GAI sharedInstance] defaultTracker] set:kGAISessionControl value:@"start"];
    createGAIEvent("UserEvent", "Register", "", 0);
    
    NSMutableDictionary *userinfo = [[TeebikGameSdk getInstance] getUserInfo];
    NSLog(@"RegisterInfo:\nuid:%@\nusername:%@\ntoken:%@\n",
          [userinfo objectForKey:@"uid"], [userinfo objectForKey:@"username"], [userinfo objectForKey:@"token"]);
}

// 接口为登录成功后回调
- (void)teebikGameSdkWithLoginSuccess {
    CCDirector::sharedDirector()->resume();
    id<GAITracker> tracker = [[GAI sharedInstance] defaultTracker];
    // Start a new session. The next hit from this tracker will be the first in
    // a new session.
    [tracker set:kGAISessionControl value:@"start"];
    [[TeebikGameSdk getInstance] buttonDisable];
    NSMutableDictionary *userinfo = [[TeebikGameSdk getInstance] getUserInfo];
    NSLog(@"LoginInfo:\nuid:%@\nusername:%@\ntoken:%@\n",
          [userinfo objectForKey:@"uid"], [userinfo objectForKey:@"username"], [userinfo objectForKey:@"token"]);
    mpUACD->onLoggedIn(string([[userinfo objectForKey:@"token"] cStringUsingEncoding:NSUTF8StringEncoding]));
}

// 接口为登出成功后回调
- (void)teebikGameSdkWithLogoutSuccess {
    CCDirector::sharedDirector()->resume();
    mpUACD->onLoggedOut();
}


/* 接口为支付成功后回调
 参数 product: 当前支付商品的信息，包含商品名称、价格、货币等；
 transaction: 返回支付交易信息，包括税率，ID等 */
- (void)teebikGameSdkWithPaymentSuccess:(TBK_TransactionBean *)transaction {
    // Your code here
    NSLog(@"teebikGameSdkWithPaymentSuccess");
    @autoreleasepool {
        if (transaction != nil) {
            mpIAPD->onPaymentResult(Payment_Success, [[transaction getProductId] intValue], string([[transaction getReceipt] cStringUsingEncoding:NSUTF8StringEncoding]));
        }
        else{
            NSLog(@"transaction is nil");
        }
    }
    // Assumes a tracker has already been initialized with a property ID, otherwise
    // this call returns null.
    id tracker = [[GAI sharedInstance] defaultTracker];
    
    GAIDictionaryBuilder *transBuilder = [GAIDictionaryBuilder createTransactionWithId:[transaction getProductId]
                                                                           affiliation:@"App Store"
                                                                               revenue:@([transaction getAmount] * [transaction getQuantity])
                                                                                   tax:0
                                                                              shipping:0
                                                                          currencyCode:[transaction getCurrency]];
    [tracker send:[transBuilder build]];
    
    GAIDictionaryBuilder *itemBuilder = [GAIDictionaryBuilder createItemWithTransactionId:[transaction getProductId]
                                                                                     name:[transaction getLocalizedTitle]
                                                                                      sku:[transaction getSKU]
                                                                                 category:@"In-App Purchase"
                                                                                    price:@([transaction getAmount])
                                                                                 quantity:@([transaction getQuantity])
                                                                             currencyCode:[transaction getCurrency]];
    [tracker send:[itemBuilder build]];
    createGAIEvent("UserEvent", "Purchase", string([[transaction getProductId] cStringUsingEncoding:NSUTF8StringEncoding]), [transaction getAmount]);
    
    NSString* amount = [NSString stringWithFormat:@"%0.02f", [transaction getAmount]];
    // AppsFlyer iOS Tracking SDK
    createAFEvent("Purchase", string([amount cStringUsingEncoding:NSUTF8StringEncoding]));
}

// 接口为支付失败后回调
// 参数 error: 返回造成错误原因的文字信息
- (void)teebikGameSdkWithPaymentFailed:(NSString *)error {
    // Your code here
    @autoreleasepool {
        mpIAPD->onPaymentResult(Payment_Failed, 0, string([error cStringUsingEncoding:NSUTF8StringEncoding]));
    }
}

// 接口为支付取消后回调
// 参数 product: 当前支付商品的信息，包含商品名称、价格、货币等；
- (void)teebikGameSdkWithPaymentCancel:(NSString *)productId {
    // Your code here
    @autoreleasepool {
        mpIAPD->onPaymentResult(Payment_Canceled, [productId intValue], "");
    }
}

// 接口为当发现尚未设置游戏支付服务器时回调
- (void)teebikGameSdkWithGameServerNotExist {
    NSLog(@"GameServer has not been set");
}


@end

#pragma marks -- UIAlertViewDelegate --

@implementation AlertViewController

+ (AlertViewController*) sharedInstance{
    if (gAlertDelegate == nil) {
        gAlertDelegate = [[AlertViewController alloc] init];
    }
    return gAlertDelegate;
}

- (void) alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex{
    switch (buttonIndex) {
        case 0:
            [[TeebikGameSdk getInstance] loginWithGuest];
            break;
        case 1:
            [[TeebikGameSdk getInstance] login];
            break;
        default:
            break;
    }
}

@end