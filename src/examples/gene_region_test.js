define   (
[
    'examples/testutils',
    'seqpeek'
],
function (
    TestUtils,
    SeqPeekFactory
) {
    var generate_region = function(transcript, type, start, end) {
        return {
            type: type,
            start: start,
            end: end
        }
    };

    return function(target_el) {
        var data_points = [
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
        ];

        var region_data = [
            ['TEST', 'noncoding', 500, 899],
            ['TEST', 'exon', 900, 2000],
            ['TEST', 'noncoding', 2001, 5999],
            ['TEST', 'exon', 6000, 6200]
        ];

        var regions = _.map(region_data, function(p) {
            return generate_region.apply(this, p);
        });

        var test_track = TestUtils.build_genomic_test_track(regions, data_points);

        _.extend(test_track, {
            color_by: _.extend(test_track.color_by, {
                color_scale: d3.scale.ordinal().domain(['true', 'false', 'na']).range(['#1f77b4', '#ff7f0e', '#ff0000']),
                type: 'log2nabs',
                max_height: 100,
                group_names: ['true', 'false', 'na']
            })
        });


        var data = {
            protein: {
                domains: [],
                length: 100,
                name: 'TEST',
                uniprot_id: 'TEST'
            },
            tracks: [
                _.extend(test_track, {
                    label: 'GENOMIC TRACK'
                })
            ]
        };

        var options = {
            location_tick_height: 25,
            protein_scale: {
                width: 1300,
                vertical_padding: 10
            },
            protein_domains: {
                padding: 10,
                key: 'dbname'
            },
            signature_height: 10,
            enable_transitions: false,
            enable_mutation_stems: true,
            mutation_layout: 'all_subtypes',
            variant_layout: 'all_subtypes',
            mutation_groups: {
                padding: 0,
                stems: {
                    height: 20,
                    stroke_width: 1.0
                }
            },
            mutation_shape_width: 5,
            mutation_order: [
                "SUBSTITUTION",
                "POSSIBLE-SPLICE5/SUBSTITUTION"
            ],
            mutation_sample_id_field: 'source_id',
            mutation_color_field: 'type',
            mutation_colors: {
                SUBSTITUTION: 'red',
                "POSSIBLE-SPLICE5/SUBSTITUTION": 'green',
                Frame_Shift_Del: 'gold',
                Frame_Shift_Ins: 'gold',
                Missense_Mutation: 'blue'
            },
            mutation_label_rows: [
                {label: 'ID', name: 'mutation_id'},
                {label: 'Location', name: 'location'}
            ],
            plot: {
                horizontal_padding: 0,
                vertical_padding: 0
            },
            band_label_width: 180,
            tooltips: {
                interpro: {
                    items: {
                        "DB": function(d) {
                            return d.dbname;
                        },
                        "EVD": function(d) {
                            return d.evd;
                        },
                        "ID": function(d) {
                            return d.id;
                        },
                        "Name": function(d) {
                            return d.name;
                        },
                        "Status": function(d) {
                            return d.status;
                        },
                        "LOC": function(d) {
                            return d.location.start + " - " + d.location.end;
                        }
                    }
                }
            }
        };

        var vis = SeqPeekFactory.create(target_el[0]);
        vis.draw(data, options);
    }
});