require.config({
    baseUrl: '/',

    /*
     * Here, './bower_components' refers to the project root (see .bowerrc).
     */
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        d3: '../bower_components/d3/d3',
        underscore: '../bower_components/underscore/underscore',
        "vq" : '../bower_components/visquick/vq',
        "hbs": "../bower_components/require-handlebars-plugin/hbs",
        "handlebars" : "../bower_components/require-handlebars-plugin/Handlebars",
        'json2' : '../bower_components/require-handlebars-plugin/hbs/json2',
        'i18nprecompile' : '../bower_components/require-handlebars-plugin/hbs/i18nprecompile',
        text: '../bower_components/requirejs-text/text',
        json: '../bower_components/requirejs-plugins/src/json'
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
        }
    },
    hbs : {
        "templateExtension" : "hbs",
        "disableI18n" : true,
        "helperPathCallback" :
            function (name) {
                return "templates/helpers/" + name;
            }
    }
});


require([
    'd3',
    'vq',
    'jquery',
    'underscore',
    'hbs!tests/templates/test',
    'tests/src/regions_and_domains_test'
], function(
    d3,
    vq,
    $,
    _,
    TestTemplate,
    SeqPeekTestObject

) {
    var $testdiv = $(TestTemplate(SeqPeekTestObject));
    $(document.body).append($testdiv);
    test_target_el = $(document.body).find('#test_target')[0];
    SeqPeekTestObject.test_function(test_target_el, $testdiv);
});
