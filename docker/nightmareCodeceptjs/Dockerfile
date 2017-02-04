FROM 	codeceptjs/nightmare-base

		# Install latest codeceptjs
RUN 	npm install -g codeceptjs

		# Set the entrypoint for Nightmare
ENTRYPOINT ["/entrypoint"]

		# Run tests
CMD 	["bash", "/scripts/run.sh"]