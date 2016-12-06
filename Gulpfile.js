'use strict';

var metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var multiLanguage = require('metalsmith-multi-language');
var layouts = require('metalsmith-layouts');
var gulp = require('gulp');
var connect = require('gulp-connect');
var livereload = require('gulp-livereload');
var gulpMetalsmith = require('gulp-metalsmith');
var sass = require('gulp-sass');
var runSequence = require('run-sequence');
var del = require('del');
var handlebars = require('handlebars');
var imagemin = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');
var eslint = require('gulp-eslint');

handlebars.registerHelper('if_eq', function (a, b, opts) {
  if (a === b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

var dir = {
  base: __dirname + '/',
  lib: __dirname + '/lib/',
  toMetalsmithSource: './src/to_smith/',
  dest: './build/',
  scssSource: './src/style/scss/',
  assetsSource: './src/assets/',
  jsSource: './src/lib/'
};

var templateConfig = {
  engine: 'handlebars',
  directory: dir.toMetalsmithSource + 'templates/',
  partials: dir.toMetalsmithSource + 'partials/',
  default: 'page.html'
};

metalsmith(__dirname) // the working directory
.clean(true)            // clean the build directory
.source(dir.toMetalsmithSource + 'content/')    // the page source directory
.destination(dir.dest)  // the destination directory
.use(markdown())        // convert markdown to HTML
.use(multiLanguage({
  default: 'es',
  locales: [
    'en',
    'es'
  ]}
))
.use(layouts(templateConfig))
.use(debug(false))
.build( function (err) {  // build the site
  if (err) {
    throw err;   // and throw errors
  }
});


function debug (logToConsole) {
  return function (files, metalsmith, done) {
    if (logToConsole) {
      console.log('\nMETADATA:');
      console.log(metalsmith.metadata());

      for (var f in files) {
        console.log('\nFILE:');
        console.log(files[f]);
      }
    }

    done();
  };
}

//-----------------------------------------------------------------

var sourceFiles = function () {
  return gulp.src(dir.toMetalsmithSource + '**/*').pipe( gulpMetalsmith() ).pipe( gulp.dest(dir.dest) ).pipe( livereload() );
};

var styles = function () {
  return gulp.src(dir.scssSource + '**/*.scss')
    .pipe( sourcemaps.init() )
    .pipe( sass().on('error', sass.logError) )
    .pipe( sourcemaps.write('sourcemaps') )
    .pipe( gulp.dest(dir.dest + 'style/css') )
    .pipe( livereload() );
};

gulp.task('files-watch', sourceFiles);
gulp.task('styles-watch', styles);

gulp.task('clean-build', function () {
  del([
    dir.dest + 'content',
    dir.dest + 'partials',
    dir.dest + 'assets',
    dir.dest + 'templates'
  ]);
});

gulp.task('image-min', function () {
  gulp.src(dir.assetsSource + 'images/**/*').pipe( imagemin() ).pipe(gulp.dest(dir.dest + 'assets/images'));
});

gulp.task('eslint', function () {
  gulp.src(dir.jsSource + '*.js').pipe( eslint() ).pipe( eslint.format() );
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

//-----------------------------------------------------------------

gulp.task('watch', function () {
  livereload.listen();
  runSequence('files-watch', 'styles-watch', 'clean-build', 'image-min', 'eslint'); //1 2 3
});

//-----------------------------------------------------------------

gulp.task('default', ['watch', 'server']);
