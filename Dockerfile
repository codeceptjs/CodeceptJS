# Download Playwright and its dependencies
FROM mcr.microsoft.com/playwright:v1.35.1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Installing the pre-required packages and libraries
RUN apt-get update && \
      apt-get install -y libgtk2.0-0 libgconf-2-4 \
      libasound2 libxtst6 libxss1 libnss3 xvfb

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update && apt-get install -y gnupg wget && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
  apt-get update && \
  apt-get install -y google-chrome-stable --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*


# Add pptr user.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /home/pptruser

#RUN mkdir /home/codecept

COPY . /codecept

RUN chown -R pptruser:pptruser /codecept
RUN runuser -l pptruser -c 'npm install --legacy-peer-deps --loglevel=warn --prefix /codecept'

RUN ln -s /codecept/bin/codecept.js /usr/local/bin/codeceptjs
RUN mkdir /tests
WORKDIR /tests
# Install puppeteer so it's available in the container.
RUN npm i puppeteer

# Allow to pass argument to codecept run via env variable
ENV CODECEPT_ARGS=""
ENV RUN_MULTIPLE=false
ENV NO_OF_WORKERS=""

# Set HOST ENV variable for Selenium Server
ENV HOST=selenium

# Run user as non privileged.
# USER pptruser

# Set the entrypoint
ENTRYPOINT ["/codecept/docker/entrypoint"]

# Run tests
CMD ["bash", "/codecept/docker/run.sh"]
