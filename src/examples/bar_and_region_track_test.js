define   (
[
    'examples/testutils',
    'examples/seqpeek_test',
    'util/data_adapters',

    '../builders/builder_for_existing_elements'

],
function (
    TestUtils,
    SeqPeekTestPrototype,
    DataAdapters,

    SeqPeekBuilder
) {
    var generate_region = function(transcript, type, start, end) {
        return {
            type: type,
            start: start,
            end: end
        }
    };

    var test_function = function(target_el) {
        var data_points = TestUtils.generate_test_data([
            // Coding
            [9, 900, 'AB', 'false'],
            [10, 1000, 'AB', 'false'],
            [10, 1000, 'AB', 'true'],

            [10, 1000, 'XY', 'false'],
            [10, 1000, 'XY', 'true'],

            [11, 1001, 'XY', 'true'],
            [12, 1002, 'XY', 'true'],
            [12, 1002, 'XY', 'true'],

            [20, 1020, 'AB', 'false'],
            [20, 1020, 'AB', 'false'],
            [20, 1020, 'AB', 'true'],

            [11, 1300, 'XY', 'true'],
            [12, 1300, 'XY', 'true'],
            [12, 1300, 'XY', 'true'],

            [20, 1300, 'AB', 'false'],
            [20, 1300, 'AB', 'false'],
            [20, 1300, 'AB', 'true'],

            // Non-coding
            [30, 3000, 'AB', 'true'],
            [30, 3000, 'AB', 'true'],
            [30, 3000, 'AB', 'true'],

            [60, 6050, 'AB', 'false'],
            [60, 6050, 'CD', 'false']
        ], {
            protein_loc: 0,
            coordinate: 1,
            variant_type: 2,
            phenotype: 3
        });

        var regions = _.map([
            ['TEST', 'noncoding', 500, 899],
            ['TEST', 'exon', 900, 1800],
            ['TEST', 'noncoding', 2001, 5999],
            ['TEST', 'exon', 6000, 6200]
        ], function(p) {
            return generate_region.apply(this, p);
        });


        ////////////////////////////////////////
        // Create SVG elements for all tracks //
        ////////////////////////////////////////
        var vis_svg = d3.select(target_el)
            .append("svg")
            .attr("width", 1300)
            .attr("height", 150 + 150 + 20)
            .style("pointer-events", "none");

        var bar_plot_track_svg = vis_svg
            .append("g")
            .style("pointer-events", "none");

        var lollipop_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0,100)")
            .style("pointer-events", "none");

        var region_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0,270)")
            .style("pointer-events", "none");

        var tick_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0,290)")
            .style("pointer-events", "none");

        //////////////////
        var seqpeek = SeqPeekBuilder.create({
            region_data: regions,
            viewport: {
                width: 1300
            },
            bar_plot_tracks: {
                height: 150,
                stem_height: 30
            },
            sample_plot_tracks: {
                height: 150,
                stem_height: 30,
                color_scheme: {
                    'AB': 'blue',
                    'XY': 'green',
                    'CD': 'red'
                }
            },
            region_layout: {
                intron_width: 50
            },
            variant_layout: {
                variant_width: 5.0
            },
            variant_data_location_field: 'coordinate',
            variant_data_type_field: 'variant_type'
        });

        seqpeek.addBarPlotTrackWithArrayData(data_points, bar_plot_track_svg);
        seqpeek.addSamplePlotTrackWithArrayData(data_points, lollipop_track_svg);
        seqpeek.addRegionScaleTrackToElement(region_track_svg);
        seqpeek.addTickTrackToElement(tick_track_svg);
        seqpeek.draw();
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Genomic data rendering";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});