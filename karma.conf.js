module.exports = function(config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        frameworks: ['jasmine', 'requirejs'],

        // list of files / patterns to load in the browser
        files: [
            // CSS
            'tests/css/stylesheet.css',
            'bower_components/font-awesome/css/font-awesome.css',
            'bower_components/visquick/assets/css/vq.css',

            // JavaScript
            {pattern: 'bower_components/**/*.js', included: false},
            {pattern: 'src/**/*.js', included: false},
            {pattern: 'tests/src/*.js', included: false},
            {pattern: 'tests/*Spec.js', included: false},
            {pattern: 'tests/**/*Spec.js', included: false},
            {pattern: 'tests/templates/*.hbs', included: false},
            {pattern: 'tests/data/**/*.json', included: false},
            'tests/tests_main.js'
        ],

        // list of files to exclude
        exclude: [ ],

        preprocessors: { },

        reporters: ['progress'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],

        customLaunchers: {
            Chrome_without_security: {
                base: 'Chrome',
                flags: ['--disable-web-security']
            }
        },

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    });
};
