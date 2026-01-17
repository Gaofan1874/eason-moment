#!/bin/bash

# Gitee Release Upload Script
# Usage: ./scripts/upload-to-gitee.sh <tag> <file_path>

set -e

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <tag> <file_path>"
    echo "Example: $0 v0.1.7 dist/eason-moment-0.1.7.dmg"
    exit 1
fi

TAG=$1
FILE_PATH=$2
FILE_NAME=$(basename "$FILE_PATH")

# Gitee configuration
GITEE_OWNER="lin-gaofan"
GITEE_REPO="eason-moment"
GITEE_API_BASE="https://gitee.com/api/v5"

# Get Gitee token from environment or prompt
if [ -z "$GITEE_TOKEN" ]; then
    echo "Please enter your Gitee Personal Access Token:"
    echo "Get it from: https://gitee.com/profile/personal_access_tokens"
    read -s GITEE_TOKEN
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' not found"
    exit 1
fi

echo "Uploading $FILE_NAME to Gitee Release $TAG..."

# Get release ID
RELEASE_RESPONSE=$(curl -s "$GITEE_API_BASE/repos/$GITEE_OWNER/$GITEE_REPO/releases/tags/$TAG?access_token=$GITEE_TOKEN")

# Check if release exists
if echo "$RELEASE_RESPONSE" | grep -q "id"; then
    RELEASE_ID=$(echo "$RELEASE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "Found existing release with ID: $RELEASE_ID"

    # Check if asset already exists
    ASSETS_RESPONSE=$(curl -s "$GITEE_API_BASE/repos/$GITEE_OWNER/$GITEE_REPO/releases/$RELEASE_ID/assets?access_token=$GITEE_TOKEN")

    if echo "$ASSETS_RESPONSE" | grep -q "\"name\":\"$FILE_NAME\""; then
        echo "Warning: File '$FILE_NAME' already exists in release. Skipping upload."
        exit 0
    fi
else
    echo "Error: Release for tag '$TAG' not found"
    echo "Please create the release first on Gitee"
    exit 1
fi

# Upload file
echo "Uploading file..."
UPLOAD_RESPONSE=$(curl -s -X POST \
    -H "Authorization: token $GITEE_TOKEN" \
    -F "file=@$FILE_PATH" \
    "$GITEE_API_BASE/repos/$GITEE_OWNER/$GITEE_REPO/releases/$RELEASE_ID/assets")

if echo "$UPLOAD_RESPONSE" | grep -q "id"; then
    echo "✓ Successfully uploaded $FILE_NAME to Gitee Release $TAG"
else
    echo "✗ Upload failed"
    echo "Response: $UPLOAD_RESPONSE"
    exit 1
fi
