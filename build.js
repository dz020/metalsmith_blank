
var metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var multiLanguage = require('metalsmith-multi-language');
var templates = require("metalsmith-templates");

var ms = metalsmith(__dirname) // the working directory
.clean(true)            // clean the build directory
.source('src/html/')    // the page source directory
.destination('build/')  // the destination directory
.use(markdown())        // convert markdown to HTML
.use(multiLanguage({ 
    default: 'es', 
    locales: [
        'en', 
        'es'
        ] 
    }
))
 .use(templates({
    engine: "handlebars",
    directory: "src/html/"
}))
.use(debug(true))
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
