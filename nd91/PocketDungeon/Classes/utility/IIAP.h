//
//  IIAP.h
//  DungeonJS
//
//  Created by 马 颂文 on 13-8-14.
//
//

#ifndef __DungeonJS__IIAP__
#define __DungeonJS__IIAP__

#include <string>

enum PaymentResult
{
    Payment_Success = 0,//处理成功
    Payment_Canceled,//用户取消
    Payment_Failed,//处理失败
    Payment_Processing,//仍在处理中
};

class IAPDelegate
{
public:
    virtual void onPaymentResult(PaymentResult result,
                                 int product,
                                 std::string message) = 0;
};

class IIAP
{
public:
    virtual ~IIAP(){};
    
    void setIAPDelegate(IAPDelegate *pDelegate);
    IAPDelegate* getIAPDelegate();
    
    virtual void initPayment() = 0;
    virtual bool isPaymentEnabled() = 0;
    virtual void makePayment(std::string billno, int product, uint32_t quantity, std::string username, int zoneId) = 0;
    virtual void getStoreName(std::string &name) = 0;
    
private:
    IAPDelegate *mpDelegate;
};

void setIAP(IIAP* pIAP);
IIAP* getIAP();

#endif /* defined(__DungeonJS__IIAP__) */
