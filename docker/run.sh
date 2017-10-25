#!/usr/bin/env bash

source docker/help.sh

# Check if tests are correctly mounted
if [[ -d "/tests/" ]]; then
		echo "CodeceptJS directory has been found."

		# Run the tests
		cd /tests/
		node /codecept/bin/codecept.js run $CODECEPT_ARGS
	else
		display_usage
fi
