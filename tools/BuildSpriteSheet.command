#!/bin/bash
#自动生成spritesheet
#设置工作路径
DST_DIR="/Users/hammer/Develop/DungeonRaidersOnGithub/localart/build/DungeonRaiders/Resources/spritesheets/"
CPY_DIR="/Users/hammer/Develop/DungeonRaidersOnGithub/client/Resources/spritesheets/"
SRC_DIR="/Users/hammer/Develop/DungeonRaidersOnGithub/localart/build/Spritesheets/"

for obj in `ls $SRC_DIR`; do
 echo "-> build $obj"
 #生成spritesheets
 TexturePacker --data ${DST_DIR}${obj}.plist --sheet ${DST_DIR}${obj}.png --max-size 1024 --quiet $SRC_DIR$obj
done

rm -rf $CPY_DIR
cp -R -f $DST_DIR $CPY_DIR 

echo "done"
read -p "Press [Enter] key to continue..."