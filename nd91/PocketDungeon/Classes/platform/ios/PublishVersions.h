//
//  PublishVersions.h
//  PocketDungeon
//
//  Created by 马 颂文 on 14-1-17.
//
//

#ifndef __PocketDungeon__PublishVersions__
#define __PocketDungeon__PublishVersions__

#define UMENG_APPKEY    (@"520af08956240bffb903b5f5")
#define CHANNEL_ID_CSTR "ND91"
#define CHANNEL_ID      (@CHANNEL_ID_CSTR)
#define ND91_APPID      (112988)
#define ND91_APPKEY     (@"d30d9f0f53e2654274505e25c27913fe709eb1ad6265e5c5")
#define TDGA_APPKEY     ("25DEA3B267F80E2AA9BDA3F4D9F23A88")

void preInitAPI();
void postInitAPI();
void onPauseApp();
void onResumeApp();

#endif /* defined(__PocketDungeon__PublishVersions__) */
