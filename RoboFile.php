<?php
/**
 * This is project's console commands configuration for Robo task runner.
 *
 * @see http://robo.li/
 */
class RoboFile extends \Robo\Tasks
{

    function docs() {
        $this->docsHelpers();
        $this->docsPlugins();
    }

    function docsPlugins() {
        $this->_exec("npx documentation build lib/plugin/*.js -o docs/plugins.md -f md --shallow --markdown-toc=false --sort-order=alpha ");
        $this->taskWriteToFile("docs/plugins.md")
            ->line('---')
            ->line("id: plugins")
            ->line("title: Plugins")
            ->line('---')
            ->line('')
            ->textFromFile("docs/plugins.md")
            ->run();
    }

    function docsHelpers()
    {
        $files = scandir('lib/helper');

        $partials = array_slice(scandir('docs/webapi'), 2);
        $placeholders = array_map(function($p) { $p = str_replace('.mustache', '', $p); return "{{> $p }}"; }, $partials);
        $templates = array_map(function($p) { return trim(substr(preg_replace('~^~m', "   * " , file_get_contents("docs/webapi/$p")), 5)) . "\n   * {--end--}"; }, $partials);

        $sharedPartials = array_slice(scandir('docs/shared'), 2);
        $sharedPlaceholders = array_map(function($p) { $p = str_replace('.mustache', '', $p); return "{{ $p }}"; }, $sharedPartials);
        $sharedTemplates = array_map(function($p) { return "\n\n\n" . file_get_contents("docs/shared/$p"); }, $sharedPartials);


        foreach ($files as $file) {
            $info = pathinfo($file);
            if (!isset($info['extension'])) continue;
            if ($info['extension'] !== 'js') continue;

            $this->_copy("lib/helper/$file", "docs/build/$file");

            $this->taskReplaceInFile("docs/build/$file")
                ->from($placeholders)
                ->to($templates)
                ->run();

            $this->_exec("npx documentation build docs/build/{$info['basename']} -o docs/helpers/{$info['filename']}.md -f md --shallow --markdown-toc=false --sort-order=alpha ");

            // removing badly formatted documentation.js shit
            $this->taskReplaceInFile("docs/helpers/{$info['filename']}.md")
                ->regex(['{{--end--}}','~\(optional, default.*?\)~','~\\*~'])
                ->to(["\n",'',''])
                ->run();

            $this->taskReplaceInFile("docs/helpers/{$info['filename']}.md")
                ->from($sharedPlaceholders)
                ->to($sharedTemplates)
                ->run();

            $this->taskWriteToFile("docs/helpers/{$info['filename']}.md")
                ->line('---')
                ->line("id: {$info['filename']}")
                ->line("title: {$info['filename']}")
                ->line('---')
                ->line('')
                ->textFromFile("docs/helpers/{$info['filename']}.md")
                ->run();
        }

        $this->docsExternalHelpers();
    }


    function docsExternalHelpers()
    {

        $this->say('Building @codecepjs/detox helper docs');
        $helper = 'Detox';
        $this->_exec("npx documentation build node_modules/@codeceptjs/detox-helper/$helper.js -o docs/helpers/$helper.md -f md --shallow --markdown-toc=false --sort-order=alpha ");
        $this->taskWriteToFile("docs/helpers/$helper.md")
            ->line('---')
            ->line("id: $helper")
            ->line("title: $helper")
            ->line('---')
            ->line('')
            ->textFromFile("docs/helpers/$helper.md")
            ->run();
    }

    function publishSite()
    {
        $this->stopOnFail();
        $this->processChangelog();
        $this->_copy('docker/README.md', 'docs/docker.md');
        $this->wiki();
        $this->taskExec('npm install')
            ->dir('website')
            ->run();
        $this
            ->taskExec('USE_SSH=true GIT_USER=davertmik npm run publish-gh-pages')
            ->dir('website')
            ->run();
    }

    /**
     * Synchronizes CodeceptJS wiki pages with docs
     */
    function wiki()
    {
        if (!file_exists('website/wiki/Home.md')) {
            $this->taskGitStack()
                ->cloneShallow('git@github.com:Codeception/CodeceptJS.wiki.git', 'website/wiki')
                ->run();
        }

        $this->taskGitStack()
            ->dir('website/wiki')
            ->pull()
            ->run();

        $this->taskWriteToFile('docs/community-helpers.md')
            ->line('---')
            ->line('id: community-helpers')
            ->line('title: Community Helpers')
            ->line('---')
            ->line('')
            ->line('> Share your helpers at our [Wiki Page](https://github.com/Codeception/CodeceptJS/wiki/Community-Helpers)')
            ->line('')
            ->textFromFile('website/wiki/Community-Helpers.md')
            ->run();

        $this->taskWriteToFile('docs/examples.md')
            ->line('---')
            ->line('id: examples')
            ->line('title: Examples')
            ->line('---')
            ->line('')
            ->line('> Add your own examples to our [Wiki Page](https://github.com/Codeception/CodeceptJS/wiki/Examples)')
            ->textFromFile('website/wiki/Examples.md')
            ->run();

        $this->taskWriteToFile('docs/books.md')
            ->line('---')
            ->line('id: books')
            ->line('title: Books & Posts')
            ->line('---')
            ->line('')
            ->line('> Add your own books or posts to our [Wiki Page](https://github.com/Codeception/CodeceptJS/wiki/Books-&-Posts)')
            ->textFromFile('website/wiki/Books-&-Posts.md')
            ->run();

        $this->taskWriteToFile('docs/videos.md')
            ->line('---')
            ->line('id: videos')
            ->line('title: Videos')
            ->line('---')
            ->line('')
            ->line('> Add your own videos to our [Wiki Page](https://github.com/Codeception/CodeceptJS/wiki/Videos)')
            ->textFromFile('website/wiki/Videos.md')
            ->run();


    }

    protected function processChangelog()
    {
        $file = 'CHANGELOG.md';
        $changelog = file_get_contents($file);

        //user
        $changelog = preg_replace('~\s@([\w-]+)~', ' **[$1](https://github.com/$1)**', $changelog);

        //issue
        $changelog = preg_replace(
            '~#(\d+)~',
            '[#$1](https://github.com/Codeception/CodeceptJS/issues/$1)',
            $changelog
        );

        //helper
        $changelog = preg_replace('~\s\[(\w+)\]\s~', ' **[$1]** ', $changelog);

        $this->taskWriteToFile('docs/changelog.md')
            ->line('---')
            ->line('id: changelog')
            ->line('title: Releases')
            ->line('---')
            ->line('')
            ->line($changelog)
            ->run();
    }


    function testServer()
    {
        $this->taskExec('npm run json-server')
            ->background()
            ->run();

        $this->taskServer(8000)
            ->dir('test/data/app')
            ->run();
    }

    function release()
    {
        $package = json_decode(file_get_contents('package.json'), true);
        $version = $package['version'];
        $this->docs();
        $this->stopOnFail();
        $this->publishSite();
        $this->taskGitStack()
            ->tag($version)
            ->push('origin master --tags')
            ->run();

        $this->_exec('npm publish');
        $this->yell('It is released!');
    }
}
