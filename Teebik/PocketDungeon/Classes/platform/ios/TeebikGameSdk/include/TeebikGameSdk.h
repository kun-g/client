//
//  TeebikGameSdk.h
//  TeebikGameSdk
//
//  Created by Ryan Fang on 13-11-12.
//  Copyright (c) 2013年 Teebik Ltd. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "TeebikGameSdkDelegate.h"

@interface TeebikGameSdk : NSObject<TeebikGameSdkDelegate>

@property (nonatomic, retain) id delegate, loginDelegate, logoutDelegate, paymentDelegate, dialogDelegate;
@property (nonatomic, retain) NSString *urlForDebug;

/**
 * Get the instance
 * descrip: Get the instance of the sdk
 *
 * params:
 *
 * return: A instance of the teebik platform sdk
 **/
+ (TeebikGameSdk *)getInstance;

/**
 * Initialization SDK
 * descrip:
 *
 * params: 
 *        delegate: for the delegate class
 *        launchOptions: Get it from didFinishLaunchingWithOptions method
 *        customAlertView: YES is user your custom for the alert view; NO is user the default alert view of the sdk
 *        debugUrl: only for debug for the platform server
 *
 * return: A instance of the teebik platform sdk
 **/
- (id)init:(id)delegate launchOptions:(NSDictionary *)launchOptions customAlertView:(BOOL)customAlertView debugUrl:(NSString *)debugUrl;

/**
 * Initialization SDK
 * descrip:
 *
 * params:
 *        delegate: for the delegate class
 *        launchOptions: Get it from didFinishLaunchingWithOptions method
 *        customAlertView: YES is user your custom for the alert view; NO is user the default alert view of the sdk
 *
 * return: A instance of the teebik platform sdk
 **/
- (id)init:(id)delegate launchOptions:(NSDictionary *)launchOptions customAlertView:(BOOL)customAlertView;

/**
 * Set the game's current server for the payment check
 * descrip: Have to set this one before your pay
 *
 * params:
 *       url: For the game's server address , Example "http://......"
 *
 *
 * return: None
 **/
- (void)setGameServer:(NSString *)url;

/**
 * User login or register
 * descrip:
 *
 * params:
 *
 * return: None
 **/
- (void)login;

/**
 * User login by the guest
 * descrip:
 *
 * params:
 *
 * return: None
 **/
- (void)loginWithGuest;

/**
 * User logout
 * descrip: this interface is not logout by server, it is location logout only
 *
 * params:
 *
 * return: None
 **/
- (void)logout;

/**
 * Check that had login, YES for had login or NO for did not login naver
 * descrip:
 *
 * params:
 *
 * return: None
 **/
- (BOOL)canSilentLogin;

/**
 * Get user's informations
 * descrip:
 *
 * params: None
 *
 * return: NSMutableDictionary* {password, token, uid, username}
 **/
- (NSMutableDictionary *)getUserInfo;

/**
 * Enter the store view
 * descrip: Choose the products from App-Store and show the builling recode
 *
 * params:
 *
 * return: None
 **/
- (void)store;

/**
 * Direct buy this product
 * descrip: Don't enter the store and direct buy this product, and will return to your view after this transaction end
 *
 * params:
 *       product_id: id of the product you want to payment
 *
 * return: None
 **/
- (void)paymentWithProductId:(NSString *)productId ;

/**
 * Enter the liveChat view
 * descrip: You can send the questions to out customer service, than we will answer it
 *
 * params:
 *
 * return: None
 **/
- (void)liveChat;

/**
 * Enter the liveChat view
 * descrip: You can send the questions to out customer service, than we will answer it
 *
 * params:
 *
 * return: None
 **/
- (void)billing;

/**
 * Enter the liveChat view
 * descrip: You can send the questions to out customer service, than we will answer it
 *
 * params:
 *
 * return: None
 **/
- (void)userInfo;

/**
 * Commit the device token
 * descrip: Commit the device token from APNs, please add the method to your project's didRegisterForRemoteNotificationsWithDeviceToken
 *   You've implemented -[<UIApplicationDelegate> application:didReceiveRemoteNotification:fetchCompletionHandler:], but you still need to add "remote-notification" to the list of your supported UIBackgroundModes in your Info.plist.
 *
 * params:
 *         device_token: the device token from APNs when launch the app
 *
 * return: None
 *
 **/
- (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)device_token;

/**
 * Open the push notification
 * descrip: Open the push notification and show by your application, please add this method to your project's didReceiveRemoteNotification
 *
 * params:
 *         userInfo: push infomations
 *
 * return: None
 *
 **/
- (void)didReceiveRemoteNotification:(NSDictionary *)userInfo;

- (void)bringMenuAndButtonToFront;
- (void)menuShow;
- (void)menuHide;
- (void)buttonEnable;
- (void)buttonDisable;

/* Private method */
- (NSMutableArray *)getProducts;
- (NSString *)getLanguageString:(NSString *)string_id;
- (void)bantchProductsToDb:(NSMutableArray *)array;
- (BOOL)productsTableIsExist;
- (void)bantchLanguageToDb:(NSMutableArray *)array;
- (BOOL)languageTableIsExist;
- (NSMutableArray *)getlanguages;
- (void)bantchMenuItemsToDb:(NSMutableArray *)array;
- (BOOL)menuItemsTableIsExist;
- (NSMutableArray *)getMenuItems;
- (void)drawMenuIconButton;
- (BOOL)isCustomAlertView;

@end
