define (
[
    'util/data_adapters',
    'util/gene_region_utils'
],
function (
    DataAdapters,
    GeneRegionUtils
) {
    var _put_variant_screen_location = function(target, location, type, value) {
        target[location + '-' + type] = value;
    };

    var _get_variant_screen_location = function(target, location, type, value) {
        return target[location + '-' + type];
    };

    var VariantLayoutPrototype = {
        init: function() {
            this.data_array = [];

            return this;
        },

        location_field: function(field_name) {
            this.location_accessor = DataAdapters.make_accessor(field_name);

            return this;
        },

        variant_type_field: function(field_name) {
            this.variant_type_accessor = DataAdapters.make_accessor(field_name);

            return this;
        },

        variant_width: function(value) {
            this.variant_width_value = value;

            return this;
        },

        add_track_data: function(data) {
            this.data_array.push.apply(this.data_array, data);

            return this;
        },

        regions: function(region_data) {
            this.region_data = region_data;

            return this;
        },

        process: function() {
            this.data_array = _.sortBy(this.data_array, function(d) {
                return d.coordinate;
            });

            this.grouped_data = DataAdapters.group_by_location(this.data_array, this.variant_type_accessor, this.location_accessor);

            return this;
        },

        _findScreenLocationForFirstType: function() {

        },

        doLayoutForViewport: function(visible_coordinates, viewport_x) {
            var self = this,
                start = visible_coordinates[0],
                stop = visible_coordinates[1],
                current_location = 0.0;

            var visible_data_points = _.chain(this.grouped_data)
                .filter(function(data_point) {
                    var coordinate = self.location_accessor(data_point);

                    return start <= coordinate && coordinate <= stop;
                })
                .value();

            this.layout_map = {};
            GeneRegionUtils.iterateDataWithRegions(this.region_data, visible_data_points, this.location_accessor, function(d) {
                var location = self.location_accessor(d.data),
                    coordinate_center = d.region.layout.get_location_in_local_scale(location),
                    region_start_screen_location = d.region.layout.get_location_in_local_scale(d.region.start),
                    num_types = d.data.types.length,
                    group_width = num_types * self.variant_width_value,
                    type_scale = d3.scale.ordinal()
                        .domain(_.pluck(d.data.types, 'type'))
                        .range([0, group_width]);

                current_location = _.max(
                    [
                        current_location + group_width / 2.0,
                        coordinate_center - group_width / 2.0
                    ]);

                _.chain(d.data.types)
                    .sortBy(function(type_data) {
                        return type_data.type;
                    })
                    .each(function(type_data) {
                        var variant_screen_location = current_location + type_scale(type_data.type);
                        _put_variant_screen_location(self.layout_map, location, type_data.type, variant_screen_location);
                    });

                current_location += group_width / 2.0;
            });

            return this;
        },

        getScreenLocationForVariant: function(coordinate, type) {
            return _get_variant_screen_location(this.layout_map, coordinate, type);
        }
    };

    return {
        create: function() {
            var obj = Object.create(VariantLayoutPrototype, {});
            obj.init();
            return obj;
        }
    }
});
