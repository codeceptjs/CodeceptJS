const path = require('path');
const gulp = require('gulp');
const documentation = require('gulp-documentation');
const glob = require('glob');
const mustache = require('gulp-mustache');

const cpath = '.';

gulp.task('docs', () => {
  glob.sync(path.join(cpath, 'lib/helper/*.js')).forEach((file) => {
    gulp.src(file)
      .pipe(gulp.dest(path.join(cpath, 'docs/build')))
      .pipe(mustache({}, {extension: '.js'}))
      .pipe(gulp.dest(path.join(cpath, 'docs/build')))
      .pipe(documentation({ filename: path.basename(file, '.js') + '.md', shallow: true, format: 'md'}))
      .pipe(gulp.dest(path.join(cpath, 'docs/helpers')));
  });

  const api = ['container', 'config', 'recorder', 'output', 'helper', 'codecept'];

  api.forEach((baseName) => {
    gulp.src(path.join(cpath, `lib/${baseName}.js`))
      .pipe(documentation({ filename: baseName + '.md', shallow: true, format: 'md'}))
      .pipe(gulp.dest(path.join(cpath, 'docs/api')));
  });

  gulp.src(path.join(cpath, 'lib/plugin/*.js'))
    .pipe(documentation({ shallow: true, filename: 'plugins.md', format: 'md' }))
    .pipe(gulp.dest(path.join(cpath, 'docs')));
});


gulp.task('default', ['docs']);