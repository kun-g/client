#!/bin/bash

# configure parameters

DST_FONT="/Users/hammer/Develop/DungeonRaidersOnGithub/client/Resources/font/"
DST_SPRITE="/Users/hammer/Develop/DungeonRaidersOnGithub/client/Resources/sprite/"

SRC_FONT="/Users/hammer/Develop/DungeonRaidersOnGithub/localart/build/DungeonRaiders/Resources/font/"
SRC_SPRITE="/Users/hammer/Develop/DungeonRaidersOnGithub/localart/build/DungeonRaiders/Resources/sprite/"

echo "cleaning..."

rm -rf $DST
rm -rf $DST_SPRITE
rm -rf $DST_FONT

echo "->sprite"
cp -R -f $SRC_SPRITE $DST_SPRITE
echo "->font"
cp -R -f $SRC_FONT $DST_FONT

echo "done sync."
read -p "Press [Enter] key to continue..."