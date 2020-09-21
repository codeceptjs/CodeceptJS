---
permalink: /examples
layout: Section
sidebar: false
title: Examples
editLink: false
---

# Examples
> Add your own examples to our [Wiki Page](https://github.com/codeceptjs/CodeceptJS/wiki/Examples)
## [TodoMVC Examples](https://github.com/codecept-js/examples)

![](https://github.com/codecept-js/examples/raw/master/todo.png)

Playground repository where you can run tests in different helpers on a basic single-page website.

Tests repository demonstrate usage of

* Puppeteer helper
* WebDriver helper
* TestCafe plugin
* Toggle headless mode with env variables
* PageObjects
* Cucumber syntax

## [Basic Examples](https://github.com/Codeception/CodeceptJS/tree/master/examples)

CodeceptJS repo contains basic tests (both failing and passing) just to show how it works.
Our team uses it to test new features and run simple scenarios.


## [Testing Single Page Application](https://github.com/bugiratracker/codeceptjs-demo)

![](https://user-images.githubusercontent.com/220264/56353972-56975080-61db-11e9-8b23-06e8b4620995.png)

End 2 end tests for [Bugira Bugtracker](https://bugira.com) app built with Rails & EmberJS. Bugira is a SaaS application that helps collecting users' feedbacks and transforming them into professional bug reports.

Tests repository demonstrate usage of

* Puppeteer helper
* ApiDataFactory helper
* autoLogin plugin
* Dynamic config with profiles

## [Practical E2E Tests](https://gitlab.com/paulvincent/codeceptjs-e2e-testing)

Examples from the book [Practical End 2 End Testing with CodeceptJS](https://leanpub.com/codeceptjs/) by **Paul Vincent Beigang**. 

This repository demonstrates usage of:

* dynamic config with profiles
* testing WYSIWYG editor
* GitLab CI

## [CodeceptJS Cucumber E2E Framework](https://github.com/gkushang/codeceptjs-e2e)

This repository contains complete E2E framework for CodeceptJS with Cucumber and SauceLabs Integration

* CodecepJS-Cucumber E2E Framework
* Saucelabs Integration
* Run Cross Browser tests in Parallel on SauceLabs with a simple command
* Run tests on `chrome:headless`
* Page Objects
* `Should.js` Assertion Library
* Uses `wdio` service (selenium-standalone, sauce)
* Allure HTML Reports
* Uses shared Master configuration
* Sample example and feature files of GitHub Features

## [Amazon Tests v2](https://gitlab.com/thanhnguyendh/codeceptjs-wdio-services)

Testing Amazon website using Selenium WebDriver.

This repository demonstrates usage of:

* WebDriver helper
* Page Objects
* wdio services (selenium-standalone)
* Parallel execution
* GitLab CI setup

## [Amazon Tests v1](https://github.com/PeterNgTr/amazon-ui-tests)

Previous version of Amazon Tests, still valid but quite different.

This repository demonstrates usage of:

* WebDriver helper
* Page Objects
* Bootstrap and teardown
* Parallel execution

## [Tests with Docker Compose](https://github.com/mathesouza/codeceptjs-docker-compose)

Running CodeceptJS tests with Docker Compose

This repository demonstrates usage of:

* CodeceptJS Docker image 
* WebDriver helper
* Allure plugin


## [ModusCreate Tests](https://github.com/ModusCreateOrg/codeceptjs-nightmare-harness)

Test automation by ModusCreate agency with NightmareJS.

This repository demonstrates usage of:

* Nightmare helper
* Reports with Mochawesome
* Docker
* Page objects and page fragments

## [AngularJS Example Tests](https://github.com/armno/angular-e2e-codeceptjs-example)

Based on [Setting up End-to-End Testing in Angular Project with CodeceptJS](https://medium.com/@armno/setting-up-end-to-end-testing-in-angular-project-with-codeceptjs-ac1784de3420) post by Armno Prommarak.

This repository demonstrates usage of

* Puppeteer helper
* Working with Angular CLI
* Reports with Mochawesome helper

## [REST Example Tests](https://github.com/PeterNgTr/codeceptjs-rest-demo)

This repository demonstrates usage of

* REST helper

## [Automation Starter](https://github.com/sjorrillo/automation-starter)

The purpose of this application is for learning the basics and how to use good practices and useful tools in automation.

* Puppeteer helper
* Working with gherkin, also it has type definitions and to be able to use them inside when, given and then make sure you add `declare function inject(): { I: CodeceptJS.I, [key: string]: any; };`in the `steps.d.ts`file 
* Linting `airbnb-base`, `codeceptjs/codeceptjs` and full ES6 support

## [Example for using: Puppeteer, Gherkin, Allure with parallel execution](https://github.com/SchnuckySchuster/codeceptJSExample)

This is a ready to use example that shows how to integrate CodeceptJS with Puppeteer and Allure as reporting tool.

* detailed ReadMe
* tests written in cucumber alongside tests written in the codeceptJS DSL
* puppeteer helper example
* test steps, pages, fragments
* examples for sequential and parallel execution
* generation of allure test results  

## [Framework with UI and API test support : CodeceptJS , Puppeteer , REST , ESLint](https://github.com/avighub/CodeceptJS-puppeteer)
This is a basic framework with Puppeteer , REST helpers which can support both UI and API actions within same test.
More improvements and features will be added and will be updated. 
Suggestions and improvements are welcome , please raise a ticket in Issue tab.

* Step by step setup in README
* Two helpers are added. UI - Puppeteer , API - REST and chai-codeceptJS for assetion
* ESLint for code check
* Upcoming : API generic functions , Adaptor design pattern , More utilities