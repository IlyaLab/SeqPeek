'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var concat_sourcemap = require('gulp-concat-sourcemap');
var express = require('express');

var amd_optimize = require('gulp-amd-optimizer');

var karma = require('karma');
var karmaParseConfig = require('karma/lib/config').parseConfig;
var path = require('path');
var source = require('vinyl-source-stream');
var tinylr = require('tiny-lr');

var _ = require("underscore");

var logger = gutil.log;

/** Config variables */
var SERVER_PORT = 9010;
var LIVERELOAD_PORT = 35731;


var express_root = './';
logger("Express server root: " + express_root);

var htmlFiles = [
    '/src/index.html'
];

var developmentWatchList = [
    htmlFiles,
    'src/**/*.js'
];

/** File paths */
var distBuildPath = 'dist';

var vendorFiles = [ ];
var vendorBuildPath = distBuildPath + '/vendor';

var servers = null;

var karmaTask = function(configFilePath, options, cb) {
    configFilePath = path.resolve(configFilePath);

    var server = karma.server;
    var colors=gutil.colors;
    var config = karmaParseConfig(configFilePath, {});

    Object.keys(options).forEach(function(key) {
        config[key] = options[key];
    });

    server.start(config, function(exitCode) {
        logger('Karma has exited with ' + colors.red(exitCode));
        cb();
        process.exit(exitCode);
    });
};

var distWithDependencies = function() {
    var requireConfig = {
        baseUrl: 'src',
        paths: {
            d3: '../bower_components/d3/d3',
            underscore: '../bower_components/underscore/underscore'
        }
    };

    var options = {
        umd: false
    };

    logger('Running gulp-amd-optimizer...');
    return gulp.src('src/builders/builder_for_existing_elements.js', {base: requireConfig.baseUrl})
        .pipe(amd_optimize(requireConfig, options))
        .on("error", function(message) {
            logger(message);
        })
        .pipe(concat('seqpeek_builder.js'))
        .pipe(gulp.dest('./'));
}

var createAppServerAndLiveReload = function(app_port, lr_port) {
    var livereload = tinylr();
    livereload.listen(lr_port, function() {
        logger('LR Listening on', lr_port);
    });

    var app = express();

    var express_paths = [
        ['/', express_root],
        ['/bower_components', 'bower_components'],
        ['/src', 'src']
    ];

    _.each(express_paths, function(route) {
        var uri = route[0];
        var dir_path = route[1];
        logger("Express route: " + uri + " -> " + dir_path);
        app.use(uri, express.static(path.resolve(dir_path)));
    });

    app.listen(app_port, function() {
        logger('Express server listening on', app_port);
    });

    return {
        lr: livereload,
        app: app
    };
};

gulp.task('vendor', function () {
    return gulp.src(vendorFiles).
        pipe(gulp.dest(vendorBuildPath));
});

gulp.task('html', function () {
    return gulp.src(htmlFiles).
        pipe(gulp.dest(distBuildPath));
});

gulp.task('build-seqpeek', function() {
    return distWithDependencies();
});

gulp.task('concat', function() {
    gulp.src(['./src/**/*.js', '!./src/demo_main.js'])
        .pipe(concat('seqpeek.js'))
        .pipe(gulp.dest('./'));
});

/**
 * Default task - build and watch the demo application
 */
gulp.task('default', ['vendor'], function () {
    servers = createAppServerAndLiveReload(SERVER_PORT, LIVERELOAD_PORT);

    var reloadPage = function (evt) {
        servers.lr.changed(evt.path);
    };

    function initWatch(files, task) {
        gulp.start(task);
        gulp.watch(files, [task]);
    }


    initWatch(developmentWatchList, 'html');

    gulp.watch(['src/**/*'], reloadPage);
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
