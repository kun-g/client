//
//  Resource.h
//  GameBillingSDK
//
//  Created by 吴 晓明 on 13-6-6.
//  Copyright (c) 2013年 吴晓明. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#define SYNTHESIZE_SINGLETON_FOR_CLASS(classname) \
\
static classname *initialize##classname = nil; \
\
+ (classname *)initialize##classname \
{ \
@synchronized(self) \
{ \
if (initialize##classname == nil) \
{ \
initialize##classname = [[self alloc] init]; \
} \
} \
\
return initialize##classname; \
} \
\
+ (id)allocWithZone:(NSZone *)zone \
{ \
@synchronized(self) \
{ \
if (initialize##classname == nil) \
{ \
initialize##classname = [super allocWithZone:zone]; \
return initialize##classname; \
} \
} \
\
return nil; \
} \
\
- (id)copyWithZone:(NSZone *)zone \
{ \
return self; \
} \
\

typedef enum{
    BillingResultSucceed = 0x1000,
    BillingResultFailed,
    BillingResultCanceled
} BillingResultType;


@protocol GameBillingDelegate;

@interface GameBilling : NSObject
{}

@property (nonatomic,assign) id <GameBillingDelegate> delegate;


+ (GameBilling *)initializeGameBilling;
+ (GameBilling *)initializeGameBillingWithGameName:(NSString *)gameName provider:(NSString *)provider serviceTel:(NSString *)serviceTel;

/**
 *  购买结果本地保存功能及接口
 *  @param billingIndex 计费点Id
 *  @param state 已计费:YES,未计费:NO
 */
- (void)setPayState:(NSString *)billingIndex withState:(BOOL)state;

/**
 *  购买结果本地获取功能及接口
 *  @param billingIndex 计费点Id
 *  @returns 已计费:YES,未计费:NO
 */
- (BOOL)getPayState:(NSString *)billingIndex;

/**
 *  计费方法(无UI)
 *  @param billingIndex 三位计费点Id
 *  @param isRepeated 是否重复计费点
 *  @param phoneNum 联网付费手机号
 *  @param veriCode 联网付费手机短信验证码
 
 说明：
        1、手机号码和验证码都为空：直接发短信付费
        2、手机号码不为空，验证码为空：获取验证码
        3、手机号码和验证码都不为空：联网付费

 */
- (void)doBillingWithBillingIndex:(NSString *)billingIndex isRepeated:(BOOL)isRepeated phoneNum:(NSString *)phoneNum veriCode:(NSString *)veriCode;

/**
 *  计费方法(带UI)
 *  @param billingIndex 三位计费点Id
 *  @param isRepeated 是否重复计费点
 *  @param useSms 是否优先使用短信计费
 */
- (void)doBillingWithUIAndBillingIndex:(NSString *)billingIndex isRepeated:(BOOL)isRepeated useSms:(BOOL)useSms;

/**
 *  设置UI计费对话框支持的方向，默认UIInterfaceOrientationMaskAll。
    如果游戏只支持横屏或者只支持竖屏，请一定要设置相应的UI计费对话框的方向
 */
-(void)setDialogOrientationMask:(UIInterfaceOrientationMask)orientationMask;


@end


@protocol GameBillingDelegate<NSObject>
@required
- (void)onBillingResult:(BillingResultType)resultCode billingIndex:(NSString *)index message:(NSString *)message;
@end



/*
 日志上报
 */

typedef void(^GameBillingUploadLogCallBack)(BOOL success,NSDictionary* userInfo);

@interface CMGAMELogManager : NSObject

/**
 *  设置是否打印日志，用于开发调试场景
 *  @param isLogEnabled 是否打开控制台日志输出功能,默认NO
 */
+ (void) setIsLogEnabled:(BOOL)isLogEnabled;

/**
 
 *  触发某个事件
 
  *  @param eventId 
                    自定义监控事件
                    注：该值最大长度为10
 *  @param pageId
                    需要收集信息的某个页面标识
                    注：该值最大长度为10
 *  @param callBack
                     事件处理完毕后的回调，不需要回调可传nil
                     参数success，上传成功返回YES,上传失败返回NO
                     参数userInfo，sdk返回的其他信息，供扩展，暂时固定返回nil

 */

+ (void) onEvent:(NSString*)eventId pageId:(NSString*)pageId callBack:(GameBillingUploadLogCallBack)callBack;
/**
 *  启动游戏事件
 *  @param callBack
                     事件处理完毕后的回调，不需要回调可传nil
                     参数success，上传成功返回YES,上传失败返回NO
                     参数userInfo，sdk返回的其他信息，供扩展，暂时固定返回nil
 
 */
+ (void) onStartGame:(GameBillingUploadLogCallBack)callBack;
/**
 *  退出游戏事件
 *  @param callBack
                    事件处理完毕后的回调，不需要回调可传nil
                    参数success，上传成功返回YES,上传失败返回NO
                    参数userInfo，sdk返回的其他信息，供扩展，暂时固定返回nil
 
 */
+ (void) onExitGame:(GameBillingUploadLogCallBack)callBack;

/**
 *  进入某个页面
  *  @param pageId  页面标识id。
                    注：该值最大长度为10
 
 */
+ (void) enterinPage:(NSString*)pageId;

/**
 *  退出某个页面
 *  @param pageId   页面标识id。
                    注：该值最大长度为10
 */
+ (void) exitPage:(NSString*)pageId;
@end

