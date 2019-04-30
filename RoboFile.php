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
        $this->taskGulpRun('docs')
          ->run();
        $this->taskGitStack()
          ->add('docs')
          ->commit('updated docs')
          ->run();
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