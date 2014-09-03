#!/bin/bash

#0 preset variables
ENCRYPT_KEY="WhyDoingThis" #default encrypt key

#1 procedural constants
WORK_PATH=`dirname $0`
cd $WORK_PATH
RES_PATH="Resources"

BLACKLIST=( \
"*/blackbox/*" \
"*/script/*" \
"*/table/*" \
"*/tutorialList.js" \
)

function folder {
	_DIR=`dirname $1`
	if [ ! -f $_DIR ]; then
		mkdir -p $_DIR
	fi
}

#2 display header
clear
echo "UPDATE PACKER"
echo ""
echo "> type 'develop' to pack a develop update."
echo "> type 'master' to pack a master update."

read -p "Enter your choice:" COMMAND
if [ "$COMMAND" == "develop" ]; then
	WORK_BRANCH="develop"
	CDN_URL="http://hotupdate.qiniudn.com"
	CDN_CONF="./develop-conf.json"
	TAG_PREFIX="D"
    REDIS_KEY="LocalVersion"
elif [ "$COMMAND" == "master" ]; then
	echo "* WARNING: YOU ARE ATTEMPTING TO WORK WITH MASTER BRANCH. TYPE 'master' AGAIN TO CONFIRM."
	read -p "Confirm your choice:" COMMAND
	if [ "$COMMAND" == "master" ]; then
		WORK_BRANCH="master"
		CDN_URL="http://drhu.qiniudn.com"
		CDN_CONF="./master-conf.json"
        REDIS_KEY="MasterVersion"
		TAG_PREFIX="M"
	else
		echo "ERROR: wrong command."
		exit
	fi
else
	echo "ERROR: wrong command."
	exit
fi

CUR_BRANCH=`git branch | awk 'BEGIN{FS=" "}{if ($1=="*") print $2}'`
if [ "$WORK_BRANCH" != "$CUR_BRANCH" ]; then
	echo "ERROR: you are under branch '$CUR_BRANCH', switch to '$WORK_BRANCH' and try again."
	exit
fi

#3 fetch version info
echo "- fetching version info"
LAST_VERSION=`redis-cli -h 10.4.3.41 --raw get $REDIS_KEY`
LAST_TAG=$TAG_PREFIX$LAST_VERSION
echo "  last version code is $LAST_VERSION($LAST_TAG)"
NEW_VERSION=`expr $LAST_VERSION + 1`
NEW_TAG=$TAG_PREFIX$NEW_VERSION

#4 compile resources
function CleanDFolders {
	_PWD=`pwd`
	cd $WORK_PATH
	_FULL=$RES_PATH/dblackbox/*
	rm -rf $_FULL
	_FULL=$RES_PATH/dscript/*
	rm -rf $_FULL
	_FULL=$RES_PATH/dtable/*
	rm -rf $_FULL
	cd $_PWD
}

function CompileJSC {
	_PWD=`pwd`
    echo $1
	for _OBJ in `ls $1`
	do
		if [[ $_OBJ == *.js ]]; then
			_SRC=$_PWD/$1/$_OBJ
			_NAME=`basename $_OBJ .js`.jsc
			_DST=$_PWD/$2/$_NAME
			./jsbcc $_SRC $_DST
		fi
	done
}

function Encrypt {
	_PWD=`pwd`
	for _OBJ in `ls $1`
	do
		if [[ $_OBJ == *.json ]]; then
			_SRC=$_PWD/$1/$_OBJ
			_NAME=`basename $_OBJ .json`.bad
			_DST=$_PWD/$2/$_NAME
			./encrypt $ENCRYPT_KEY $_SRC $_DST
		fi
	done
}

echo "- compiling resources"
CleanDFolders
folder $RES_PATH/dblackbox/dummy
folder $RES_PATH/dscript/dummy
folder $RES_PATH/dtable/dummy
CompileJSC $RES_PATH/blackbox $RES_PATH/dblackbox
CompileJSC $RES_PATH/script $RES_PATH/dscript
CompileJSC libs/javascript/bindings/js $RES_PATH
CompileJSC $RES_PATH/table $RES_PATH/dtable
CompileJSC $RES_PATH/ui/1136 $RES_PATH/ui/1136
CompileJSC $RES_PATH/ui/960 $RES_PATH/ui/960
echo "  compile done."

#5 commit branch
echo "- commiting update"
git add $RES_PATH
git commit -am "AUTO COMMIT "$NEW_TAG
git tag -f $NEW_TAG
#git push origin $WORK_BRANCH
echo "  commit done."

#6 fetch updated files
echo "- calculating changes"
function UpdateFile {
	_FLAG=1
	for _BLACK in ${BLACKLIST[*]}
	do
		if [[ $1 == $_BLACK ]]; then
			_FLAG=0
			break
		fi
	done
	if [ $_FLAG = 1 ]; then
		_SRC=$1
		_REL=${_SRC/$RES_PATH/}
		echo "+ $_REL"
		_DST=./update$_REL
		folder $_DST
		cp $_SRC $_DST
	fi
}

rm -R -f update
mkdir update

CHANGES=`git diff $LAST_TAG..$NEW_TAG --name-status -- $RES_PATH | awk 'BEGIN{FS=" "} {if ($1!="D") print $2}'`
echo "------ update list ------"
for TAR in $CHANGES
do
    echo $TAR
    #UpdateFile $TAR
done

exit
#for debug

echo "------ end of list ------"

echo "NOTICE: The update content is about to be packed. You may manually interfere with the update content by now."
read -p "When you are ready, Press any key to continue..."

#7 pack
echo "- packing"
rm -f update.zip
zip -r -q update.zip update
rm -R -f update
echo " pack done."


echo "NOTICE: The update content is about to be delivered to server."
read -p "When you are ready, Press any key to continue..."

#8 upload
echo "- uploading"
rm -R -f hotupdate
mkdir hotupdate
mv update.zip hotupdate/$NEW_VERSION
redis-cli -h 10.4.3.41 set $REDIS_KEY $NEW_VERSION
./qrsync $CDN_CONF
rm -R -f hotupdate
echo "  upload done."

#9 commit at last
echo "* work done"




	


