# Download Playwright and its dependencies
FROM mcr.microsoft.com/playwright:v1.48.1-noble
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

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


# Add pptr user.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /home/pptruser

#RUN mkdir /home/codecept

COPY . /codecept

RUN chown -R pptruser:pptruser /codecept
# Set environment variables to skip browser downloads during npm install
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Install as root to ensure proper bin links are created
RUN cd /codecept && npm install --loglevel=warn
# Fix ownership after install
RUN chown -R pptruser:pptruser /codecept

RUN ln -s /codecept/bin/codecept.js /usr/local/bin/codeceptjs
RUN mkdir /tests
WORKDIR /tests
# Skip the redundant Puppeteer installation step since we're using Playwright browsers
# RUN npm i puppeteer@$(npm view puppeteer version) && npx puppeteer browsers install chrome
# RUN chromium-browser --version

# Skip the playwright browser installation step since base image already has browsers
# RUN npx playwright install

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
