/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

// List of projects/orgs using your project for the users page.
const users = [
  {
    // caption: 'User1',
    // // You will need to prepend the image path with your baseUrl
    // // if it is not '/', like: '/test-site/img/docusaurus.svg'.
    // image: '/img/docusaurus.svg',
    // infoLink: 'https://www.facebook.com',
    // pinned: true,
  },
];

const siteConfig = {
  title: 'CodeceptJS', // Title for your website.
  tagline: 'Modern End 2 End Testing Framework for NodeJS',
  url: 'https://codecept.io', // Your website URL
  baseUrl: '/', // Base URL for your project */
  // For github.io type URLs, you would set the url and baseUrl like:
  //   url: 'https://facebook.github.io',
  //   baseUrl: '/test-site/',

  docsUrl: '',

  cname: 'codecept.io',
  // Used for publishing and more
  projectName: 'codeceptjs',
  organizationName: 'codeception',
  // For top-level user or org sites, the organization is still the same.
  // e.g., for the https://JoelMarcey.github.io site, it would be set like...
  //   organizationName: 'JoelMarcey'

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    {doc: 'quickstart', label: 'Quickstart'},
    {doc: 'basics', label: 'Guides'},
    {page: 'reference', label: 'Reference'},
    {page: 'changelog', label: 'Releases'},
    {page: 'help', label: 'Support'},
    { href: 'https://codecept.discourse.group', label: 'Forum' },

    // {doc: 'changelog', label: 'Reference'},
    // {blog: true, label: 'Blog'},
  ],

  // If you have users set above, you add it here:
  // users,

  /* path to images for header/footer */
  headerIcon: 'img/logo.svg',
  footerIcon: 'img/logo.svg',
  favicon: 'img/favicon/favicon.png',
  editUrl: 'https://github.com/Codeception/CodeceptJS/blob/master/docs/',

  /* Colors for website */
  colors: {
    primaryColor: '#7B1FA2',
    secondaryColor: '#7B1FA2',
  },

  fonts: {
    main: [
      "IBM Plex Sans",
      "Sans",
      "system-ui"
    ],
    // heading: [
    //   "Fira Sans",
    //   "sans-serif",
    //   "system-ui"
    // ]
  },


  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} CodeceptJS`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: 'atom-one-dark',

    defaultLang: 'javascript',

    hljs: function(hljs) {
      // do something here
      var js = hljs.getLanguage('javascript');
      js.keywords.keyword += ' Scenario Feature Before After BeforeSuite AfterSuite';
      js.keywords.built_in += ' I pause within session';
      hljs.registerLanguage('javascript', function() {
        return js;
      });
    },

  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js'],

  // <link href="https://fonts.googleapis.com/css?family=Fira+Sans" rel="stylesheet">

  stylesheets: [
    'https://fonts.googleapis.com/css?family=IBM+Plex+Sans',
    'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css'
    // {
    //   href: 'http://css.link',
    //   type: 'text/css',
    // },
  ],

  // On page navigation for the current documentation page.
  onPageNav: 'separate',
  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  // ogImage: 'img/docusaurus.png',
  // twitterImage: 'img/docusaurus.png',

  algolia: {
    apiKey: '0cc13a0af567a05fc38790be681b1491',
    indexName: 'codecept',
    algoliaOptions: {} // Optional, if provided by Algolia
  },

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  enableUpdateTime: true,

  wrapPagesHTML: true
  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  //   repoUrl: 'https://github.com/facebook/test-site',
};

module.exports = siteConfig;
