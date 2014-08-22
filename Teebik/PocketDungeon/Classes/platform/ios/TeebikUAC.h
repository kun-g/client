//
//  TeebikUAC.h
//  PocketDungeon-Teebik
//
//  Created by Jovismac on 14-8-22.
//
//

#ifndef PocketDungeon_Teebik_TeebikUAC_h
#define PocketDungeon_Teebik_TeebikUAC_h

#include "IUAC.h"
#include "IIAP.h"
#import "TeebikGameSdk.h"

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
}

+ (TeebikDelegate*) sharedInstance;

- (void) setUACDelegate:(UACDelegate*)pInstance;

- (void) setIAPDelegate:(IAPDelegate*)pInstance;

- (void) teebikGameSdkWithInitSuccess;

- (void) teebikGameSdkWithInitFailed:(NSString*)error;

- (void)teebikGameSdkWithExitApp;

- (void) teebikGameSdkWithClosedView;

- (void)teebikGameSdkWithProcessDlgStart;

- (void)teebikGameSdkWithProcessDlgStop;

- (void)teebikGameSdkWithErrorInfo:(NSString *)error;

- (void)teebikGameSdkWithWraningInfo:(NSString *)wraning;

- (void)teebikGameSdkWithFinishInfo:(NSString *)info;

@end

#endif
