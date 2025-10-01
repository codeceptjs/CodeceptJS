#!/usr/bin/env bash

source /codecept/docker/help.sh

# Check if tests are correctly mounted
if [[ -d "/tests/" ]]; then
        echo "CodeceptJS directory has been found."

	# Set up module resolution
	export NODE_PATH=/codecept/lib:$NODE_PATH

	# Ensure ESM package.json exists in test directory
	ensure_esm_package() {
		local dir="$1"
		if [ ! -f "$dir/package.json" ]; then
			echo "Creating package.json with ESM in $dir"
			cat > "$dir/package.json" << EOF
{
  "type": "module"
}
EOF
		elif ! grep -q '"type".*"module"' "$dir/package.json"; then
			echo "Warning: $dir/package.json exists but may not have type: module"
		fi
	}

	# Ensure /tests/node_modules links to /codecept/node_modules
	if [ -L "/tests/node_modules" ]; then
		# Already a symlink, good
		:
	elif [ -d "/tests/node_modules" ]; then
		# Directory exists, remove it and create symlink
		rm -rf /tests/node_modules
		ln -sf /codecept/node_modules /tests/node_modules
	else
		# Doesn't exist, create symlink
		ln -sf /codecept/node_modules /tests/node_modules
	fi

	# Ensure /codecept/node_modules/codeceptjs is a symlink to /codecept
	# This allows require('codeceptjs') from CJS modules to work
	if [ -d "/codecept/node_modules/codeceptjs" ] && [ ! -L "/codecept/node_modules/codeceptjs" ]; then
		rm -rf /codecept/node_modules/codeceptjs
		ln -sf /codecept /codecept/node_modules/codeceptjs
	elif [ ! -e "/codecept/node_modules/codeceptjs" ]; then
		ln -sf /codecept /codecept/node_modules/codeceptjs
	fi

	# Find codecept config in current directory
	config_file=$(find . -maxdepth 2 -name "codecept.conf.*" -type f | head -1)

	if [ -n "$config_file" ]; then
		config_dir=$(dirname "$config_file")
		ensure_esm_package "$config_dir"
	else
		ensure_esm_package "$(pwd)"
	fi

	# Run the tests
	cd /tests/ || exit
	if [ "$RUN_MULTIPLE" = true ]; then
		echo "Tests are split into chunks and executed in multiple processes."
		if [ ! "$CODECEPT_ARGS" ]; then
			echo "No CODECEPT_ARGS provided. Tests will proceed with --all option to run all configured runs"
			codeceptjs run-multiple --all
		else
			codeceptjs run-multiple $CODECEPT_ARGS
		fi
	else
		if [ ! "$NO_OF_WORKERS" ]; then
			codeceptjs run $CODECEPT_ARGS
		else
			codeceptjs run-workers $NO_OF_WORKERS $CODECEPT_ARGS
		fi
	fi
else
	display_usage
fi
