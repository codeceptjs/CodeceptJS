# Integrating CodeceptJS into Your CI/CD Pipeline


CodeceptJS can be integrated into the CI/CD pipeline. Although we are
performing end-to-end acceptance testing, we will generate our results 
in JUnit format because many CI/CD tools can easily read it.

Generally, your CI/CD pipeline may look something like this:

1. Check out the code from repo
1. Validate that code checked out properly
1. Some people do this next step in a separate environment, in which case the
   code needs to first be deployed there. Run unit test suite and make sure they (mostly) pass. 
1. Again, a separate environment is sometimes needed for this: 
   Run CodeceptJS test suite and make sure they (mostly) pass.   
1. Deploy the code into the next (pre-prod?) environment in the pipeline
1. Notify team
1. etc etc etc

Please note that when running CodeceptJS and the underlying helpers
under CI/CD, you will have to install lots
and lots of prerequisites on the machine allocated for this activity.
Often this machine is quite bare initially, and all
prerequisites must be explicitly installed by you. Remember that
CodeceptJS uses a real web browser, and so we need a real Windows
or XWindows session for this browser to connect to at test execution
time, or else your automation won't run at all, complaining of
a missing graphical environment!

It might be a good idea to run CodeceptJS inside of a docker container,
because docker by its very nature helps us control the execution environment.
You should make your own image by writing a Dockerfile which in the 
FROM line specif\ies our image `codeception/codeceptjs` as the
parent of yours. This will help to ensure that you have the required 
packages to run the helper(s).

Please note that on a headless Linux machine, you will need to run CodeceptJS
along with XVFB. Command line might look something like:

```bash
xvfb-run ./node_packages/.bin/codeceptjs run --reporter mocha-junit-reporter
```


We have found that an effective way to integrate your CodeceptJS automation
suite into CI/CD is to generate a report XML file in JUnit format.
In your main config file `codecept.json` you should configure it like this:

```javascript
mocha: {
  "mocha-junit-reporter": {
    stdout: '-',
    options: {
      mochaFile: "./output/report-as-junit.xml"
    }
  }
}

```

Your CI/CD tool should be instructed to examine `./output/report-as-junit.xml`
upon completion of the CodeceptJS suite execution. 
This file reports a lot of info about the test results: 
- number of tests executed,
- number of tests failed,
plus lots of other info in case you need it.

Obviously, you will have to decide what constitutes a successful suite run.
Whether you require that all tests pass in order for this stage to be 
considered successful is up to you.  
