'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');

var livereload = require('gulp-livereload');
var connect = require('connect');

var rename = require('gulp-rename');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');


/** Config variables */
var serverPort = 9010;
var lrPort = 35731;


/** File paths */
var dist = 'dist';

var htmlFiles = [
    'src/examples/index.html',
    'src/examples/*js'
];

var devWatchList = [
    htmlFiles,
    'src/**/*.js'
];

var htmlBuild = dist;

var vendorFiles = [ ];
var vendorBuild = dist + '/vendor';


gulp.task('vendor', function () {
    return gulp.src(vendorFiles).
        pipe(gulp.dest(vendorBuild));
});


gulp.task('html', function () {
    return gulp.src(htmlFiles).
        pipe(gulp.dest(htmlBuild));
});


function compileScripts(watch) {
    gutil.log('Starting browserify');

    var entryFile = './src/example_config.js';

    var bundler;
    if (watch) {
        bundler = watchify(entryFile);
    } else {
        bundler = browserify(entryFile);
    }

    var rebundle = function () {
        var stream = bundler.bundle({ debug: true});

        stream.on('error', function (err) {
            console.error(err)
        });
        stream = stream.pipe(source(entryFile));

        stream.pipe(gulp.dest('dist/bundle'));
    };

    bundler.on('update', rebundle);
    return rebundle();
}


gulp.task('server', function (next) {
    var server = connect();
    server.use(connect.static(dist)).listen(serverPort, next);
});

/**
 * Run default task
 */
gulp.task('default', ['vendor', 'server'], function () {
    var lrServer = livereload(lrPort);
    var reloadPage = function (evt) {
        lrServer.changed(evt.path);
    };

    function initWatch(files, task) {
        gulp.start(task);
        gulp.watch(files, [task]);
    }

    compileScripts(true);
    initWatch(devWatchList, 'html');

    gulp.watch([dist + '/**/*'], reloadPage);
});
