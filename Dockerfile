ARG NODE_VERSION=8.9.1
FROM node:${NODE_VERSION}

# Add our user and group first to make sure their IDs get assigned consistently,
# regardless of whatever dependencies get added.
RUN groupadd --system nightmare && useradd --system --create-home --gid nightmare nightmare

# Installing the pre-required packages and libraries for electron & Nightmare
RUN apt-get update && \
      apt-get install -y libgtk2.0-0 libgconf-2-4 \
      libasound2 libxtst6 libxss1 libnss3 xvfb

# Install latest chrome dev package.
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

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
