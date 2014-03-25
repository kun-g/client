#!/bin/bash

DST_DSCRIPT="/PocketDungeon/PocketDungeon/Resources/dscript/"
DST_DBBOX="/PocketDungeon/PocketDungeon/Resources/dblackbox/"
DST_SYS="/PocketDungeon/PocketDungeon/Resources/"
DST_DTAB="/PocketDungeon/PocketDungeon/Resources/dtable/"
ENCRYPT_KEY="WhyDoingThis"

#init
WORKPATH=`dirname $0`
cd $WORKPATH

FULL=$WORKPATH$DST_DSCRIPT*
rm -rf $FULL

FULL=$WORKPATH$DST_DBBOX*
rm -rf $FULL

FULL=$WORKPATH$DST_DTAB*
rm -rf $FULL

echo "work done"