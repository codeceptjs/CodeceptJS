var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var documentation = require('gulp-documentation');
var glob = require('glob');

gulp.task('docs', function () {

  glob.sync('./lib/helper/*.js').forEach((file) => {
    gulp.src(file)
      .pipe(documentation({ filename: path.basename(file, '.js') + '.md', shallow: true, format: 'md', github: true }))
      .pipe(gulp.dest('docs/helpers'));
  });
});

gulp.task('static', function () {
  return gulp.src('**/*.js')
    .pipe(excludeGitignore())
    .pipe(eslint({fix: true}))
    .pipe(eslint.format())
    .pipe(gulp.dest('.'));
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

gulp.task('prepublish', []);
gulp.task('default', ['static', 'test', 'coveralls']);
