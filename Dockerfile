# Download Playwright and its dependencies
FROM mcr.microsoft.com/playwright:v1.55.0-noble

# Set non-interactive mode for apt operations
ENV DEBIAN_FRONTEND=noninteractive

# Update and install required dependencies in a single step to reduce layers
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk2.0-0 libxtst6 libxss1 libnss3 xvfb \
    && rm -rf /var/lib/apt/lists/*

# Ensure the pptruser exists, otherwise add it for better security
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

# Copy project files to Docker image
COPY . /codecept

# Set the working directory and install npm dependencies
WORKDIR /codecept
RUN npm install --loglevel=warn

# Set ownership for files to pptruser
RUN chown -R pptruser:pptruser /codecept

# Create symbolic link for CodeceptJS binary
RUN ln -s /codecept/bin/codecept.js /usr/local/bin/codeceptjs

# Create a directory for tests and set as the working directory
RUN mkdir -p /tests
WORKDIR /tests

# Set required environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV CODECEPT_ARGS=""
ENV RUN_MULTIPLE=false
ENV NO_OF_WORKERS=""

# Set Selenium and Docker configurations
ENV HOST=selenium
ENV CODECEPT_DOCKER=1

# Uncomment the following line to use a non-root user for better security
USER pptruser

# Set the entrypoint script and default CMD
ENTRYPOINT ["/codecept/docker/entrypoint"]
CMD ["bash", "/codecept/docker/run.sh"]