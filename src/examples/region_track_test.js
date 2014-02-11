define   (
[
    'examples/testutils',
    'examples/seqpeek_test',
    'util/data_adapters',
    'util/gene_region_utils',
    'util/region_layouts',
    'region_viewport',
    'seqpeek_context',
    'region_scale_track'
],
function (
    TestUtils,
    SeqPeekTestPrototype,
    DataAdapters,
    GeneRegionUtils,
    RegionLayouts,
    ViewportFactory,
    SeqPeekContextFactory,
    RegionTrackFactory
) {
    var generate_region = function(transcript, type, start, end) {
        return {
            type: type,
            start: start,
            end: end
        };
    };

    var test_function = function(target_el) {
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

        var region_track = RegionTrackFactory
            .create()
            .height(30)
            .data(region_data);

        var viewport = ViewportFactory.createFromRegionData(region_data, region_metadata, 1300);

        var spctx = SeqPeekContextFactory.createIntoDiv(target_el);
        spctx
            .width(1300)
            .scroll_handler(function(event) {
                viewport.setViewportPosition({
                    x: event.translate[0],
                    y: 0
                });

                this._updateViewportTranslation();
            })
            .track(region_track)
            .viewport(viewport)
            .draw();
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Region rendering test";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});