const path = require('path');
const gulp = require('gulp');
const run = require('gulp-run');
const documentation = require('gulp-documentation');
const gap = require('gulp-append-prepend');
const glob = require('glob');
const mustache = require('gulp-mustache');

const cpath = '.';

gulp.task('docs', (done) => {
  glob.sync(path.join(cpath, 'lib/helper/*.js')).forEach((file) => {
    gulp.src(file)
      .pipe(gulp.dest(path.join(cpath, 'docs/build')))
      .pipe(gulp.dest(path.join(cpath, 'docs/build')))
      .pipe(run(`npx documentation build docs/build/${path.basename(file)} -o docs/helpers/${path.basename(file, '.js')}.md -f md --shallow --markdown-toc=false --sort-order=alpha `))
      .pipe(mustache({}, { extension: '.md' }));
    // .pipe(documentation('md', { filename: `${path.basename(file, '.js')}.md`, shallow: true, sortOrder: 'alpha' }))
    //       .pipe(gap.prependText(`---
    // id: ${path.basename(file, '.js')}
    // title: ${path.basename(file, '.js')}
    // ---`))
    //       .pipe(gulp.dest(path.join(cpath, 'docs/helpers')));
  });

  //   const api = ['container', 'config', 'recorder', 'output', 'helper', 'codecept'];

  //   api.forEach((baseName) => {
  //     gulp.src(path.join(cpath, `lib/${baseName}.js`))
  //       .pipe(documentation('md', { filename: `${baseName}.md`, shallow: true, sortOrder: 'alpha' }))
  //       .pipe(gulp.dest(path.join(cpath, 'docs/api')));
  //   });

  //   gulp.src(path.join(cpath, 'lib/plugin/*.js'))
  //     .pipe(documentation('md', { filename: 'plugins.md', shallow: true, sortOrder: 'alpha' }))
  //     .pipe(gap.prependText(`---
  // id: plugins
  // title: Plugins
  // ---`))
  //     .pipe(gulp.dest(path.join(cpath, 'docs')));

  done();
});

gulp.task('default', gulp.series('docs'));
