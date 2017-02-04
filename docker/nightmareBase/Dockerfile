FROM 	codeceptjs/base

		# Add our user and group first to make sure their IDs get assigned consistently,
		# regardless of whatever dependencies get added.
RUN 	groupadd --system nightmare && useradd --system --create-home --gid nightmare nightmare

		# Installing the pre-required packages and libraries for electron & Nightmare
RUN 	apt-get update && \
    	apt-get install -y libgtk2.0-0 libgconf-2-4 \
    	libasound2 libxtst6 libxss1 libnss3 xvfb

    	# Install Nightmare
RUN		npm install -g nightmare segmentio/nightmare nightmare-upload

		# Copy accross the entrypoint
COPY	entrypoint /