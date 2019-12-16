module.exports = {
  title: 'CodeceptJS', // Title for your website.
  description: 'SuperCharged End 2 End Testing with WebDriver & Puppeteer',
  head: [
    ['link', { rel: 'icon', href: '/favicon/favicon.png' }],
  ],

  themeConfig: {
    lastUpdated: 'Last Updated',
    docsRepo: 'codeception/codeceptjs',
    // if your docs are not at the root of the repo:
    docsDir: 'docs',
    // if your docs are in a specific branch (defaults to 'master'):
    docsBranch: 'master',
    // defaults to false, set to true to enable
    editLinks: true,
    // custom text for edit link. Defaults to "Edit this page"
    editLinkText: 'Help us improve this page!',
    logo: '/logo.svg',
    searchPlaceholder: 'Search...',
    algolia: {
      apiKey: '0cc13a0af567a05fc38790be681b1491',
      indexName: 'codecept'
    },

    nav: [
      {
        text: 'Quickstart',
        link: '/quickstart',
      },

      {
      text: "Guides",
      items: [
        {
          group: "Basics",
          items: [
            { text: "Getting Started", link: '/basics' },
          ]
        },
        {
          group: "Helpers",
          items: [
            { text: "Using WebDriver", link: '/webdriver' },
            { text: "Using Puppeteer", link: '/puppeteer' },
            { text: "Using TestCafe", link: '/testcafe' },
            { text: "Mobile Testing", link: '/mobile' },
          ]
        },
        {
          group: "Other",
          items: [
            { text: "Locators", link: "/locators" },
            { text: "Page Objects", link: "/pageobjects" },
            { text: "Behavior Driven Development", link: "/bdd" },
            { text: "Data Management", link: "/data" },
            { text: "Parallel Execution", link: "/parallel" },
            { text: "Reports", link: "/reports" },
          ]
        },
        {
          group: "Other",
          items: [
            { text: "Best Practices", link: "/best" },
            { text: "Advanced Usage", link: "/advanced" },
          ]
        },

        // {
        //   group: "Mobile Testing",
        //   text: 'Mobile Testing',
        //   items: [
        //     "mobile",
        //     "detox",
        //   ],
        // },
        // {
        //   group: "Organizing Tests",
        //   text: 'Organizing Tests',
        //   items: [
        //     { text: "best", link: "best" },
        //     { text: "locators", link: "locators" },
        //     { text: "pageobjects", link: "pageobjects" },
        //     { text: "helpers", link: "helpers" },
        //     { text: "bdd", link: "bdd" },
        //     { text: "data", link: "data" },
        //     { text: "parallel", link: "parallel" },
        //     { text: "reports", link: "reports" },
        //     { text: "advanced", link: "advanced" },
        //     { text: "hooks", link: "hooks" },
        //   ],
        // }
      ],
      // "Tutorials": [
      // { text: //   "books, link: //   "books" },
      // { text: //   "videos, link: //   "videos" },
      //   "examples"
      // ]
    },
    {
      text: "Helpers",
      items: [
        {
          group: "Web Testing",
          text: 'Web Testing',
          items: [
            { text: "WebDriver", link: "/helpers/WebDriver" },
            { text: "Puppeteer", link: "/helpers/Puppeteer" },
            { text: "Protractor", link: "/helpers/Protractor" },
            { text: "TestCafe", link: "/helpers/TestCafe" },
            { text: "Nightmare", link: "/helpers/Nightmare" },
          ]
        },
        {
          group: "Mobile Testing",
          text: 'Mobile Testing',
          items: [
            { text: "Appium", link: "/helpers/Appium" },
            { text: "Detox", link: "/helpers/Detox" },
          ]
        },
        {
          group: 'Data Helpers',
          text: 'API Helpers',
          items: [
            { text: "REST", link: "/helpers/REST" },
            { text: "ApiDataFactory", link: "/helpers/ApiDataFactory" },
            { text: "GraphQL", link: "/helpers/GraphQL" },
            { text: "GraphQLDataFactory", link: "/helpers/GraphQLDataFactory" },
            { text: "MockRequest", link: "/helpers/MockRequest" },
          ]
        },
        {
          group: 'other',
          items: [
            { text: "FileSystem", link: "/helpers/FileSystem" },
            { text: "Community Helpers", link: "/community-helpers" },
          ]
        },
      ]
    },
    {
      text: 'UI',
      link: '/ui',
    },
    {
      text: 'Plugins',
      link: '/plugins',
    },
    {
      text: "API",
      items: [
        { text: "Installation", link: "/installation" },
        { text: "Commands", link: "/commands" },
        { text: "Configuration", link: "/configuration" },
        { text: "Docker", link: "/docker" },
        { text: "Translation", link: "/translation" },
      ],
    },
    {
      text: 'Releases',
      link: '/changelog',
    },
    {
      text: "Community",
      items: [
        {
          group: 'links',
          items: [
            { text: "GitHub", link: "https://github.com/Codeception/CodeceptJS" },
            { text: "Slack Chat", link: "http://bit.ly/chat-codeceptjs" },
            { text: "Forum", link: "https://codecept.discourse.group/" },
            { text: "Twitter", link: "https://twitter.com/codeceptjs" },
            { text: "Stack Overflow", link: "https://stackoverflow.com/questions/tagged/codeceptjs" },
          ],
        },
        {
          group: 'commerce',
          items: [
            { text: "Commercial Support", link: "http://sdclabs.com/" },
            { text: "Trainings", link: "http://sdclabs.com/trainings/web-automation-codeceptjs?utm_source=codecept.io&utm_medium=top_menu&utm_term=link&utm_campaign=reference" },
          ]
        }
      ],
    },

    ],

    sidebar: {
      '/helpers/': [],
      '/': [
        {
          title: 'Web Testing',   // required
          sidebarDepth: 2,    // optional, defaults to 1
          collapsable: true,
          children: [
            "basics",
            'webdriver',
            'puppeteer',
            'testcafe',
            'angular',
            'nightmare',
          ]
        },
        {
          title: 'Mobile Testing',
          children: [
            "mobile",
            "detox",
          ]
        },
        {
          title: 'Organizing Tests',
          children: [
            "best",
            "locators",
            "pageobjects",
            "bdd",
            "data",
            "parallel",
            "reports",
            "continuous-integration",
          ]
        },
        {
          title: 'Advanced Usage',
          children: [
            "advanced",
            'visual',
            'email',
            'react',
            "hooks",
            "custom-helpers",
          ]
        },
      ]
    }
  },


  postcss: {

    plugins: [
      require("autoprefixer"),
      require("tailwindcss")("./tailwind.config.js")
    ]
  },

  plugins: {
    'sitemap': {
      hostname: 'https://codecept.io'
    }
  }
}
