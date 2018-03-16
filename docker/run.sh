#!/usr/bin/env bash

source /codecept/docker/help.sh

# Check if tests are correctly mounted
if [[ -d "/tests/" ]]; then
		echo "CodeceptJS directory has been found."

		# Run the tests
		cd /tests/
		codeceptjs run $CODECEPT_ARGS
	else
		display_usage
fi
