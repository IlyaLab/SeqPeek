define   (
[
    'vq',
    'examples/testutils',
    'examples/seqpeek_test',
    'util/data_adapters',

    '../builders/builder_for_existing_elements'

],
function (
    vq,

    TestUtils,
    SeqPeekTestPrototype,
    DataAdapters,

    SeqPeekBuilder
) {
    var protein_domain_data = [
        {
            "status": "T",
            "name": "P53_tetramer",
            "evd": "HMMPfam",
            "locations": [
                {
                    "start": 1000,
                    "score": 9.299999999999977e-20,
                    "end": 1100
                }
            ],
            "id": "PF07710",
            "ipr": {
                "type": "Domain",
                "id": "IPR010991",
                "name": "p53, tetramerisation domain"
            },
            "dbname": "PFAM"
        },
        {
            "status": "T",
            "name": "P53",
            "evd": "HMMPfam",
            "locations": [
                {
                    "start": 1200,
                    "score": 1.1000000000000125e-109,
                    "end": 1300
                }
            ],
            "id": "PF00870",
            "ipr": {
                "parent_id": "IPR012346",
                "type": "Domain",
                "id": "IPR011615",
                "name": "p53, DNA-binding domain"
            },
            "dbname": "PFAM"
        },
        {
            "status": "T",
            "name": "P53_TAD",
            "evd": "HMMPfam",
            "locations": [
                {
                    "start": 1800,
                    "score": 1.999999999999999e-10,
                    "end": 6010
                }
            ],
            "id": "PF08563",
            "ipr": {
                "type": "Domain",
                "id": "IPR013872",
                "name": "p53 transactivation domain"
            },
            "dbname": "PFAM"
        },
        {
            "status": "T",
            "name": "DM14",
            "evd": "Smart scan",
            "locations": [
                {
                    "start": 950,
                    "score": 2.4999981195646482e-17,
                    "end": 1050
                },
                {
                    "start": 1250,
                    "score": 4.699982625131954e-35,
                    "end": 1350
                },
                {
                    "start": 1400,
                    "score": 3.3999997243771875e-35,
                    "end": 1450
                }
            ],
            "id": "SM00685",
            "ipr": {
                "type": "Domain",
                "id": "IPR006608",
                "name": "Domain of unknown function DM14"
            },
            "dbname": "SMART"
        }
    ];

    var protein_metadata = {
        "uniprot_id": "P04637",
        "length": 393,
        "id": "509ae7ad2f2636146b308491",
        "name": "P53_HUMAN"
    };

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

                }
            },
            sample_plot_tracks: {
                height: 150,
                stem_height: 30,
                color_scheme: {
                    'AB': 'blue',
                    'XY': 'green',
                    'CD': 'red'
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
            variant_data_type_field: 'variant_type'
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
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Genomic data rendering";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});