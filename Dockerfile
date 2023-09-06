# Download Playwright and its dependencies
FROM mcr.microsoft.com/playwright:v1.35.1

# Installing the pre-required packages and libraries
RUN apt-get update && \
      apt-get install -y libgtk2.0-0 libgconf-2-4 \
      libasound2 libxtst6 libxss1 libnss3 xvfb


# Install Chromedriver latest version
RUN apt-get update && \
    apt-get install lsb-release libappindicator3-1 \
    && curl -L -o google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && dpkg -i google-chrome.deb \
    && sed -i 's|HERE/chrome"|HERE/chrome" --no-sandbox|g' /opt/google/chrome/google-chrome \
    && rm google-chrome.deb \

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
