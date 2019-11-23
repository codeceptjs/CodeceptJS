#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  stopOnFail, chdir, git, copy, exec, replaceInFile, npmRun, npx, writeToFile, runio,
} = require('runio.js');

stopOnFail();

module.exports = {
  async docs() {
    // generate all docs (runs all docs:* commands in parallel)
    await Promise.all([
      this.docsHelpers(),
      this.docsPlugins(),
      this.docsExternalHelpers(),
    ]);
  },

  async docsPlugins() {
    // generate documentation for plugins
    await npx('documentation build lib/plugin/*.js -o docs/plugins.md -f md --shallow --markdown-toc=false --sort-order=alpha');
    await replaceInFile('docs/plugins.md', (cfg) => {
      cfg.replace(/^/, '---\nid: plugins\ntitle: Plugins\n---\n\n');
    });
  },

  async docsExternalHelpers() {
    // generate documentation for helpers outside of main repo
    console.log('Building @codecepjs/detox helper docs');
    const helper = 'Detox';
    await npx(`documentation build node_modules/@codeceptjs/detox-helper/${helper}.js -o docs/helpers/${helper}.md -f md --shallow --markdown-toc=false --sort-order=alpha `);
    await writeToFile(`docs/helpers/${helper}.md`, (cfg) => {
      cfg.line(`---\nid: ${helper}\ntitle: ${helper}\n---\n\n`);
      cfg.textFromFile(`docs/helpers/${helper}.md`);
    });
  },

  async docsHelpers() {
    // generate documentation for helpers
    const files = fs.readdirSync('lib/helper').filter(f => path.extname(f) === '.js');

    const partials = fs.readdirSync('docs/webapi').filter(f => path.extname(f) === '.mustache');
    const placeholders = partials.map(file => `{{> ${path.basename(file, '.mustache')} }}`);
    const templates = partials
      .map(file => fs.readFileSync(`docs/webapi/${file}`).toString())
      .map(template => template.replace(/^/m, '\n   * '));

    const sharedPartials = fs.readdirSync('docs/shared').filter(f => path.extname(f) === '.mustache');
    const sharedPlaceholders = sharedPartials.map(file => `{{ ${path.basename(file, '.mustache')} }}`);
    const sharedTemplates = sharedPartials
      .map(file => fs.readFileSync(`docs/shared/${file}`).toString())
      .map(template => `\n\n\n${template}`);

    for (const file of files) {
      const name = path.basename(file, '.js');
      console.log(`Writing documentation for ${name}`);
      copy(`lib/helper/${file}`, `docs/build/${file}`);
      replaceInFile(`docs/build/${file}`, (cfg) => {
        for (const i in placeholders) {
          cfg.replace(placeholders[i], templates[i]);
        }
      });
      await npx(`documentation build docs/build/${file} -o docs/helpers/${name}.md -f md --shallow --markdown-toc=false --sort-order=alpha`);
      replaceInFile(`docs/helpers/${name}.md`, (cfg) => {
        cfg.replace(/\(optional, default.*?\)/gm, '');
        cfg.replace(/\\*/gm, '');
      });

      replaceInFile(`docs/helpers/${name}.md`, (cfg) => {
        for (const i in sharedPlaceholders) {
          cfg.replace(sharedPlaceholders[i], sharedTemplates[i]);
        }
      });

      await writeToFile(`docs/helpers/${name}.md`, (cfg) => {
        cfg.append(`---\nid: ${name}\ntitle: ${name}\n---\n\n`);
        cfg.textFromFile(`docs/helpers/${name}.md`);
      });
    }
  },

  async wiki() {
    // publish wiki pages to website
    if (!fs.existsSync('website/wiki/Home.md')) {
      await git((fn) => {
        fn.cloneShallow('git@github.com:Codeception/CodeceptJS.wiki.git', 'website/wiki');
      });
    }
    await chdir('website/wiki', () => git(cfg => cfg.pull('origin master')));

    await writeToFile('docs/community-helpers.md', (cfg) => {
      cfg.line('---');
      cfg.line('id: community-helpers');
      cfg.line('title: Community Helpers');
      cfg.line('---');
      cfg.line('');
      cfg.line('> Share your helpers at our [Wiki Page](https://github.com/Codeception/CodeceptJS/wiki/Community-Helpers)');
      cfg.line('');
      cfg.textFromFile('website/wiki/Community-Helpers.md');
    });

    writeToFile('docs/examples.md', (cfg) => {
      cfg.line('---');
      cfg.line('id: examples');
      cfg.line('title: Examples');
      cfg.line('---');
      cfg.line('');
      cfg.line('> Add your own examples to our [Wiki Page](https://github.com/Codeception/CodeceptJS/wiki/Examples)');
      cfg.textFromFile('website/wiki/Examples.md');
    });

    writeToFile('docs/books.md', (cfg) => {
      cfg.line('---');
      cfg.line('id: books');
      cfg.line('title: Books & Posts');
      cfg.line('---');
      cfg.line('');
      cfg.line('> Add your own books or posts to our [Wiki Page](https://github.com/Codeception/CodeceptJS/wiki/Books-&-Posts)');
      cfg.textFromFile('website/wiki/Books-&-Posts.md');
    });

    writeToFile('docs/videos.md', (cfg) => {
      cfg.line('---');
      cfg.line('id: videos');
      cfg.line('title: Videos');
      cfg.line('---');
      cfg.line('');
      cfg.line('> Add your own videos to our [Wiki Page](https://github.com/Codeception/CodeceptJS/wiki/Videos)');
      cfg.textFromFile('website/wiki/Videos.md');
    });
  },

  async publishSite(user = 'davertmik') {
    // updates codecept.io website
    await processChangelog();
    copy('docker/README.md', 'docs/docker.md');
    await this.wiki();
    await chdir('website', async () => {
      await exec('npm install');
      await npmRun('publish-gh-pages', (cfg) => {
        cfg.env('USE_SSH', 'true');
        cfg.env('GIT_USER', process.env.GIT_USER || user);
      });
    });
  },


  async server() {
    // run test server. Warning! PHP required!
    await Promise.all([
      exec('php -S 127.0.0.1:8000 -t test/data/app'),
      npmRun('json-server'),
    ]);
  },

  async release(releaseType = null) {
    // Releases CodeceptJS. You can pass in argument "patch", "minor", "major" to update package.json
    if (releaseType) {
      const packageInfo = JSON.parse(fs.readFileSync('package.json'));
      packageInfo.version = semver.inc(packageInfo.version, releaseType);
      fs.writeFileSync('package.json', JSON.stringify(packageInfo));
      await git((cmd) => {
        cmd.add('package.json');
        cmd.commit('version bump');
      });
    }
    // // publish a new release on npm. Update version in package.json!
    const packageInfo = JSON.parse(fs.readFileSync('package.json'));
    const version = packageInfo.version;
    await this.docs();
    await this.publishSite();
    await git((cmd) => {
      cmd.tag(version);
      cmd.push('origin master --tags');
    });
    await exec('npm publish');
    console.log('-- RELEASED --');
  },

};

async function processChangelog() {
  const file = 'CHANGELOG.md';
  let changelog = fs.readFileSync(file).toString();

  // user
  changelog = changelog.replace(/\s@([\w-]+)/mg, ' **[$1](https://github.com/$1)**');

  // issue
  changelog = changelog.replace(/#(\d+)/mg, '[#$1](https://github.com/Codeception/CodeceptJS/issues/$1)');

  // helper
  changelog = changelog.replace(/\s\[(\w+)\]\s/mg, ' **[$1]** ');

  writeToFile('docs/changelog.md', (cfg) => {
    cfg.line('---');
    cfg.line('id: changelog');
    cfg.line('title: Releases');
    cfg.line('---');
    cfg.line('');
    cfg.line(changelog);
  });
}

if (require.main === module) runio(module.exports);
