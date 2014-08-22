//
//  AvazuTracking.h
//  AvazuTrackingSdk
//
//  Created by Ryan Fang on 13-10-14.
//  Copyright (c) 2013年 Avazu Ltd. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface AvazuTracking : NSObject

@property (nonatomic, retain) NSURLConnection *connection;

+ (void)reportAppDownloadGoalWithSales:(NSString *)sales;
+ (void)reportAppDownloadGoal:(NSString *)uniqidIn sales:(NSString *)sales;
+ (void)reportAppDownloadGoal:(NSString *)uniqidIn;

@end
