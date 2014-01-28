define   (
[
    'examples/testutils',
    'examples/gene_region_test',

    'seqpeek'
],
function (
    TestUtils,
    GeneRegionTest,
    SeqPeekFactory
) {
    var Tests = {
        absolute_log2_test: function(target_el) {
            var data_points = [
                [10, 'AB', 'false'],
                [10, 'AB', 'true'],

                [20, 'AB', 'false'],
                [20, 'AB', 'false'],
                [20, 'AB', 'true'],

                // Three markers in a location
                [30, 'AB', 'true'],
                [30, 'AB', 'true'],
                [30, 'AB', 'true'],

                // One marker in a location
                [50, 'AB', 'false'],

                // Two markers of different type in same location
                [60, 'AB', 'false'],
                [60, 'CD', 'false'],

                // Two markers of same type in same location
                [70, 'AB', 'false'],
                [70, 'AB', 'false'],

                // Two markers of same type in same location
                [80, 'AB', 'true'],
                [80, 'AB', 'true'],

                // Four markers of same type in same location, both categories equally
                [90, 'AB', 'false'],
                [90, 'AB', 'false'],
                [90, 'AB', 'true'],
                [90, 'AB', 'true']
            ];

            var test_track = TestUtils.build_protein_test_track({
                data: TestUtils.generate_test_data(data_points, {
                    location: 0,
                    value: 2
                })
            });

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
                        label: 'PROTEIN TRACK'
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
        },

        gene_region_test: GeneRegionTest
    };

    return Tests;
});