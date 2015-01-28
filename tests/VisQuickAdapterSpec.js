define([
    'd3',
    'vq',
    'jquery',
    'underscore',
    'src/util/testutils',
    'hbs!tests/templates/test',
    'tests/src/regions_and_domains_test'

], function(
    d3,
    vq,
    $,
    _,
    TestUtils,
    TestTemplate,
    SeqPeekTestObject
) {
    describe('VisQuickAdapterTest:', function () {
        var test_target_el;

        beforeEach(function(){
            var $testdiv = $(TestTemplate(SeqPeekTestObject));
            $(document.body).append($testdiv);
            test_target_el = $(document.body).find('#test_target')[0];
            SeqPeekTestObject.test_function(test_target_el, $testdiv);
        });

        it("should draw three tracks", function() {
            /*
             SeqPeek tracks have a "svg.data-area" element.

             There are expected to be a region track,
             one tick track and one protein domain track.
             */
            var numTracks = d3.selectAll("svg.data-area")[0].length;

            expect(numTracks).toBe(3);
        });

        // TODO add teardown
    });
});
