var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var documentation = require('gulp-documentation');

gulp.task('docs', function () {

  gulp.src('./lib/helper/*.js')
    .pipe(documentation({ format: 'md' }))
    .pipe(gulp.dest('docs'));
    
});    

gulp.task('static', function () {
  return gulp.src('**/*.js')
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('nsp', function (cb) {
  nsp('package.json', cb);
});

gulp.task('pre-test', function () {
  return gulp.src('lib/**/*.js')
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', function (cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    // .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}));
    // .on('error', function (err) {
      // mochaErr = err;
    // })
    // .on('end', function () {
      // cb(mochaErr);
    // });
});

gulp.task('coveralls', ['test'], function () {
  if (!process.env.CI) {
    return;
  }

  return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
    .pipe(coveralls());
});

gulp.task('prepublish', ['nsp']);
gulp.task('default', ['static', 'test', 'coveralls']);
