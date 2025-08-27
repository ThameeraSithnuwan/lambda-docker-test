#!/bin/bash
set -e

REPO_URL=$1
LIQUIBASE_PATH=$2
ENV_VARS_JSON=$3
EXEC_CMD=$4
WORKDIR=$5
COMMIT_ID=$6

echo "=== Deploy Script Started ==="
echo "Cloning from: $REPO_URL"

# Clone repo
git clone "$REPO_URL" "$WORKDIR/repo"

# Checkout specific commit if provided
if [ -n "$COMMIT_ID" ]; then
  echo "Checking out commit: $COMMIT_ID"
  cd "$WORKDIR/repo"
  git checkout "$COMMIT_ID"
fi

# Navigate to liquibase path
cd "$WORKDIR/repo/$LIQUIBASE_PATH"

# Write env vars to file
ENV_FILE="$WORKDIR/liquibase_env.sh"
echo "#!/bin/bash" > $ENV_FILE
echo "$ENV_VARS_JSON" | jq -r 'to_entries | .[] | "export \(.key)=\(.value)"' >> $ENV_FILE
chmod +x $ENV_FILE

# Source env vars and run command
echo "Running Liquibase command: $EXEC_CMD"
bash -c "source $ENV_FILE && $EXEC_CMD"

# Clean up temporary repo
rm -rf "$WORKDIR/repo"
rm -f "$ENV_FILE"

echo "=== Deploy Script Completed ==="
