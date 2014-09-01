//
//  TeebikUAC.h
//  PocketDungeon-Teebik
//
//  Created by Jovismac on 14-8-22.
//
//

#ifndef PocketDungeon_Teebik_TeebikUAC_h
#define PocketDungeon_Teebik_TeebikUAC_h

#import <Foundation/Foundation.h>
//#import <StoreKit/StoreKit.h>
#include "IUAC.h"
#include "IIAP.h"
#import "TeebikGameSdk.h"

void initTeebik();

class TeebikUAC : public IUAC, public IIAP {
public:
    //--- UAC ---
    void initUAC();
    void presentLoginView();
    void presentManageView();
    void logout();
    
    void getUserName(std::string &name);
    void getUserId(std::string &token);
    
    //--- IAP ---
    void initPayment();
    bool isPaymentEnabled();
    void makePayment(std::string billno, int product, uint32_t quantity, std::string username, int zoneId);
    void getStoreName(std::string &name);
    
private:
    NSArray* mProducts;
};

@interface TeebikDelegate : NSObject{
    UACDelegate* mpUACD;
    IAPDelegate* mpIAPD;
    NSArray* mProducts;
    NSArray* mProductsMeta;
}

+ (TeebikDelegate*) sharedInstance;
- (void) initUacSuccess;
- (void) setUACDelegate:(UACDelegate*)pInstance;
- (void) setIAPDelegate:(IAPDelegate*)pInstance;
- (BOOL) isIAPEnabled;
- (BOOL) productRequested;
- (void) requestProductData;
- (void) makePurchase:(NSInteger)product;

@end

@interface AlertViewController: UIViewController<UIAlertViewDelegate>{
    
}

+ (AlertViewController*) sharedInstance;
- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex;

@end

#endif
