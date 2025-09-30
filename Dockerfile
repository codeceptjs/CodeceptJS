# Download Playwright and its dependencies
FROM mcr.microsoft.com/playwright:v1.55.0-noble

RUN apt-get update --allow-releaseinfo-change

# Installing the pre-required packages and libraries
RUN apt-get update && \
      apt-get install -y libgtk2.0-0 \
      libxtst6 libxss1 libnss3 xvfb

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
# Skip Chrome installation for now as Playwright image already has browsers
RUN echo "Skipping Chrome installation - using Playwright browsers"

COPY . /codecept
WORKDIR /codecept
RUN npm install

RUN ln -s /codecept/bin/codecept.js /usr/local/bin/codeceptjs
RUN mkdir /tests
WORKDIR /tests
RUN npm init -y && npm pkg set type=module

# Allow to pass argument to codecept run via env variable
ENV CODECEPT_ARGS=""
ENV RUN_MULTIPLE=false
ENV NO_OF_WORKERS=""

# Set HOST ENV variable for Selenium Server
ENV HOST=selenium
ENV CODECEPT_DOCKER=1

# Set the entrypoint
ENTRYPOINT ["/codecept/docker/entrypoint"]

# Run tests
CMD ["bash", "/codecept/docker/run.sh"]
