var tests = [];
for (var file in window.__karma__.files) {
    if (/Spec\.js$/.test(file)) {
        tests.push(file);
    }
}

require.config({
    /*
     * Karma serves all files configured in the 'files' section of karma.conf.js from '/base'.
     */
    baseUrl: '/base',

    /*
     * Here, './bower_components' refers to the project root (see .bowerrc).
     */
    paths: {
        jquery: './bower_components/jquery/dist/jquery',
        d3: './bower_components/d3/d3',
        underscore: './bower_components/underscore/underscore',
        "vq" : './bower_components/visquick/vq',
        "hbs": "./bower_components/require-handlebars-plugin/hbs",
        "handlebars" : "./bower_components/require-handlebars-plugin/Handlebars",
        'json2' : './bower_components/require-handlebars-plugin/hbs/json2',
        'i18nprecompile' : './bower_components/require-handlebars-plugin/hbs/i18nprecompile',
        text: './bower_components/requirejs-text/text',
        json: './bower_components/requirejs-plugins/src/json'
    },

    shim: {
        'underscore' : {
            'exports' : '_'
        },
        d3 : {
            'exports' : 'd3'
        },
        vq : {
            'deps' : ['d3','underscore'],
            'exports' : 'vq'
        },
        'jquery.vislegend' : {
            deps : ['jquery', 'd3', 'underscore'],
            exports : '$'
        }
    },
    hbs : {
        "templateExtension" : "hbs",
        "disableI18n" : true,
        "helperPathCallback" :
            function (name) {
                return "templates/helpers/" + name;
            }
    },
    deps: tests,

    callback: window.__karma__.start
});
