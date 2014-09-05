//
//  TBK_TransactionBean.h
//  TeebikGameSdk
//
//  Created by Ryan Fang on 14-2-8.
//  Copyright (c) 2014年 Teebik Ltd. All rights reserved.
//

#import "MY_BaseListBean.h"

@interface TBK_TransactionBean : MY_BaseListBean

- (id)init;
- (void)setPayUid:(NSString *)value;
- (NSString *)getPayUid;
- (void)setReceipt:(NSString *)value;
- (NSString *)getReceipt;
- (void)setAmount:(float)value;
- (float)getAmount;
- (void)setCurrency:(NSString *)value;
- (NSString *)getCurrency;
- (void)setProductId:(NSString *)value;
- (NSString *)getProductId;
- (void)setQuantity:(NSInteger)value;
- (NSInteger)getQuantity;
- (void)setSKU:(NSString *)value;
- (NSString *)getSKU;
- (void)setLocalizedTitle:(NSString *)value;
- (NSString *)getLocalizedTitle;
- (void)setTransactionId:(NSString *)value;
- (NSString *)getTransactionId;
- (void)setNumber:(int)value;
- (int)getNumber;

@end
