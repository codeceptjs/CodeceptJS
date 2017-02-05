FROM 	node:6.9.1

		# Set grep as an ENV variable
ENV 	GREP=" "

		# Set HOST ENV variable for Selenium Server
ENV 	HOST=selenium

		# Create Dir for our scripts
RUN 	mkdir /scripts/

		# Copy across the scripts
COPY 	*.sh /scripts/

		# Add our user and group first to make sure their IDs get assigned consistently,
		# regardless of whatever dependencies get added.
RUN 	groupadd --system nightmare && useradd --system --create-home --gid nightmare nightmare

		# Installing the pre-required packages and libraries for electron & Nightmare
RUN 	apt-get update && \
    	apt-get install -y libgtk2.0-0 libgconf-2-4 \
    	libasound2 libxtst6 libxss1 libnss3 xvfb

		# Copy accross the entrypoint for Nightmare
COPY	entrypoint /

    	# Install latest version of Nightmare
RUN		npm install -g nightmare segmentio/nightmare nightmare-upload

		# Install latest version of WebDriverIO
RUN 	npm install -g webdriverio

		# Install latest version of Protractor
RUN 	npm install -g protractor

		# Install latest codeceptjs
RUN 	npm install -g codeceptjs

		# Set the entrypoint for Nightmare
ENTRYPOINT ["/entrypoint"]

		# Run tests
CMD 	["bash", "/scripts/run.sh"]

