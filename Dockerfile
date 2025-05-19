# Use a specific Playwright base image for reproducibility
FROM mcr.microsoft.com/playwright:v1.52.0-noble
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set non-root user early for security
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads /codecept /tests \
    && chown -R pptruser:pptruser /home/pptruser /codecept /tests

# Install dependencies and set up Google Chrome repository
RUN apt-get update --allow-releaseinfo-change && apt-get install -y --no-install-recommends \
    libgtk2.0-0 \
    libxtst6 \
    libxss1 \
    libnss3 \
    xvfb \
    gnupg \
    wget \
    ca-certificates \
    fonts-noto \
    fonts-freefont-ttf \
    && wget --quiet -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . /codecept

# Set working directory
WORKDIR /tests

# Install Node.js dependencies as non-root user
RUN runuser -u pptruser -- npm install --loglevel=warn --prefix /codecept
RUN runuser -u pptruser -- npm install puppeteer@$(npm view puppeteer version)
RUN runuser -u pptruser -- npx puppeteer browsers install chrome
RUN runuser -u pptruser -- npx playwright install
RUN ln -s /codecept/bin/codecept.js /usr/local/bin/codeceptjs

# Verify Chrome installation
RUN google-chrome --version

# Environment variables
ENV CODECEPT_ARGS=""
ENV RUN_MULTIPLE=false
ENV NO_OF_WORKERS=""
ENV HOST=selenium
ENV NODE_ENV=production

# Switch to non-root user
USER pptruser

# Set entrypoint and command
ENTRYPOINT ["/codecept/docker/entrypoint"]
CMD ["bash", "/codecept/docker/run.sh"]
