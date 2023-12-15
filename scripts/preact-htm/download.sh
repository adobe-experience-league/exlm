
# why? because we want to use preact AND HTM in one optimized module, see: https://github.com/developit/htm?tab=readme-ov-file#installation
# but why this script? to make it easier to get a specific version of HTM, in case it needs to be updated
# also for you to know where it came from!

# You need Node/NPM installed to run this script
# and a mac.. or windows with wsl (https://learn.microsoft.com/en-us/windows/wsl/install)

HTM_VERSION=3.1.1
HTM_PACKAGE=htm@${HTM_VERSION}
HTM_TAR=htm-${HTM_VERSION}.tgz
PREACT_STANDALONE_FILE=standalone.module.js
PREACT_STANDALONE_PATH=package/preact/${PREACT_STANDALONE_FILE}
TARGET_FILE_NAME=preact-htm.js

# 1. download package from npm
echo "Downloading $HTM_PACKAGE ..."
npm pack $HTM_PACKAGE --silent

# 2. extract preact standalone module which includes preact AND HTM in one optimized module see: https://github.com/developit/htm
echo "Extracting $PREACT_STANDALONE_PATH from $HTM_TAR ..."
tar -xzf $HTM_TAR --strip-components=2 $PREACT_STANDALONE_PATH

# 3. rename PREACT_STANDALONE_PATH to TARGET_FILE_NAME
echo "3 Renaming $PREACT_STANDALONE_FILE to $TARGET_FILE_NAME ..."
mv $PREACT_STANDALONE_FILE $TARGET_FILE_NAME

# 4. remove tar
echo "4. Removing $HTM_TAR ..."
rm -rf $HTM_TAR

echo "Done!"