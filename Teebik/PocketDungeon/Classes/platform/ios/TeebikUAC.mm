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

using namespace cocos2d;
using namespace std;

void TeebikUAC::initUAC(){
    
}

void TeebikUAC::presentLoginView(){
    [[TeebikGameSdk getInstance] login];
}

void TeebikUAC::presentManageView(){
    [[TeebikGameSdk getInstance] bringMenuAndButtonToFront];
    [[TeebikGameSdk getInstance] menuShow];
}

void TeebikUAC::logout(){
    [[TeebikGameSdk getInstance] logout];
}

void TeebikUAC::getUserName(std::string &name){
    
}

void TeebikUAC::getUserId(std::string &token){
    
}

void TeebikUAC::initPayment(){
    
}

bool TeebikUAC::isPaymentEnabled(){
    return YES;
}

void TeebikUAC::makePayment(std::string billno, int product, uint32_t quantity, std::string username, int zoneId){
    
}

void TeebikUAC::getStoreName(std::string &name){
    
}

static TeebikDelegate* gTeebikDelegate = nil;

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
    }
    return gTeebikDelegate;
}


- (void)setUACDelegate:(UACDelegate *)pInstance{
    mpUACD = pInstance;
}

- (void)setIAPDelegate:(IAPDelegate *)pInstance{
    mpIAPD = pInstance;
}

//----------------------------------------//
// 接口为初始化成功后回调
- (void)teebikGameSdkWithInitSuccess{
    //your code here
    
}

// 接口为初始化失败后回调
// 参数 error: 返回造成错误原因的文字信息
- (void)teebikGameSdkWithInitFailed:(NSString *)error{
    [[[UIAlertView alloc] initWithTitle:@"Error" message:error delegate:self cancelButtonTitle:@"Exit App" otherButtonTitles:nil, nil] show];
    
}

// 接口为将要退出APP时回调
- (void)teebikGameSdkWithExitApp {
    // Your code here
}

// 接口为SDK的WebView窗口退出时调用
- (void)teebikGameSdkWithClosedView{
    
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
    [[AppsFlyerTracker sharedTracker] trackEvent:@"registration" withValue:@""];
    
    // Google analytics
    id<GAITracker> tracker = [[GAI sharedInstance] defaultTracker];
    // Start a new session. The next hit from this tracker will be the first in
    // a new session.
    [tracker set:kGAISessionControl value:@"start"];
    
    NSMutableDictionary *userinfo = [[TeebikGameSdk getInstance] getUserInfo];
}

// 接口为登录成功后回调
- (void)teebikGameSdkWithLoginSuccess {
    // Your code here
    id<GAITracker> tracker = [[GAI sharedInstance] defaultTracker];
    // Start a new session. The next hit from this tracker will be the first in
    // a new session.
    [tracker set:kGAISessionControl value:@"start"];
    
    NSMutableDictionary *userinfo = [[TeebikGameSdk getInstance] getUserInfo];
}

// 接口为登出成功后回调
- (void)teebikGameSdkWithLogoutSuccess {
    // Your code here
}


/* 接口为支付成功后回调
 参数 product: 当前支付商品的信息，包含商品名称、价格、货币等；
 transaction: 返回支付交易信息，包括税率，ID等 */
- (void)teebikGameSdkWithPaymentSuccess:(TBK_TransactionBean *)transaction {
    // Your code here
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
    
    // AppsFlyer iOS Tracking SDK
    [[AppsFlyerTracker sharedTracker] trackEvent:@"purchase" withValue:[NSString stringWithFormat:@"%0.02f", [transaction getAmount]]];
}

// 接口为支付失败后回调
// 参数 error: 返回造成错误原因的文字信息
- (void)teebikGameSdkWithPaymentFailed:(NSString *)error {
    // Your code here
}

// 接口为支付取消后回调
// 参数 product: 当前支付商品的信息，包含商品名称、价格、货币等；
- (void)teebikGameSdkWithPaymentCancel:(NSString *)productId {
    // Your code here
}

// 接口为当发现尚未设置游戏支付服务器时回调
- (void)teebikGameSdkWithGameServerNotExist {
    
}

//----------------------------------------//


@end