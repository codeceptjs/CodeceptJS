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
        $this->taskGitStack()
            ->checkout('site')
            ->merge('master')
            ->run();
        $this->_exec('mkdocs gh-deploy');
        $this->taskGitStack()
            ->checkout('master')
            ->run();
    }
}