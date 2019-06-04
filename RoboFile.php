<?php
/**
 * This is project's console commands configuration for Robo task runner.
 *
 * @see http://robo.li/
 */
class RoboFile extends \Robo\Tasks
{

    function docs()
    {
        $files = scandir('lib/helper');

        $partials = array_slice(scandir('docs/webapi'), 2);
        $placeholders = array_map(function($p) { $p = str_replace('.mustache', '', $p); return "{{> $p }}"; }, $partials);
        $templates = array_map(function($p) { return trim(substr(preg_replace('~^~m', "   * " , file_get_contents("docs/webapi/$p")), 5)) . "\n   * {--end--}"; }, $partials);

        print_r($templates);

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
                ->line('-----')
                ->line("id: {$info['filename']}")
                ->line("title: {$info['filename']}")
                ->line('----')
                ->line('')
                ->textFromFile("docs/helpers/{$info['filename']}.md")
                ->run();
        }
    }

    function publishSite()
    {
        $this->stopOnFail();
        $this->_copy('CHANGELOG.md', 'docs/changelog.md');
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