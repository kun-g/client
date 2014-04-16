#!/bin/bash

#0 preset variables
ENCRYPT_KEY="WhyDoingThis" #default encrypt key

#1 procedural constants
WORK_PATH=`dirname $0`
cd $WORK_PATH
RES_PATH="Clients/PocketDungeon/PocketDungeon/Resources"
CLI_PATH="Clients/PocketDungeon/PocketDungeon"

BLACKLIST=( \
"/Resources/blackbox/" \
"/Resources/script/" \
"/Resources/table/" \
"/Resources/dtable/drop.bad" \
)

function folder {
	_DIR=`dirname $1`
	if [ ! -f $_DIR ]; then
		mkdir -p $_DIR
	fi
}

#2 display header
clear
echo "UPDATE COMPARER"
echo ""
echo "> type 'develop' to compare a develop update."
echo "> type 'master' to compare a master update."

read -p "Enter your choice:" COMMAND
if [ "$COMMAND" == "develop" ]; then
	WORK_BRANCH="develop"
	CDN_URL="http://hotupdate.qiniudn.com"
	CDN_CONF="./develop-conf.json"
	TAG_PREFIX="D"
elif [ "$COMMAND" == "master" ]; then
	WORK_BRANCH="master"
	CDN_URL="http://drhu.qiniudn.com"
	CDN_CONF="./master-conf.json"
	TAG_PREFIX="M"
else
	echo "ERROR: wrong command."
	exit
fi

#3 fetch version info
read -p "Enter your first version:" LAST_VERSION
LAST_TAG=$TAG_PREFIX$LAST_VERSION
read -p "Enter your second version:" NEW_VERSION
NEW_TAG=$TAG_PREFIX$NEW_VERSION

#6 fetch updated files
echo "- calculating changes"
function UpdateFile {
	_FLAG=1
	for _BLACK in ${BLACKLIST[*]}
	do
		if [[ $1 == *$_BLACK* ]]; then
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
	UpdateFile $TAR
done
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
echo $NEW_VERSION > hotupdate/version
./qrsync $CDN_CONF
rm -R -f hotupdate
echo "  upload done."

#9 commit at last
echo "* work done"




	


