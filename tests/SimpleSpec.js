define([
    'jquery',
    'underscore',
    'hbs!./templates/test',
    'examples/bar_and_region_track_test'

], function(
    $,
    _,
    TestTemplate,
    BarAndRegionTrackTest
) {
    describe('BarPlotsAndRegionTrack:', function () {
        var test_target_el;

        beforeEach(function(){
            var $testdiv = $(TestTemplate(BarAndRegionTrackTest));
            $(document.body).append($testdiv);
            test_target_el = $(document.body).find('#test_target')[0];
            BarAndRegionTrackTest.test_function(test_target_el, $testdiv);
        });

        it("should draw five tracks", function() {
            /*
             SeqPeek tracks have a "svg.data-area" element.

             There are expected to be a bar plot track, a lollipop track,
             one tick track and one protein domain track.
             */
            var numTracks = d3.selectAll("svg.data-area")[0].length;

            expect(numTracks).toBe(5);
        });

        // TODO add teardown
    });
});
