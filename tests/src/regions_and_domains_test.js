define   (
[
    'vq',
    'src/util/testutils',
    'src/util/data_adapters',
    'src/builders/builder_for_existing_elements',
    'src/helpers/visquick_hovercard_adapter',
    'tests/src/test_prototype',

    // Protein domains
    'json!../data/domains/P04637.json',

    // Regions
    'json!../data/regions/regions.json'
], function (
    vq,

    TestUtils,
    DataAdapters,
    SeqPeekBuilder,
    VqHovercardAdapterFactory,

    SeqPeekTestPrototype,

    DomainData,
    RegionData
) {
    var protein_domain_data = DomainData["matches"];

    var test_function = function(target_el, $testdiv) {
        var regions = _.map(RegionData["items"], function(p) {
            return TestUtils.generate_region.apply(this, p);
        });

        ////////////////////////////////////////
        // Create SVG elements for all tracks //
        ////////////////////////////////////////
        var vis_svg = d3.select(target_el)
                .append("svg")
                .attr("width", 1300)
                .attr("height", 100)
                .style("pointer-events", "none");

        var region_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0, 0)")
            .style("pointer-events", "none");

        var tick_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0, 30)")
            .style("pointer-events", "none");

        var protein_domain_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0, 70)")
            .style("pointer-events", "none");

        //////////////////
        var seqpeek = SeqPeekBuilder.create({
            region_data: regions,
            viewport: {
                width: 1300
            },
            protein_domain_tracks: {
                source_key: 'dbname',
                source_order: ['SMART', 'PFAM', 'PROFILE'],
                color_scheme: {
                    'PFAM': 'lightgray',
                    'SMART': 'gray'
                }
            },
            region_layout: {
                intron_width: 50
            },
            variant_layout: {
                variant_width: 5.0
            },
            variant_data_location_field: 'coordinate',
            variant_data_type_field: 'variant_type',
            selection_handler: function(ids) {
                console.log(ids);
            },
            variant_data_source_field: function(data_point) {
                return data_point["protein_loc"] + "-" +
                    data_point["variant_type"];
            }
        });

        var vq_adapter = VqHovercardAdapterFactory.create(vis_svg[0][0], {
                include_header: true,
                include_footer: true,
                self_hover: true,
                timeout: 200
        });

        seqpeek.addRegionScaleTrackToElement(region_track_svg, {
            mouseover_handler: vq_adapter.getHandler({
                "Coordinates": function(d) {
                    return d.start + " - " + d.end;
                },
                "Type": function(d) {
                    return d.type;
                }
            }, [])
        });

        seqpeek.addTickTrackToElement(tick_track_svg);
        seqpeek.addProteinDomainTrackToElement(protein_domain_data, protein_domain_track_svg, { });

        seqpeek.createInstances();

        seqpeek.render();
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Genomic data rendering";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});