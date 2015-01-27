define   (
[
    'vq',
    'src/util/testutils',
    'src/util/data_adapters',
    'src/builders/builder_for_existing_elements',
    'tests/src/test_prototype',

    // Simulated sample data
    'json!../data/tracks/bar_and_region_track_test_data.json',

    // Protein domains
    'json!../data/domains/P04637.json',

    // Regions
    'json!../data/regions/regions.json'
], function (
    vq,

    TestUtils,
    DataAdapters,
    SeqPeekBuilder,

    SeqPeekTestPrototype,

    TrackData,
    DomainData,
    RegionData
) {
    var protein_domain_data = DomainData["matches"];

    var test_function = function(target_el, $testdiv) {
        var data_points = TestUtils.generate_test_data(TrackData["items"], {
            protein_loc: 0,
            coordinate: 1,
            variant_type: 2,
            phenotype: 3
        });

        var regions = _.map(RegionData["items"], function(p) {
            return TestUtils.generate_region.apply(this, p);
        });

        ////////////////////////////////////////
        // Create SVG elements for all tracks //
        ////////////////////////////////////////
        var container_guid = 'C' + vq.utils.VisUtils.guid(),
            vis_svg = d3.select(target_el)
            .append("svg")
            .attr("width", 1300)
            .attr("height", 150 + 150 + 70)
                .attr("id", container_guid)

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

        var protein_domain_track_svg = vis_svg
            .append("g")
            .attr("transform", "translate(0,330)")
            .style("pointer-events", "none");

        //////////////////
        var seqpeek = SeqPeekBuilder.create({
            region_data: regions,
            viewport: {
                width: 1300
            },
            bar_plot_tracks: {
                height: 150,
                stem_height: 30,
                hovercard_content: {
                    "Coordinate": function(d) {
                        return d.coordinate;
                    },
                    "Type": function(d) {
                        return d.type;
                    },
                    "Total samples": function(d) {
                        return d.statistics.total;
                    }
                },
                color_scheme: function(group_name, type_name) {
                    var colors = {
                        'AB': 'blue',
                        'XY': 'green',
                        'CD': 'red'
                    };

                    return colors[type_name];
                }
            },
            sample_plot_tracks: {
                height: 150,
                stem_height: 30,
                color_scheme: function(data_point){
                    var mapping = {
                        'AB': 'blue',
                        'XY': 'green',
                        'CD': 'red'
                    };

                    return mapping[data_point["variant_type"]];
                },
                hovercard_content: {
                    "coordinate": function(d) {
                        return d.coordinate;
                    },
                    "type": function(d) {
                        return d.variant_type;
                    },
                    "phenotype": function(d) {
                        return d.phenotype;
                    }
                }
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

        seqpeek.addBarPlotTrackWithArrayData(data_points, bar_plot_track_svg, {
            guid: container_guid
        });
        seqpeek.addSamplePlotTrackWithArrayData(data_points, lollipop_track_svg, {
            guid: container_guid
        });
        seqpeek.addRegionScaleTrackToElement(region_track_svg, {
            guid: container_guid
        });
        seqpeek.addTickTrackToElement(tick_track_svg);
        seqpeek.addProteinDomainTrackToElement(protein_domain_data, protein_domain_track_svg, {
            guid: container_guid
        });

        seqpeek.createInstances();

        seqpeek.setTrackHeightsByStatistics('bar_plot');
        var bar_plot_track_heights = seqpeek.getTrackHeights('bar_plot');
        bar_plot_track_svg.attr("height", d3.sum(bar_plot_track_heights));

        seqpeek.setTrackHeightsByStatistics('sample_plot');
        var sample_track_heights = seqpeek.getTrackHeights('sample_plot');
        lollipop_track_svg.attr("height", d3.sum(sample_track_heights));

        seqpeek.render();

        // Bind buttons
        $testdiv.find("#enable-zoom").on("click", function() {
            seqpeek.toggleZoomMode();
        });

        $testdiv.find("#enable-selection").on("click", function() {
            seqpeek.toggleSelectionMode();
        });
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Genomic data rendering";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});