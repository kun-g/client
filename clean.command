#!/bin/bash

DST_DSCRIPT="/Resources/dscript/"
DST_DBBOX="/Resources/dblackbox/"
DST_DTAB="/Resources/dtable/"
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