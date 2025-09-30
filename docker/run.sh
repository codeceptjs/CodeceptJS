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

	# Setup node_modules with ESM-compatible codeceptjs
	setup_node_modules() {
		local dir="$1"
		local node_modules="$dir/node_modules"
		local codecept_module="$node_modules/codeceptjs"

		mkdir -p "$codecept_module"

		cat > "$codecept_module/package.json" << 'EOF'
{
  "name": "codeceptjs",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./effects": "./effects.js"
  },
  "main": "./index.js"
}
EOF

		ln -sf /codecept/lib/index.js "$codecept_module/index.js"
		ln -sf /codecept/lib/effects.js "$codecept_module/effects.js"

		for dep_dir in /codecept/node_modules/*; do
			dep_name=$(basename "$dep_dir")
			if [ "$dep_name" != "codeceptjs" ] && [ ! -e "$node_modules/$dep_name" ]; then
				ln -sf "$dep_dir" "$node_modules/$dep_name" 2>/dev/null || true
			fi
		done
	}

	# Find codecept config in current directory
	config_file=$(find . -maxdepth 2 -name "codecept.conf.*" -type f | head -1)

	if [ -n "$config_file" ]; then
		config_dir=$(dirname "$config_file")
		ensure_esm_package "$config_dir"
		setup_node_modules "$config_dir"
	else
		ensure_esm_package "$(pwd)"
		setup_node_modules "$(pwd)"
	fi

	# Also setup node_modules in any subdirectories that might contain test files
	for test_dir in acceptance test tests; do
		if [ -d "$test_dir" ]; then
			setup_node_modules "$test_dir"
		fi
	done

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
