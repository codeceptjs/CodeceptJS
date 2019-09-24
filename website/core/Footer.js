/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    const docsUrl = this.props.config.docsUrl;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    return `${baseUrl}${docsPart}${langPart}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : '') + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href="/quickstart">
              QuickStart
            </a>
            <a href="/basics">
              Guides
            </a>
            <a href="/reference">
              Reference
            </a>
          </div>
          <div>
            <h5>Community</h5>
            <a href="https://join.slack.com/t/codeceptjs/shared_invite/enQtMzA5OTM4NDM2MzA4LWE4MThhN2NmYTgxNTU5MTc4YzAyYWMwY2JkMmZlYWI5MWQ2MDM5MmRmYzZmYmNiNmY5NTAzM2EwMGIwOTNhOGQ">
              Slack Chat
            </a>
            <a
              href="https://codecept.discourse.group"
              target="_blank"
              rel="noreferrer noopener">
              Community Forum
            </a>

            <a
              href="http://stackoverflow.com/questions/tagged/codeceptjs"
              target="_blank"
              rel="noreferrer noopener">
              Stack Overflow
            </a>
            <a
              href="https://twitter.com/codeceptjs"
              target="_blank"
              rel="noreferrer noopener">
              Twitter
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href="https://github.com/Codeception/CodeceptJS">GitHub</a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/codeception/codeceptjs/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub">
              Star
            </a>
            <a href="http://sdclabs.com/codeceptjs?utm_source=codecept.io&utm_medium=footer&utm_term=link&utm_campaign=reference">Commercial Support</a>
            <a href="http://sdclabs.com/trainings/web-automation-codeceptjs?utm_source=codecept.io&utm_medium=top_menu&utm_term=link&utm_campaign=reference">Trainings</a>

          </div>
        </section>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
