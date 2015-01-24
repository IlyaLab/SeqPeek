'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');

var livereload = require('gulp-livereload');
var karma = require('karma');
var karmaParseConfig = require('karma/lib/config').parseConfig;
var rename = require('gulp-rename');
var browserify = require('browserify');
var path = require('path');
var watchify = require('watchify');
var source = require('vinyl-source-stream');


/** Config variables */
var serverPort = 9010;
var lrPort = 35731;


/** File paths */
var dist = 'dist';

var htmlFiles = [
    '/examples/index.html',
    'src/examples/*.js'
];

var devWatchList = [
    htmlFiles,
    'src/**/*.js'
];

var htmlBuild = dist;

var vendorFiles = [ ];
var vendorBuild = dist + '/vendor';

var lr = undefined;

gulp.task('vendor', function () {
    return gulp.src(vendorFiles).
        pipe(gulp.dest(vendorBuild));
});


gulp.task('html', function () {
    return gulp.src(htmlFiles).
        pipe(gulp.dest(htmlBuild));
});

function karmaTask(configFilePath, options, cb) {
    configFilePath = path.resolve(configFilePath);

    var server = karma.server;
    var log=gutil.log, colors=gutil.colors;
    var config = karmaParseConfig(configFilePath, {});

    Object.keys(options).forEach(function(key) {
        config[key] = options[key];
    });

    server.start(config, function(exitCode) {
        log('Karma has exited with ' + colors.red(exitCode));
        cb();
        process.exit(exitCode);
    });
}

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
    var app;
    app = express();
    app.use(livereload());
    app.use(express["static"](express_root));
    app.listen(express_port);
    lr = tinylr();
    lr.listen(livereload_port);
});

/**
 * Run default task
 */
gulp.task('default', ['server'], function () {
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

/*
 * Run tests once
 */
gulp.task('test', function(cb) {
    karmaTask('karma.conf.js', {
        autoWatch: false,
        singleRun: true
    }, cb);
});

/*
 * Continuous integration
 */
gulp.task('test-dev', function(cb) {
    karmaTask('karma.conf.js', {
        autoWatch: true,
        singleRun: false
    }, cb);
});
