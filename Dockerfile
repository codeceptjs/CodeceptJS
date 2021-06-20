# Download Playwright and its dependencies
FROM mcr.microsoft.com/playwright:bionic

# Add our user and group first to make sure their IDs get assigned consistently,
# regardless of whatever dependencies get added.
RUN groupadd --system nightmare && useradd --system --create-home --gid nightmare nightmare

# Installing the pre-required packages and libraries for electron & Nightmare
RUN apt-get update && \
      apt-get install -y libgtk2.0-0 libgconf-2-4 \
      libasound2 libxtst6 libxss1 libnss3 xvfb

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

# Set the entrypoint for Nightmare
ENTRYPOINT ["/codecept/docker/entrypoint"]

# Run tests
CMD ["bash", "/codecept/docker/run.sh"]
