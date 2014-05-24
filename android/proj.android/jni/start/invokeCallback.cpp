#include <jni.h>
#include "cocos2d.h"
#include "platf/android/AndroidSystem.h"

using namespace cocos2d;

#ifdef __cplusplus
extern "C" {
#endif

JNIEXPORT void JNICALL
Java_com_tringame_SystemInvoke_invokeAlertCallback(JNIEnv* env, jclass jc, jint which)
{
	onAlertCallback((int)which);
}

#ifdef __cplusplus
}
#endif