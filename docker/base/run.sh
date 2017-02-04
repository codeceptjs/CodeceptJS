#!/usr/bin/env bash

source /scripts/help.sh

# Check if tests are correctly mounted
if [[ -d "/tests/" ]]; then
		echo "Codeceptjs directory has been found."

		# Run the tests
		codeceptjs run /tests/ $GREP
	else
		display_usage
fi