#!/bin/bash

#1 procedural constants
BAIDU="/Users/tringame/百度云同步盘/"
WORK_PATH=`dirname $0`
cd $WORK_PATH
cd ../ever-dungeon-data/
EDD_PTH=$PWD

CTABLE_srcPATH=$EDD_PTH"/ctable/"
TABLE_srcPATH=$EDD_PTH"/table/"
UI_srcPATH=$EDD_PTH"/ui/"
SOUND_srcPATH=$EDD_PTH"/sound/"

TABLE_dstPATH=$WORK_PATH"/Resources/table/"
UI_dstPATH=$WORK_PATH"/Resources/ui/"
SOUND_dstPATH=$WORK_PATH"/Resources/sound/"

echo "git fetch"
git fetch
echo "git pull"
git pull
echo "cleaning..."

rm -rf $TABLE_dstPATH
rm -rf $SOUND_dstPATH

echo "copying..."
echo "CTABLE->TABLE"
cp -R -f $CTABLE_srcPATH $TABLE_dstPATH
echo "TABLE->TABLE"
cp -R -f $TABLE_srcPATH $TABLE_dstPATH
echo "UI->UI"
cp -R -f $UI_srcPATH $UI_dstPATH
echo "SOUND->SOUND"
cp -R -f $SOUND_srcPATH $SOUND_dstPATH

echo "done ever-dungeon-data copy."