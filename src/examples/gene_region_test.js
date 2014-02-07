define   (
[
    'examples/testutils',
    'examples/seqpeek_test',
    'util/data_adapters',
    'util/gene_region_utils',
    'util/region_layouts',
    'region_viewport',
    'seqpeek_context',
    'bar_plot_track'
],
function (
    TestUtils,
    SeqPeekTestPrototype,
    DataAdapters,
    GeneRegionUtils,
    RegionLayouts,
    ViewportFactory,
    SeqPeekContextFactory,
    BarPlotTrackFactory
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

        var region_layout = RegionLayouts.BasicLayoutFactory
            .create({});

        var region_data = GeneRegionUtils.buildRegionsFromArray(regions);
        region_layout.process(region_data);
        var region_metadata = region_layout.getMetadata();

        var track_data = DataAdapters.group_by_location(data_points, 'variant_type', 'coordinate');
        DataAdapters.apply_statistics(track_data, 'phenotype');

        var test_track = BarPlotTrackFactory
            .create()
            .data(track_data, 'variants')
            .regions(region_data, 'coordinate')
            .stem_height(30)
            .height(150);

        DataAdapters.apply_track_statistics(test_track, 'variants');

        var spctx = SeqPeekContextFactory.create(target_el);
        spctx
            .width(1300)
            .scroll_handler(function(event) {
                this._updateViewportTranslation(event.translate);
            })
            .track(test_track)
            .viewport(ViewportFactory.createFromRegionData(region_data, region_metadata, 1300))
            .draw();
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Genomic data rendering";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});