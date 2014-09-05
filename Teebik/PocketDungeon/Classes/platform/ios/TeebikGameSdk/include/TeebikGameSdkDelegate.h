//
//  TeebikGameSdkDelegate.h
//  TeebikGameSdk
//
//  Created by Ryan Fang on 14-2-12.
//  Copyright (c) 2014年 Teebik Ltd. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TBK_TransactionBean.h"

@class TeebikGameSdk;

@protocol TeebikGameSdkDelegate <NSObject>

/**
 * Sdk init success
 * descrip: Callback the protocol when SDK init success
 *
 * params:
 *
 *
 * return: None
 **/
- (void)teebikGameSdkWithInitSuccess;

/**
 * Sdk init failed
 * descrip: Callback the protocol when SDK init failed
 *
 * params:
 *       error: the error's information
 *
 * return: None
 **/
- (void)teebikGameSdkWithInitFailed:(NSString *)error;

/**
 * Response when register success
 * descrip: Callback the protocol when login
 *
 * params:
 *
 *
 * return: None
 **/
- (void)teebikGameSdkWithRegisterSuccess;

/**
 * Response when login success
 * descrip: Callback the protocol when login
 *
 * params: 
 *
 *
 * return: None
 **/
- (void)teebikGameSdkWithLoginSuccess;

/**
 * Response when logout success
 * descrip: Callback the protocol when logout
 *
 * params:
 *
 *
 * return: None
 **/
- (void)teebikGameSdkWithLogoutSuccess;

/**
 * Response when payment success
 * descrip: Callback this protocol when payment success
 *
 * params:
 *       transaction: the transaction for this payment
 *
 * return: None
 **/
- (void)teebikGameSdkWithPaymentSuccess:(TBK_TransactionBean *)transaction;

/**
 * Response when payment failed
 * descrip: Callback this protocol when payment failed
 *
 * params:
 *       error: the error's information
 *
 * return: None
 **/
- (void)teebikGameSdkWithPaymentFailed:(NSString *)error;

/**
 * Response when payment cancel
 * descrip: Callback this protocol when payment cancel
 *
 * params:
 *       productId: the product identifier for this payment
 *
 * return: None
 **/
- (void)teebikGameSdkWithPaymentCancel:(NSString *)productId;

/**
 * Response To exit app
 * descrip: Callback this protocol when exit account or want to exit app
 *
 * params:
 *
 *
 * return: None
 **/
- (void)teebikGameSdkWithExitApp;

/**
 * Response the webview had close
 * descrip: Callback this protocol when the webview close
 *
 * params:
 *
 *
 * return: None
 **/
- (void)teebikGameSdkWithClosedView;

/**
 * Response If the game's server do not exist
 * descrip: Callback this protocol when If the game's server do not exist
 *
 * params:
 *
 *
 * return: None
 **/
- (void)teebikGameSdkWithGameServerNotExist;

/**
 * Show the process dialog
 * descrip: Show the process dialog when waiting
 *
 * params:
 *       error: the error's content
 *
 * return: None
 **/
- (void)teebikGameSdkWithProcessDlgStart;

/**
 * Stop the process dialog
 * descrip: Stop the process dialog when waiting
 *
 * params:
 *       error: the error's content
 *
 * return: None
 **/
- (void)teebikGameSdkWithProcessDlgStop;

/**
 * Show the error infomations
 * descrip: Show the error infomations
 *
 * params:
 *       error: the error's content
 *
 * return: None
 **/
- (void)teebikGameSdkWithErrorInfo:(NSString *)error;

/**
 * Show the wraning infomations
 * descrip: Show the warning infomations
 *
 * params:
 *       error: the wraning's content
 *
 * return: None
 **/
- (void)teebikGameSdkWithWraningInfo:(NSString *)wraning;

/**
 * Show the finish infomations
 * descrip: Show the finish infomations
 *
 * params:
 *       info: the information's content
 *
 * return: None
 **/
- (void)teebikGameSdkWithFinishInfo:(NSString *)info;


@end
