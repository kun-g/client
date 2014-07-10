//
//  AppStoreIAP.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-8-15.
//
//

#ifndef __DungeonJS__AppStoreIAP__
#define __DungeonJS__AppStoreIAP__

#import <Foundation/Foundation.h>
#import <StoreKit/StoreKit.h>
#include "IIAP.h"

class AppStoreIAP:
public IIAP
{
public:
    void initPayment();
    bool isPaymentEnabled();
    void makePayment(std::string billno, int product, uint32_t quantity, std::string username, int zoneId);
    void getStoreName(std::string &name);
};

@interface AppStore : NSObject<SKProductsRequestDelegate, SKPaymentTransactionObserver>
{
    NSArray* mProducts;
    AppStoreIAP* mpHandle;
}

+(AppStore*) sharedAppStore;

-(void) setHandle:(AppStoreIAP*)handle;
-(BOOL) isIAPEnabled;
-(BOOL) productRequested;
-(void) requestProductData;
-(void) makePurchase:(NSInteger)product withQuantity:(NSUInteger)quantity;

@end

#endif /* defined(__DungeonJS__AppStoreIAP__) */
