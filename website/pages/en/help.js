/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

function Help(props) {
  const {config: siteConfig, language = ''} = props;
  const {baseUrl, docsUrl} = siteConfig;
  const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
  const langPart = `${language ? `${language}/` : ''}`;
  const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

  const forumUrl = 'https://codecept.discourse.group';
  const slackUrl = 'https://join.slack.com/t/codeceptjs/shared_invite/enQtMzA5OTM4NDM2MzA4LWE4MThhN2NmYTgxNTU5MTc4YzAyYWMwY2JkMmZlYWI5MWQ2MDM5MmRmYzZmYmNiNmY5NTAzM2EwMGIwOTNhOGQ';
  const commercialSupport = 'http://sdclabs.com/codeceptjs?utm_source=codecept.io&utm_medium=top_2&utm_term=link&utm_campaign=reference';
  const issues = 'https://github.com/Codeception/CodeceptJS/issues';

  const supportLinks = [
    {
      content: `Ask questions on our [community forum](${forumUrl}) powered by Discourse.
        If you want to report some bugs or ask for a feature, use [GitHub Issues](https://github.com/Codeception/CodeceptJS/issues).
        Also please read the source code and contribute back!`,
      title: 'Discussion Board',
    },
    {
      content: `[Do you want to chat? Come to us!](${slackUrl}) Please be polite, try not just to ask but to help others`,
      title: 'Join our Slack',
    },
    {
      content: `We offer commerical support by [SDCLabs](http://sdclabs.com). [Contact us](http://sdclabs.com/codeceptjs?utm_source=codecept.io&utm_medium=top_2&utm_term=link&utm_campaign=reference) to order trainings or consulting. We can also offer dedicated test engineers to create your tests from ground up!`,
      title: 'Commerical Support',
    },
  ];

  return (
    <div className="docMainWrapper wrapper">
      <Container className="mainContainer documentContainer postContainer">
        <div className="post">
          <header className="postHeader">
            <h1>Support</h1>
          </header>
          <GridBlock contents={supportLinks} layout="threeColumn" />
        </div>
      </Container>
    </div>
  );
}

module.exports = Help;
