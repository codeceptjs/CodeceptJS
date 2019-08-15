const pollyWebDriver = {
  setup(title) {
    const fetchUrls = [
      'https://cdn.jsdelivr.net/npm/@pollyjs/core@2.6.0/dist/umd/pollyjs-core.min.js',
      'https://cdn.jsdelivr.net/npm/@pollyjs/adapter-xhr@2/dist/umd/pollyjs-adapter-xhr.min.js',
    ];

    for (const url of fetchUrls) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      document.getElementsByTagName('head')[0].appendChild(script);
    }

    window.PollyJS = window['@pollyjs/core'];
    PollyJS.Polly.register(window['@pollyjs/adapter-xhr']);
    const polly = new PollyJS.Polly(title, {
      mode: 'passthrough',
      adapters: ['xhr'],
    });
  },
};

module.exports = pollyWebDriver;
