#!/usr/bin/env bash

source /codecept/docker/help.sh

# Check if tests are correctly mounted
if [[ -d "/tests/" ]]; then
		echo "CodeceptJS directory has been found."

		# Run the tests
		cd /tests/
		if [ "$RUN_MULTIPLE" = true ]; then
			echo "Tests are split into chunks and executed in multiple processes."
			if [ ! "$CODECEPT_ARGS" ]; then
				echo "No CODECEPT_ARGS provided. Tests will procceed with --all option to run all configured runs"
				codeceptjs run-multiple --all
			else		
				codeceptjs run-multiple $CODECEPT_ARGS
			fi
		else if [ "$NO_OF_WORKERS" > 0 ]; then
			codeceptjs run-workers $NO_OF_WORKERS
		else
			codeceptjs run $CODECEPT_ARGS
		fi
	else
		display_usage
fi
