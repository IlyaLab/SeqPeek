define   (
[
    'examples/testutils',
    'examples/seqpeek_test',
    'util/data_adapters',
    'util/gene_region_utils',
    'util/region_layouts',
    'seqpeek_viewport',
    'seqpeek_svg_context',
    'variant_layout',
    '../tracks/bar_plot_track',
    '../tracks/region_scale_track',
    '../tracks/horizontal_tick_track'
],
function (
    TestUtils,
    SeqPeekTestPrototype,
    DataAdapters,
    GeneRegionUtils,
    RegionLayouts,
    ViewportFactory,
    SeqPeekSVGContextFactory,
    VariantLayoutFactory,
    BarPlotTrackFactory,
    RegionTrackFactory,
    TickTrackFactory
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

        var region_data = GeneRegionUtils.buildRegionsFromArray(regions);

        var region_layout = RegionLayouts.BasicLayoutFactory
            .create({})
            .intron_width(30);

        region_layout.process(region_data);
        var region_metadata = region_layout.getMetadata();

        var variant_layout = VariantLayoutFactory.create({})
            .add_track_data(data_points)
            .location_field('coordinate')
            .variant_type_field('variant_type')
            .variant_width(5.0)
            .regions(region_data)
            .processFlatArray('coordinate');

        var track_data = DataAdapters.group_by_location(data_points, 'variant_type', 'coordinate');
        DataAdapters.apply_statistics(track_data, 'phenotype');

        ///////////////////
        // Set up tracks //
        ///////////////////
        var test_track = BarPlotTrackFactory
            .create()
            .color_scheme({
                'true': '#fd8f42',
                'false': '#84acba',
                'na': '#817843'
            })
            .data(track_data, 'variants')
            .regions(region_data, 'coordinate')
            .variant_layout(variant_layout)
            .bar_width(5.0)
            .stem_height(30)
            .height(150)
            .category_totals({'true': 10, 'false': 20})
            .scaling({
                type: 'log2nabs',
                min_height: 10,
                max_height: 200,
                scaling_factor: 200
            });

        var region_track = RegionTrackFactory
            .create()
            .height(20)
            .data(region_data);

        var tick_track = TickTrackFactory
            .create()
            .height(25)
            .tick_height(10)
            .tick_text_y(22)
            .data(region_data);

        //////////////
        // Viewport //
        //////////////
        var common_viewport = ViewportFactory.createFromRegionData(region_data, region_metadata, 1300);
        common_viewport.setViewportPosition({
            x: 0,
            y: 0
        });

        ////////////////////////////////////////
        // Create SVG element for both tracks //
        ////////////////////////////////////////
        var vis_svg = d3.select(target_el)
            .append("svg")
            .attr("width", 1300)
            .attr("height", 195)
            .style("pointer-events", "none");

        var bar_plot_track_svg = vis_svg
            .append("g")
            .style("pointer-events", "none");

        var region_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0,150)")
            .style("pointer-events", "none");

        var tick_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0,170)")
            .style("pointer-events", "none");

        /////////////////////////////////////////////
        // Set up rendering context for each track //
        /////////////////////////////////////////////
        var bar_plot_context = SeqPeekSVGContextFactory.createIntoSVG(bar_plot_track_svg),
            region_scale_ctx = SeqPeekSVGContextFactory.createIntoSVG(region_track_svg)
                .track(region_track),
            tick_ctx = SeqPeekSVGContextFactory.createIntoSVG(tick_track_svg)
                .track(tick_track);

        var scroll_handler = function(event) {
            common_viewport.setViewportPosition({
                x: event.translate[0],
                y: 0
            });

            var visible_coordinates = common_viewport._getVisibleCoordinates();
            variant_layout.doLayoutForViewport(visible_coordinates);

            // Scroll the bar plot context
            _.bind(bar_plot_context._updateViewportTranslation, bar_plot_context)();

            // Scroll the region scale track context
            _.bind(region_scale_ctx._updateViewportTranslation, region_scale_ctx)();

            // Scroll the tick track context
            _.bind(tick_ctx._updateViewportTranslation, tick_ctx)();
        };

        bar_plot_context
            .width(1300)
            .scroll_handler(scroll_handler)
            .track(test_track)
            .viewport(common_viewport);

        var initial_viewport = bar_plot_context.getCurrentViewport();
        variant_layout.doLayoutForViewport(initial_viewport.getVisibleCoordinates(), initial_viewport.getViewportPosition().x);

        bar_plot_context.draw();

        region_scale_ctx
            .width(1300)
            .scroll_handler(scroll_handler)
            .viewport(common_viewport)
            .draw();

        tick_ctx
            .width(1300)
            .scroll_handler(scroll_handler)
            .viewport(common_viewport)
            .draw();
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Genomic data rendering";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});