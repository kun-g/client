#!/bin/bash

# configure parameters

DST_UI="/Users/hammer/Develop/DungeonRaidersOnGithub/client/Resources/ui/"
DST_NODE="/Users/hammer/Develop/DungeonRaidersOnGithub/client/Resources/node/"

BUILD_UI="/Users/hammer/Develop/DungeonRaidersOnGithub/localart/build/DungeonRaiders/Published-iOS/ui/"
BUILD_NODE="/Users/hammer/Develop/DungeonRaidersOnGithub/localart/build/DungeonRaiders/Published-iOS/node/"

echo "copying ccbis..."

cp -R -f $BUILD_UI $DST_UI
cp -R -f $BUILD_NODE $DST_NODE

echo "done copying."
read -p "Press [Enter] key to continue..."