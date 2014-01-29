define   (
[
    'examples/testutils',
    'util/data_adapters',
    'util/gene_region_utils',
    'seqpeek_context',
    'region_scale_track'
],
function (
    TestUtils,
    DataAdapters,
    GeneRegionUtils,
    SeqPeekContextFactory,
    RegionTrackFactory
) {
    var generate_region = function(transcript, type, start, end) {
        return {
            type: type,
            start: start,
            end: end
        }
    };

    return function(target_el) {
        var region_data = [
            ['TEST', 'noncoding', 500, 899],
            ['TEST', 'exon', 900, 2000],
            ['TEST', 'noncoding', 2001, 5999],
            ['TEST', 'exon', 6000, 6200]
        ];

        var regions = _.map(region_data, function(p) {
            return generate_region.apply(this, p);
        });

        var region_track = RegionTrackFactory.create({
            data: GeneRegionUtils.buildRegionsFromArray(regions),
            dimensions: {
                height: 30
            }
        });

        var seqpeek_data = {
            track: region_track

        };

        var spctx = SeqPeekContextFactory.create(target_el[0]);
        spctx.draw(seqpeek_data, {
            dimensions: {
                width: 1300
            }
        });
    }
});