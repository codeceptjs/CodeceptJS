ARG NODE_VERSION=6.9.5
FROM node:${NODE_VERSION}

# Add our user and group first to make sure their IDs get assigned consistently,
# regardless of whatever dependencies get added.
RUN groupadd --system nightmare && useradd --system --create-home --gid nightmare nightmare

# Installing the pre-required packages and libraries for electron & Nightmare
RUN apt-get update && \
      apt-get install -y libgtk2.0-0 libgconf-2-4 \
      libasound2 libxtst6 libxss1 libnss3 xvfb

COPY package.json /

# Install latest version of Nightmare
RUN npm install

COPY . /

# Allow to pass argument to codecept run via env variable
ENV CODECEPT_ARGS=""

# Set HOST ENV variable for Selenium Server
ENV HOST=selenium

# Set the entrypoint for Nightmare
ENTRYPOINT ["/docker/entrypoint"]

# Run tests
CMD ["bash", "/docker/run.sh"]
