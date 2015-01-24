var tests = [];
for (var file in window.__karma__.files) {
    if (/Spec\.js$/.test(file)) {
        tests.push(file);
    }
}

require.config({
    //baseUrl: './',
    baseUrl: 'base/src',

    /*
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        //"jQuery-ui": "../bower_components/jquery-ui/ui/jquery-ui",
        d3: '../bower_components/d3/d3',
        underscore: '../bower_components/underscore/underscore',
        "vq" : '../bower_components/visquick/vq',
        "hbs": "../bower_components/require-handlebars-plugin/hbs",
        "handlebars" : "../bower_components/require-handlebars-plugin/Handlebars",
        'json2' : '../bower_components/require-handlebars-plugin/hbs/json2',
        'i18nprecompile' : '../bower_components/require-handlebars-plugin/hbs/i18nprecompile'
    },
    */

    /*
    paths: {
        jquery: 'src/bower_components/jquery/dist/jquery',
        //"jQuery-ui": "../bower_components/jquery-ui/ui/jquery-ui",
        d3: 'src/bower_components/d3/d3',
        underscore: 'src/bower_components/underscore/underscore',
        "vq" : 'src/bower_components/visquick/vq',
        "hbs": "src/bower_components/require-handlebars-plugin/hbs",
        "handlebars" : "src/bower_components/require-handlebars-plugin/Handlebars",
        'json2' : 'src/bower_components/require-handlebars-plugin/hbs/json2',
        'i18nprecompile' : 'src/bower_components/require-handlebars-plugin/hbs/i18nprecompile'
    },
    */

    paths: {
        jquery: './bower_components/jquery/dist/jquery',
        //"jQuery-ui": "../bower_components/jquery-ui/ui/jquery-ui",
        d3: './bower_components/d3/d3',
        underscore: './bower_components/underscore/underscore',
        "vq" : './bower_components/visquick/vq',
        "hbs": "./bower_components/require-handlebars-plugin/hbs",
        "handlebars" : "./bower_components/require-handlebars-plugin/Handlebars",
        'json2' : './bower_components/require-handlebars-plugin/hbs/json2',
        'i18nprecompile' : './bower_components/require-handlebars-plugin/hbs/i18nprecompile'
    },
    shim: {
        'underscore' : {
            'exports' : '_'
        },
        /*
        "jQuery-ui" : {
            "deps": ["jquery"],
            "exports" : "$"
        },
        */
        d3 : {
            'exports' : 'd3'
        },
        vq : {
            'deps' : ['d3','underscore'],
            'exports' : 'vq'
        },
        /*
        backbone : {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        */
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

/*
require([
    'jquery',
    'underscore',
    'hbs!examples/templates/test',
    'examples/gene_region_test',
    'examples/region_track_test',
    'examples/bar_and_region_track_test'
], function (
    $,
    _,
    TestTemplate,
    GeneRegionTest,
    RegionTrackTest,
    BarAndRegionTrackTest
) {
    'use strict';

    var testlist = [
        //RegionTrackTest,
        //GeneRegionTest
        BarAndRegionTrackTest
    ];


    _.each(testlist, function(test) {
        var $testdiv = $(TestTemplate(test)).insertAfter('#test_container');
        var test_target_el = $testdiv.find('#test_target')[0];
        test.test_function(test_target_el, $testdiv);
    });
});
*/
