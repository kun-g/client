//
//  MY_BaseListBean.h
//  Teebik
//
//  Created by Fang Ryan on 13-5-31.
//  Copyright (c) 2013年 Teebik. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface MY_BaseListBean : NSObject
{
    NSMutableDictionary *dic;
}

- (id)init;
- (id)init:(NSMutableDictionary *)dicIn;
- (NSMutableDictionary *)getDic;
- (BOOL)getMasked;
- (void)setMasked:(BOOL)masked;

@end
