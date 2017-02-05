#!/usr/bin/env bash

source /docker/help.sh

# Check if tests are correctly mounted
if [[ -d "/tests/" ]]; then
		echo "CodeceptJS directory has been found."

		# Run the tests
		node bin/codecept.js run /tests/ $GREP
	else
		display_usage
fi