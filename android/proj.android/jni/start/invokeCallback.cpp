#include <jni.h>
#include "cocos2d.h"

using namespace cocos2d;

JNIEXPORT void JNICALL
Java_com_tringame_pocketdungeon_PocketDungeon_invokeAlertCallback(JNIEnv* env, jobject obj)
{
	CCLog("invokeAlertCallback");
}