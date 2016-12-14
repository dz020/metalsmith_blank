'use strict';

var metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var multiLanguage = require('metalsmith-multi-language');
var layouts = require('metalsmith-layouts');
var gulp = require('gulp');
var connect = require('gulp-connect');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var runSequence = require('run-sequence');
var del = require('del');
var handlebars = require('handlebars');
var imagemin = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');
var eslint = require('gulp-eslint');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var gutil = require('gulp-util');

handlebars.registerHelper('if_eq', function (a, b, opts) {
  if (a === b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

var dir = {
  base: __dirname + '/',
  toMetalsmithSource: './src/to_smith/',
  dest: './build/',
  src: './src/',
  scssSource: './src/style/scss/',
  assetsSource: './src/assets/',
  jsSource: './src/lib/'
};

var templateConfig = {
  engine: 'handlebars',
  directory: dir.toMetalsmithSource + 'html/templates/',
  partials: dir.toMetalsmithSource + 'html/partials/',
  default: 'page.html'
};

metalsmith(__dirname) // the working directory
.clean(false)            // clean the build directory
.source(dir.toMetalsmithSource + 'content/')    // the page source directory
.destination(dir.dest)  // the destination directory
.use(markdown())        // convert markdown to HTML
.use(multiLanguage({
  default: 'de',
  locales: [
    'de',
    'en'
  ]}
))
.use(layouts(templateConfig))
.use(debug(false))
.build( function (err) {  // build the site
  if (err) {
    throw err;   // and throw errors
  }
});

function debug (logTogutil) {
  return function (files, metalsmith, done) {
    if (logTogutil) {
      gutil.log('\nMETADATA:');
      gutil.log(metalsmith.metadata());

      for (var f in files) {
        gutil.log('\nFILE:');
        gutil.log(files[f]);
      }
    }

    done();
  };
}

//-----------------------------------------------------------------

gulp.task('build-content', function () {
  metalsmith(__dirname) // the working directory
    .clean(false)            // clean the build directory
    .source(dir.toMetalsmithSource + 'content/')    // the page source directory
    .destination(dir.dest)  // the destination directory
    .use(markdown())        // convert markdown to HTML
    .use(multiLanguage({
      default: 'de',
      locales: [
        'de',
        'en'
      ]}
    ))
    .use(layouts(templateConfig))
    .use(debug(false))
    .build( function (err) {  // build the site
      if (err) {
        throw err;   // and throw errors
      }
    });
});

function buildStyle () {
  gulp.src(dir.scssSource + '**/*.scss')
  .pipe( sourcemaps.init() )
  .pipe( sass().on('error', sass.logError) )
  .pipe( sourcemaps.write('sourcemaps') )
  .pipe( gulp.dest(dir.dest + 'style/css') )
  .pipe( livereload() );
}

gulp.task('build-style', function () {
  gutil.log('build style aufgerufen');
  buildStyle();
});

gulp.task('build-clean', function () {
  gutil.log('build clean aufgerufen');
  del([
    dir.dest
  ]);
});

gulp.task('image-min', function () {
  gutil.log('imagemin aufgerufen');
  gulp.src(dir.assetsSource + 'images/**/*').pipe( imagemin() ).pipe(gulp.dest(dir.dest + 'assets/images'));
});

gulp.task('eslint', function () {
  gutil.log('eslint aufgerufen');
  gulp.src(dir.jsSource + '*.js').pipe( eslint() ).pipe( eslint.format() );
});

gulp.task('build-js', function () {
  gutil.log('build js aufgerufen');
  gulp.src(dir.jsSource + '**/*.js')
  .pipe( sourcemaps.init())
  .pipe( concat('concated.js'))
  .pipe( rename('main.min.js'))
  .pipe( uglify())
  .pipe( sourcemaps.write('js_sourcemap'))
  .pipe( gulp.dest(dir.dest + 'lib'))
  .pipe( livereload() );
});

gulp.task('server', function () {
  connect.server({
    root: [dir.dest],
    port: 8000,
    livereload: true,
    middleware: function (connect) {
      return [
        connect.static(dir.dest),
        function (req, res, next) {
          next();
        }
      ];
    }
  });
});

gulp.task('live-reload', function () {
  livereload();
});

//-----------------------------------------------------------------


gulp.task('watch', function () {
  livereload.listen();

  gulp.watch([dir.src + '**/*'], function () {
    runSequence('build-clean', 'build-style', 'build-content', 'image-min', 'eslint', 'build-js'); //1 2 3
  });

});

//-----------------------------------------------------------------

runSequence('build-clean', 'build-style', 'build-content', 'image-min', 'eslint', 'build-js'); //1 2 3
gulp.task('default', ['watch', 'server']);
