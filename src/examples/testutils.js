define   (
[
    '../util/gene_region_utils'
],
function (
    GeneRegionUtils
) {
    return {
        build_protein_test_track: function(data_points) {
            var sample_cnt = 0;

            var gen_data = function(location, data_id, value) {
                var sample_id = sample_cnt;
                sample_cnt += 1;

                return {
                    location: location,
                    mutation_id: location + '-' + data_id,
                    sample_id: '' + sample_id,
                    source_id: '' + sample_id,
                    value: value
                }
            };

            var display_labels = {
                'true': 'true',
                'false': 'false',
                'na': 'NA'
            };

            var tooltip_items = {
                "Location": function(d) {
                    return d.location;
                },
                "Samples": function(d) {
                    return d.sample_ids.length;
                }
            };


            var data = _.map(data_points, function(p) {
                return gen_data.apply(this, p);
            });


            var category_sizes = _.countBy(data, function(d) {
                return d.value;
            });

            _.each(['true', 'false', 'na'], function(group_label) {
                var display_label = display_labels[group_label];

                tooltip_items[display_label] = function(d) {
                    var category_counts = d.processed_samples.color_by.category_counts,
                        count = 0;

                    if (_.has(category_counts, group_label)) {
                        count = category_counts[group_label];
                    }

                    return count;
                };
            });

            return {
                type: 'protein',
                color_by: {
                    category_sizes: category_sizes
                },

                mutations: data,
                tooltips: {
                    items: tooltip_items
                }
            };
        },

        build_genomic_test_track: function(param_regions, data_points) {
            var sample_cnt = 0;

            var gen_data = function(protein_location, coordinate, data_id, value) {
                var sample_id = sample_cnt;
                sample_cnt += 1;

                return {
                    protein_location: protein_location,
                    coordinate: coordinate,
                    mutation_id: coordinate + '-' + data_id,
                    sample_id: '' + sample_id,
                    source_id: '' + sample_id,
                    value: value
                }
            };

            var display_labels = {
                'true': 'true',
                'false': 'false',
                'na': 'NA'
            };

            var variant_tooltip_items = {
                "Location": function(d) {
                    return d.location;
                },
                "Samples": function(d) {
                    return d.sample_ids.length;
                }
            };

            var region_hovercard_items = {
                "Type": function(d) {
                    return d.type;
                },
                "Coordinates": function(d) {
                    return d.start + ":" + d.end;
                }
            };

            var data = _.map(data_points, function(p) {
                return gen_data.apply(this, p);
            });


            var category_sizes = _.countBy(data, function(d) {
                return d.value;
            });

            _.each(['true', 'false', 'na'], function(group_label) {
                var display_label = display_labels[group_label];

                variant_tooltip_items[display_label] = function(d) {
                    var category_counts = d.processed_samples.color_by.category_counts,
                        count = 0;

                    if (_.has(category_counts, group_label)) {
                        count = category_counts[group_label];
                    }

                    return count;
                };
            });

            var region_data = GeneRegionUtils.buildRegionsFromArray(param_regions);
            GeneRegionUtils.fillDataIntoRegions(region_data, data, 'coordinate');

            return {
                type: 'genomic',
                color_by: {
                    category_sizes: category_sizes
                },
                variants: data,
                variant_coordinate_field: 'coordinate',
                variant_id_field: 'mutation_id',
                region_data: region_data,
                tooltips: {
                    variants: {
                        items: variant_tooltip_items
                    },
                    regions: {
                        items: region_hovercard_items
                    }
                }
            };
        }
    }
// end define
});