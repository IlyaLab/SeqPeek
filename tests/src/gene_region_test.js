define   (
[
    'util/data_adapters',
    'util/gene_region_utils',
    'util/region_layouts',
    'seqpeek_viewport',
    'seqpeek_svg_context',
    'variant_layout',
    '/tracks/bar_plot_track',
    'examples/testutils',
    'examples/seqpeek_test'
],
function (
    DataAdapters,
    GeneRegionUtils,
    RegionLayouts,
    ViewportFactory,
    SeqPeekSVGContextFactory,
    VariantLayoutFactory,
    BarPlotTrackFactory,
    TestUtils,
    SeqPeekTestPrototype
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
            // /tests/data/region_test.json
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
            ['TEST', 'exon', 900, 2000],
            ['TEST', 'noncoding', 2001, 5999],
            ['TEST', 'exon', 6000, 6200]
        ], function(p) {
            return generate_region.apply(this, p);
        });

        var region_data = GeneRegionUtils.buildRegionsFromArray(regions);

        var region_layout = RegionLayouts.BasicLayoutFactory
            .create({});

        region_layout.process(region_data);
        var region_metadata = region_layout.getMetadata();

        var variant_layout = VariantLayoutFactory.create({})
            .add_track_data(data_points)
            .location_field('coordinate')
            .variant_type_field('variant_type')
            .variant_width(5.0)
            .regions(region_data)
            .process();

        var track_data = DataAdapters.group_by_location(data_points, 'variant_type', 'coordinate');
        DataAdapters.apply_statistics(track_data, 'phenotype');

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
            .height(150);

        DataAdapters.apply_track_statistics(test_track, 'variants');

        var viewport = ViewportFactory.createFromRegionData(region_data, region_metadata, 1300);

        var spctx = SeqPeekSVGContextFactory.createIntoDiv(target_el);
        spctx
            .width(1300)
            .scroll_handler(function(event) {
                viewport.setViewportPosition({
                    x: event.translate[0],
                    y: 0
                });

                var visible_coordinates = this.region_layout._getVisibleCoordinates(-this.vis.viewport_pos[0]);
                variant_layout.doLayoutForViewport(visible_coordinates, this.vis.viewport_pos[0]);

                this._updateViewportTranslation(event.translate);
            })
            .track(test_track)
            .viewport(viewport);

        viewport.setViewportPosition({
            x: 0,
            y: 0
        });

        var initial_viewport = spctx.getCurrentViewport();
        variant_layout.doLayoutForViewport(initial_viewport.getVisibleCoordinates(), initial_viewport.getViewportPosition().x);

        spctx.draw();
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Synchronized bar plot track and region scale track";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});