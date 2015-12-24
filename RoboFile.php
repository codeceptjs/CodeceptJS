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
    }
    
    function publishSite()
    {
        $this->stopOnFail();
        $this->_copy('CHANGELOG.md', 'docs/changelog.md');        
        $this->taskGitStack()
            ->checkout('site')
            ->merge('master')
            ->run();
        $this->_exec('mkdocs gh-deploy');
        $this->taskGitStack()
            ->checkout('master')
            ->run();
        $this->_remove('docs/changelog.md');            
    }
    
    function testServer() 
    {
        $this->taskServer(8000)
            ->dir('test/data/app')
            ->background()            
            ->run();
        $this->taskExec('selenium-standalone start')
          ->run();
    }
    
    function release() 
    {
        $this->stopOnFail();
        $this->docs();
        $this->publishSite();
        $this->_exec('npm release');
        $this->yell('It is released!');  
    }
}