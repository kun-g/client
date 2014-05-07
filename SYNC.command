#!/bin/bash

#1 procedural constants
BAIDU="/Users/tringame/百度云同步盘/"
WORK_PATH=`dirname $0`
cd $WORK_PATH

# configure parameters
echo "---------------------------------------------------"
echo "sync start"

DST_FONT=$WORK_PATH"/Resources/font/"
DST_SPRITE=$WORK_PATH"/Resources/sprite/"

BUILD=$BAIDU"ArtistWorkshop/"
SRC_FONT=$BAIDU"ArtistWorkshop/DungeonRaiders/Resources/font/"
SRC_SPRITE=$BAIDU"ArtistWorkshop/DungeonRaiders/Resources/sprite/"

echo "cleaning..."

rm -rf $DST
rm -rf $DST_SPRITE
rm -rf $DST_FONT

echo "copying..."
echo "->sprite"
cp -R -f $SRC_SPRITE $DST_SPRITE
echo "->font"
cp -R -f $SRC_FONT $DST_FONT

echo "done sync."

#自动生成spritesheet
#设置工作路径
echo "---------------------------------------------------"
echo "spritesheet start"

SRC_DIR=$BAIDU"ArtistWorkshop/Spritesheets/"
DST_DIR=$WORK_PATH"/Resources/spritesheets/"
DST_DIR2=$BAIDU"ArtistWorkshop/DungeonRaiders/Resources/spritesheets/"

echo "cleaning..."

rm -rf $DST_DIR

echo "copy..."
cp -R -f $DST_DIR2 $DST_DIR

echo "done spritesheet"

# configure parameters

echo "---------------------------------------------------"
echo "ccbi  start"

DST_UI=$WORK_PATH"/Resources/ui/"
DST_NODE=$WORK_PATH"/Resources/node/"

BUILD_UI=$BAIDU"ArtistWorkshop/DungeonRaiders/Published-iOS/ui/"
BUILD_NODE=$BAIDU"ArtistWorkshop/DungeonRaiders/Published-iOS/node/"

echo "copying ccbis..."

cp -R -f $BUILD_UI $DST_UI
cp -R -f $BUILD_NODE $DST_NODE

echo "done ccbis copying."