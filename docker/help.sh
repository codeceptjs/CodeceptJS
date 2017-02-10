#!/usr/bin/env bash

###
# This script contains appropriate functions to display help messages to the user.
###

# Displays the usage for mounting tests into the docker container.
# This is called when an incorrect volume is mounted.
function display_usage {
	echo "Codeceptjs Tests could not be found"
	echo " "
	echo "Please make sure you're mounting your codeceptjs directory correctly."
	echo "    Usage: -v /path_to_codeceptjs_dir/:/tests/ "
	echo " "
	exit 1
}