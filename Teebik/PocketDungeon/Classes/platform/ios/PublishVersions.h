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
#define CHANNEL_ID_CSTR "Teebik"
#define CHANNEL_ID      (@CHANNEL_ID_CSTR)
#define TEEBIK_APPID      (2601)
#define TEEBIK_APPKEY     (@"9d6a2e2e1175a0db12588e0c675408a2")
#define TDGA_APPKEY     ("25DEA3B267F80E2AA9BDA3F4D9F23A88")

void preInitAPI();
void postInitAPI();
void onPauseApp();
void onResumeApp();

#endif /* defined(__PocketDungeon__PublishVersions__) */
