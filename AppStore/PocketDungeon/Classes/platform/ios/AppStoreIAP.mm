//
//  AppStoreIAP.cpp
//  DungeonJS
//
//  Created by 马 颂文 on 13-8-15.
//
//

#import "GTMBase64.h"
#include "cocos2d.h"
#include "AppStoreIAP.h"

using namespace cocos2d;
using namespace std;

#define APPSTORE_FILENAME ("AppStore.plist")

void AppStoreIAP::initPayment()
{
    [[AppStore sharedAppStore] setHandle:this];
    [[SKPaymentQueue defaultQueue] addTransactionObserver:[AppStore sharedAppStore]];
    [[AppStore sharedAppStore] requestProductData];
}

bool AppStoreIAP::isPaymentEnabled()
{
    BOOL enabled = [[AppStore sharedAppStore] isIAPEnabled];
    BOOL prepared = [[AppStore sharedAppStore] productRequested];
    if( enabled && prepared )
    {
        return true;
    }
    else
    {
        return false;
    }
}

void AppStoreIAP::makePayment(string billno, int product, uint32_t quantity, string username, int zoneId)
{
    NSLog(@"makePayment(%d)", product);
    [[AppStore sharedAppStore] makePurchase:product withQuantity:quantity];
}

void AppStoreIAP::getStoreName(string &name)
{
    name = "AppStore";
}

/*** AppStore ***/

AppStore* gAppStoreInstance = nil;

@implementation AppStore

+(AppStore*) sharedAppStore
{
    if( gAppStoreInstance == nil )
    {
        gAppStoreInstance = [[AppStore alloc] init];
    }
    return gAppStoreInstance;
}

-(id) init
{
    if( self = [super init] )
    {
        mProducts = nil;
        mpHandle = NULL;
    }
    return self;
}

-(void) setHandle:(AppStoreIAP *)handle
{
    mpHandle = handle;
}

-(BOOL) isIAPEnabled
{
    return [SKPaymentQueue canMakePayments];
}

-(BOOL) productRequested
{
    if( mProducts != nil )
    {
        return YES;
    }
    else
    {
        return NO;
    }
}

-(void) requestProductData
{
    @autoreleasepool {
        string fullpath = CCFileUtils::sharedFileUtils()->fullPathForFilename(APPSTORE_FILENAME);
        NSString* strPath = [NSString stringWithCString:fullpath.c_str() encoding:NSUTF8StringEncoding];
        mProductsMeta = [NSArray arrayWithContentsOfFile:strPath];
        [mProductsMeta retain];
        if( mProductsMeta != nil )
        {
            NSSet* productSet = [NSSet setWithArray:mProductsMeta];
            
            SKProductsRequest *request = [[[SKProductsRequest alloc] initWithProductIdentifiers:productSet] autorelease];
            request.delegate = self;
            [request start];
        }
        else
        {
            CCLog("<error> AppStore: can not find AppStore.plist.");
        }
    }
}

-(void) makePurchase:(NSInteger)product withQuantity:(NSUInteger)quantity
{
    @autoreleasepool {
        SKProduct *theProduct = nil;
        if( mProducts != nil )
        {
            theProduct = [self queryProductByIndex:product];
        }
        if( theProduct != nil )
        {
            SKMutablePayment *payment = [SKMutablePayment paymentWithProduct:theProduct];
            payment.quantity = quantity;
            CCLog("AppStore: makePayment: %s", [payment.productIdentifier cStringUsingEncoding:NSUTF8StringEncoding]);
            [[SKPaymentQueue defaultQueue] addPayment:payment];
        }
        else
        {
            NSString* strMsg = @"此商品暂时不可用";
            mpHandle->getIAPDelegate()->onPaymentResult(Payment_Failed, product, string([strMsg cStringUsingEncoding:NSUTF8StringEncoding]));
        }
    }
}

-(void) productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response
{
    @autoreleasepool {
        CCLog("AppStore: received product infomation(%d).", response.products.count);
        if( response.products.count > 0 )
        {
            if( mProducts != nil )
            {
                [mProducts release];
                mProducts = nil;
            }
            mProducts = response.products;
            [mProducts retain];
        }
    }
}

-(void) paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions
{
    @autoreleasepool {
        NSMutableArray* list = [NSMutableArray arrayWithArray:transactions];
        while(list.count != 0)
        {
            SKPaymentTransaction* transaction = [list lastObject];
            
            //NSLog(@"TRANSCATION = %@", transaction.payment.productIdentifier);//debug
            int product = [self queryProductIndex:transaction.payment.productIdentifier];
            
            switch (transaction.transactionState) {
                case SKPaymentTransactionStatePurchased:
                case SKPaymentTransactionStateRestored:
                {
                    //NSLog(@"PAYMENT SUCESS");
                    NSString* strReceipt = [GTMBase64 stringByEncodingData:transaction.transactionReceipt];
                    mpHandle->getIAPDelegate()->onPaymentResult(Payment_Success,
                                                                product,
                                                                string([strReceipt cStringUsingEncoding:NSUTF8StringEncoding]));
                    
                    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
                }
                    break;
                case SKPaymentTransactionStateFailed:
                {
                    if( transaction.error.code == SKErrorPaymentCancelled )
                    {
                        //NSLog(@"PAYMENT CANCELED");//debug
                        NSString* strMsg = @"用户取消操作";
                        mpHandle->getIAPDelegate()->onPaymentResult(Payment_Canceled,
                                                                    product,
                                                                    string([strMsg cStringUsingEncoding:NSUTF8StringEncoding]));
                    }
                    else
                    {
                        //NSLog(@"PAYMENT FAILED");//debug
                        mpHandle->getIAPDelegate()->onPaymentResult(Payment_Failed,
                                                                    product,
                                                                    string([[transaction.error description] cStringUsingEncoding:NSUTF8StringEncoding]));
                    }
                    
                    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
                }
                    break;
                default:
                    NSLog(@"PAYMENT IS RUNNING");//debug
                    break;
            }
            [list removeLastObject];
        }
    }
}

-(int) queryProductIndex:(NSString *)iapId
{
    int product = -1;
    for(int i=0; i<mProductsMeta.count; ++i)
    {
        NSString* pd = [mProductsMeta objectAtIndex:i];
        if( [pd compare:iapId] == NSOrderedSame )
        {
            product = i;
            break;
        }
    }
    return product;
}

-(SKProduct*) queryProductByIndex:(int)idx
{
    NSString* iapId = [mProductsMeta objectAtIndex:idx];
    for(SKProduct* p in mProducts)
    {
        if( [p.productIdentifier compare:iapId] == NSOrderedSame ){
            return p;
        }
    }
    return nil;
}

@end