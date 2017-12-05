ARG NODE_VERSION=8.9.1
FROM node:${NODE_VERSION}

# Add our user and group first to make sure their IDs get assigned consistently,
# regardless of whatever dependencies get added.
RUN groupadd --system nightmare && useradd --system --create-home --gid nightmare nightmare

# Installing the pre-required packages and libraries for electron & Nightmare
RUN apt-get update && \
      apt-get install -y libgtk2.0-0 libgconf-2-4 \
      libasound2 libxtst6 libxss1 libnss3 xvfb

WORKDIR /tmp
COPY package.json /tmp/

# Install packages
RUN npm install --loglevel=warn

RUN mkdir /codecept
WORKDIR /codecept

COPY . /codecept

RUN cp -a /tmp/node_modules /codecept/

# Allow to pass argument to codecept run via env variable
ENV CODECEPT_ARGS=""

# Set HOST ENV variable for Selenium Server
ENV HOST=selenium

# Set the entrypoint for Nightmare
ENTRYPOINT ["docker/entrypoint"]

# Run tests
CMD ["bash", "docker/run.sh"]
