# 分解当前库文件

echo
echo ------------- 库文件分解进程开始 -------------

rm -rf libs
mkdir libs
cp libTeebikGameSdk.a ./libs/libTeebikGameSdk.org
cd libs
mkdir armv7
mkdir armv7s
mkdir arm64
mkdir i386
mkdir x86_64

echo 显示原库文件包含的CPU信息
xcrun -sdk iphoneos lipo -info libTeebikGameSdk.org

echo 开始分解，请稍后...

xcrun -sdk iphoneos lipo libTeebikGameSdk.org -thin armv7 -output ./armv7/libTeebikGameSdk.armv7
xcrun -sdk iphoneos lipo libTeebikGameSdk.org -thin armv7s -output ./armv7s/libTeebikGameSdk.armv7s
xcrun -sdk iphoneos lipo libTeebikGameSdk.org -thin arm64 -output ./arm64/libTeebikGameSdk.arm64
xcrun -sdk iphoneos lipo libTeebikGameSdk.org -thin i386 -output ./i386/libTeebikGameSdk.i386
xcrun -sdk iphoneos lipo libTeebikGameSdk.org -thin x86_64 -output ./x86_64/libTeebikGameSdk.x86_64

cd armv7
ar -x libTeebikGameSdk.armv7
rm -rf libTeebikGameSdk.armv7
cd ..
cd armv7s
ar -x libTeebikGameSdk.armv7s
rm -rf libTeebikGameSdk.armv7s
cd ..
cd arm64
ar -x libTeebikGameSdk.arm64
rm -rf libTeebikGameSdk.arm64
cd ..
cd i386
ar -x libTeebikGameSdk.i386
rm -rf libTeebikGameSdk.i386
cd ..
cd x86_64
ar -x libTeebikGameSdk.x86_64
rm -rf libTeebikGameSdk.x86_64
cd ..
cd ..

echo ------------- 库文件分解进程完成 -------------
echo

# 删除重复文件

echo
echo ------------- 删除重复文件进程开始 -------------
echo 正在删除文件，请稍后...

echo 删除ASI*.o
rm -rf ./libs/armv7/ASI*.o
rm -rf ./libs/armv7s/ASI*.o
rm -rf ./libs/arm64/ASI*.o
rm -rf ./libs/i386/ASI*.o
rm -rf ./libs/x86_64/ASI*.o

echo 删除RegexKitLite.o
rm -rf ./libs/armv7/RegexKitLite.o
rm -rf ./libs/armv7s/RegexKitLite.o
rm -rf ./libs/arm64/RegexKitLite.o
rm -rf ./libs/i386/RegexKitLite.o
rm -rf ./libs/x86_64/RegexKitLite.o

echo 删除SBJsonParser.o
rm -rf ./libs/armv7/SBJsonParser.o
rm -rf ./libs/armv7s/SBJsonParser.o
rm -rf ./libs/arm64/SBJsonParser.o
rm -rf ./libs/i386/SBJsonParser.o
rm -rf ./libs/x86_64/SBJsonParser.o

echo 删除SBJsonWriter.o
rm -rf ./libs/armv7/SBJsonWriter.o
rm -rf ./libs/armv7s/SBJsonWriter.o
rm -rf ./libs/arm64/SBJsonWriter.o
rm -rf ./libs/i386/SBJsonWriter.o
rm -rf ./libs/x86_64/SBJsonWriter.o

echo ------------- 删除重复文件完成 -------------
echo

# 合并库文件

echo
echo ------------- 库文件合并进程开始 -------------
echo 正在合并，请稍等...

cd libs
libtool -static -o ./armv7/libTeebikGameSdk.armv7 ./armv7/*.o
libtool -static -o ./armv7s/libTeebikGameSdk.armv7s ./armv7s/*.o
libtool -static -o ./arm64/libTeebikGameSdk.arm64 ./arm64/*.o
libtool -static -o ./i386/libTeebikGameSdk.i386 ./i386/*.o
libtool -static -o ./x86_64/libTeebikGameSdk.x86_64 ./x86_64/*.o

xcrun -sdk iphoneos lipo -create ./armv7/libTeebikGameSdk.armv7 ./armv7s/libTeebikGameSdk.armv7s ./arm64/libTeebikGameSdk.arm64 ./i386/libTeebikGameSdk.i386 ./x86_64/libTeebikGameSdk.x86_64 -output libTeebikGameSdk.a

echo 显示新库文件包含的CPU信息
xcrun lipo -info libTeebikGameSdk.a

cd ..

echo 新的库文件合并完成，请使用./libs/libTeebikGameSdk.a
echo ------------- 库文件合并进程完成 -------------
echo