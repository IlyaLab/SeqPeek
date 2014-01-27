require.config({
    baseUrl: './',

    paths: {
        jquery: './bower_components/jquery/jquery',
        "jQuery-ui": "./bower_components/jquery-ui/ui/jquery-ui",
        backbone: './bower_components/backbone/backbone',
        bootstrap: 'vendor/bootstrap',
        d3: './bower_components/d3/d3',
        modernizr: './bower_components/modernizr',
        underscore: 'bower_components/underscore/underscore',
        "vq" : 'bower_components/visquick/vq'
    },
    shim: {
        'underscore' : {
            'exports' : '_'
        },
        "jQuery-ui" : {
            "deps": ["jquery"],
            "exports" : "$"
        },
        d3 : {
            'exports' : 'd3'
        },
        vq : {
            'deps' : ['d3','underscore'],
            'exports' : 'vq'
        },
        backbone : {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        bootstrap : {
            deps : ['jquery','jQuery-ui'],
            exports : 'bootstrap'
        },
        'jquery.vislegend' : {
            deps : ['jquery', 'd3', 'underscore'],
            exports : '$'
        }
    }
});

require([
    'jquery',
    'underscore',
    'examples/examples'
], function (
    $,
    _,
    Examples
) {
    'use strict';

    Examples.absolute_log2_test($('#protein_track_test'));
    Examples.gene_region_test($('#genomic_track_test'));

});
