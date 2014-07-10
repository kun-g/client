#!/bin/bash

SRC_SHARED="./ever-dungeon-data/table/shared.js"
DST_SHARED="./success/Clients/PocketDungeon/PocketDungeon/Resources/script/shared.js"

DST_SOUND="./client/Resources/sound/"
DST_TABLE="./client/Resources/table/"
DST_UI="./client/Resources/ui/"
DST_BLACKBOX="./client/Resources/blackbox/"
DST_MISC="./client/Resources/misc/"

SRC_SOUND="./ever-dungeon-data/sound/"
SRC_TABLE="./ever-dungeon-data/table/"
SRC_CTABLE="./ever-dungeon-data/ctable/"
SRC_UI="./ever-dungeon-data/ui/"
SRC_BLACKBOX="./ever-dungeon/blackbox/"
SRC_MISC="./ever-dungeon-data/misc/"

REMOVE="./Clients/PocketDungeon/PocketDungeon/Resources/table/shared.js"

WORKPATH=`dirname $0`
cd $WORKPATH

#rm -rf $DST_SHARED
rm -rf $DST_BLACKBOX
rm -rf $DST_SOUND
rm -rf $DST_TABLE
rm -rf $DST_MISC
#cp -f $SRC_SHARED $DST_SHARED
cp -R -f $SRC_BLACKBOX $DST_BLACKBOX
cp -R -f $SRC_TABLE $DST_TABLE
cp -R -f $SRC_CTABLE $DST_TABLE
cp -R -f $SRC_SOUND $DST_SOUND
cp -R -f $SRC_MISC $DST_MISC
cp -R -f $SRC_UI $DST_UI
rm -f $REMOVE

#copy data to server
#cp ./Data/table/*.json ./Server/
#cp ./Data/table/*.js ./Server/
#cp ./Data/stable/*.json ./Server/
