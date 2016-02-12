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
        $this->taskGitStack()
            ->checkout('site')
            ->merge('master')
            ->run();
        $this->_copy('CHANGELOG.md', 'docs/changelog.md');        
        $this->_exec('mkdocs gh-deploy');
        $this->_remove('docs/changelog.md');            
        $this->taskGitStack()
            ->checkout('master')
            ->run();
    }
    
    function testServer() 
    {
        $this->taskServer(8000)
            ->dir('test/data/app')
            ->run();
    }
    
    function release() 
    {
        $this->stopOnFail();
        $this->docs();          
        $this->publishSite();
        $this->_exec('npm publish');
        $this->yell('It is released!');  
    }
}