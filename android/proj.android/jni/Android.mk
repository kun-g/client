LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := cocos2djs_shared

LOCAL_MODULE_FILENAME := libcocos2djs

LOCAL_SRC_FILES := start/main.cpp \
                   ../../Classes/AppDelegate.cpp \
                   ../../Classes/js/CallbackManager.cpp \
                   ../../Classes/js/IAP.cpp \
                   ../../Classes/js/UAC.cpp \
                   ../../Classes/js/Download.cpp \
                   ../../Classes/js/NativeAPI.cpp \
                   ../../Classes/js/loadModule.cpp \
                   ../../Classes/js/Feedback.cpp \
                   ../../Classes/js/System.cpp \
                   ../../Classes/js/tools.cpp \
                   ../../Classes/js/File.cpp \
                   ../../Classes/js/TCP.cpp \
                   ../../Classes/js/Http.cpp \
                   ../../Classes/utility/IFeedback.cpp \
                   ../../Classes/utility/ISystem.cpp \
                   ../../Classes/utility/TCPSocket.cpp \
                   ../../Classes/utility/IIAP.cpp \
                   ../../Classes/utility/IUAC.cpp \
                   ../../Classes/utility/aes.cpp \
                   ../../Classes/platf/android/AndroidIAP.cpp \
                   ../../Classes/platf/android/AndroidSystem.cpp \
                   ../../Classes/platf/android/AndroidUAC.cpp \
                   ../../Classes/platf/android/PublishVersions.cpp
                   
LOCAL_C_INCLUDES := $(LOCAL_PATH)/../../Classes/ \
                  cocos2dx/platform/third_party/android/prebuilt/libcurl/include/            

LOCAL_WHOLE_STATIC_LIBRARIES := cocos2dx_static
LOCAL_WHOLE_STATIC_LIBRARIES += cocosdenshion_static
LOCAL_WHOLE_STATIC_LIBRARIES += chipmunk_static
LOCAL_WHOLE_STATIC_LIBRARIES += spidermonkey_static
LOCAL_WHOLE_STATIC_LIBRARIES += scriptingcore-spidermonkey
LOCAL_WHOLE_STATIC_LIBRARIES += cocos_curl_static

LOCAL_EXPORT_CFLAGS := -DCOCOS2D_DEBUG=2 -DCOCOS2D_JAVASCRIPT

include $(BUILD_SHARED_LIBRARY)

$(call import-module,cocos2dx)
$(call import-module,CocosDenshion/android)
$(call import-module,external/chipmunk)
$(call import-module,scripting/javascript/spidermonkey-android)
$(call import-module,scripting/javascript/bindings)
$(call import-module,cocos2dx/platform/third_party/android/prebuilt/libcurl)
