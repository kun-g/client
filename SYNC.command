#!/bin/bash

# configure parameters

DST="/Users/hammer/Develop/DungeonRaidersOnGithub/success/ArtistWorkshop/"
DST_FONT="/Users/hammer/Develop/DungeonRaidersOnGithub/success/Clients/PocketDungeon/PocketDungeon/Resources/font/"
DST_SPRITE="/Users/hammer/Develop/DungeonRaidersOnGithub/success/Clients/PocketDungeon/PocketDungeon/Resources/sprite/"

BUILD="/Users/hammer/百度云同步盘/ArtistWorkshop/"
SRC_FONT="/Users/hammer/百度云同步盘/ArtistWorkshop/DungeonRaiders/Resources/font/"
SRC_SPRITE="/Users/hammer/百度云同步盘/ArtistWorkshop/DungeonRaiders/Resources/sprite/"

echo "cleaning..."

rm -rf $DST
rm -rf $DST_SPRITE
rm -rf $DST_FONT

echo "copying..."
echo "->backup"
cp -R -f $BUILD $DST
echo "->sprite"
cp -R -f $SRC_SPRITE $DST_SPRITE
echo "->font"
cp -R -f $SRC_FONT $DST_FONT

echo "done sync."