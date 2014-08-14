
lipo -create /Users/ljf/Documents/KY_demo/lib/Debug-iphoneos/libKY_PaySDK.a /Users/ljf/Documents/KY_demo/lib/Debug-iphonesimulator/libKY_PaySDK.a -output /Users/ljf/Documents/KY_demo/lib/libKY_PaySDK.a
lipo -info /Users/ljf/Documents/KY_demo/lib/libKY_PaySDK.a

echo "********************************************************************"
echo " - check udid"

find . | grep -v .svn | grep "\.a" | grep -v "\.app" | xargs grep uniqueIdentifier

echo " - check over"