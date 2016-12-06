
var metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var multiLanguage = require('metalsmith-multi-language');
var layouts = require('metalsmith-layouts');
var gulp = require('gulp');
var connect = require('gulp-connect');
var fs = require('fs');
var livereload = require('gulp-livereload');
var gulp_metalsmith = require('gulp-metalsmith');
var sass = require('gulp-sass');
var runSequence = require('run-sequence');
var del = require('del');
var handlebars = require("handlebars");
var imagemin = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');

handlebars.registerHelper('if_eq', function(a, b, opts) {
    if (a === b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
});

var dir = {
  base: __dirname + '/',
  lib: __dirname + '/lib/',
  to_smith_source: './src/to_smith/',
  dest: './build/',
  scss_source: './src/style/scss/',
  assets_source: './src/assets/'
};

var templateConfig = {
  engine: 'handlebars',
  directory: dir.to_smith_source + 'templates/',
  partials: dir.to_smith_source + 'partials/',
  default: 'page.html'
};

var ms = metalsmith(__dirname) // the working directory
.clean(true)            // clean the build directory
.source(dir.to_smith_source + 'content/')    // the page source directory
.destination(dir.dest)  // the destination directory
.use(markdown())        // convert markdown to HTML
.use(multiLanguage({ 
    default: 'es', 
    locales: [
        'en', 
        'es'
        ] 
    }
))
.use(layouts(templateConfig))
.use(debug(false))
.build(function(err) {  // build the site
    if (err) throw err;   // and throw errors
});


function debug(logToConsole) {
  return function(files, metalsmith, done) {
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
};

//-----------------------------------------------------------------

var source_files = function() {
  return gulp.src(dir.to_smith_source + '**/*').pipe( gulp_metalsmith() ).pipe( gulp.dest(dir.dest) ).pipe( livereload() );
};

var styles = function() {
    return gulp.src(dir.scss_source + '**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('sourcemaps'))
    .pipe( gulp.dest(dir.dest + 'style/css') )
    .pipe( livereload());
};

gulp.task('files-watch', source_files);
gulp.task('styles-watch', styles);

gulp.task('clean-build', function(){
    del([
        dir.dest + 'content',
        dir.dest + 'partials',
        dir.dest + 'assets',
        dir.dest + 'templates'
    ]);
});

gulp.task('image-min', function(){
    gulp.src(dir.assets_source + 'images/**/*').pipe( imagemin() ).pipe(gulp.dest(dir.dest + "assets/images"));
});

gulp.task('server', function () {
  connect.server({
    root: [dir.dest],
    port: 8000,
    livereload: true,
    middleware: function(connect, opt) {
        return [
            connect.static(dir.dest),
            function(req, res, next) {
                next();
            }
        ];
    }
  });
});

//-----------------------------------------------------------------

gulp.task('watch', function () {
    livereload.listen();
    runSequence('files-watch', 'styles-watch', 'clean-build', 'image-min'); //1 2 3
});

//-----------------------------------------------------------------

gulp.task('default', ['watch', 'server']);