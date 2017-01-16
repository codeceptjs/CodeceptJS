var path = require('path');
var gulp = require('gulp');
const gulpIf = require('gulp-if');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');
var coveralls = require('gulp-coveralls');
var documentation = require('gulp-documentation');
var glob = require('glob');
var guppy = require('git-guppy')(gulp);
var gitmodified = require('gulp-gitmodified');
var mustache = require("gulp-mustache");

function isFixed(file) {
	// Has ESLint fixed the file contents?
  console.log('fixed', file.eslint != null && file.eslint.fixed);
	return file.eslint != null && file.eslint.fixed;
}

gulp.task('docs', function () {

  glob.sync('./lib/helper/*.js').forEach((file) => {
    var mustache = require("gulp-mustache");
    gulp.src(file)
      .pipe(gulp.dest('docs/build'))
      .pipe(mustache({}, {extension: '.js'}))
      .pipe(gulp.dest('docs/build'))
      .pipe(documentation({ filename: path.basename(file, '.js') + '.md', shallow: true, format: 'md'}))
      .pipe(gulp.dest('docs/helpers'));
  });
});

gulp.task('static', function () {
  return gulp.src('lib/**/*.js')
    // .pipe(gitmodified(['added', 'modified']))
    .pipe(eslint({fix: true}))
    // .pipe(eslint.format())
    .pipe(gulp.dest('lib'));
});

gulp.task('pre-commit', ['static']);

gulp.task('test', function (cb) {
  var mochaErr;

  gulp.src(['./test/unit/**/*_test.js', './test/runner/**/*_test.js'])
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function (err) {
      mochaErr = err;
    })
    .on('end', function () {
      cb(mochaErr);
    });
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
