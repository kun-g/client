#!/bin/bash

SRC_JSCODE1="/PocketDungeon/PocketDungeon/Resources/blackbox/"
SRC_JSCODE2="/PocketDungeon/PocketDungeon/Resources/script/"
SRC_JSON="/PocketDungeon/PocketDungeon/Resources/table/"
SRC_SYS="/PocketDungeon/PocketDungeon/libs/javascript/bindings/js/"

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

#compile jscode1
FULL=$WORKPATH$SRC_JSCODE1
for obj in `ls $FULL`
do
  SRC=$FULL$obj
  NAME=`basename $SRC .js`.jsc
  DST=${WORKPATH}${DST_DBBOX}${NAME}
  echo "-> compiling $NAME"
  ./jsbcc $SRC $DST
done

#compile jscode2
FULL=$WORKPATH$SRC_JSCODE2
for obj in `ls $FULL`
do
  SRC=$FULL$obj
  NAME=`basename $SRC .js`.jsc
  DST=${WORKPATH}${DST_DSCRIPT}${NAME}
  echo "-> compiling $NAME"
  ./jsbcc $SRC $DST
done

#compile system
FULL=$WORKPATH$SRC_SYS
for obj in `ls $FULL`
do
  SRC=$FULL$obj
  NAME=`basename $SRC .js`.jsc
  DST=${WORKPATH}${DST_SYS}${NAME}
  echo "-> compiling $NAME"
  ./jsbcc $SRC $DST
done

#encode json data
FULL=$WORKPATH$SRC_JSON
for obj in `ls $FULL`
do
  SRC=$FULL$obj
  NAME=`basename $SRC .json`.bad
  DST=$WORKPATH${DST_DTAB}$NAME
  echo "-> encrypting $NAME"
  ./encrypt $ENCRYPT_KEY $SRC $DST
done

echo "work done"