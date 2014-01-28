define   (
[

],
function (

) {
    var _make_accessor = function(param) {
        if (_.isFunction(param)) {
            return param;
        }
        else {
            return function(v) {
                return v[param];
            }
        }
    };

    var _apply_to_variant_types = function(param_data, fn, memo) {
        _.each(param_data, function(data_by_location, location) {
            _.each(data_by_location, function(data_by_type, type) {
                _.each(data_by_location.types, function(type_data) {
                    fn(type_data, memo);
                });
            });
        });
    };

    return {
        make_accessor: _make_accessor,
        apply_to_variant_types: _apply_to_variant_types,

        group_by_location: function(param_data, type_info, location_info) {
            var type_iter = _make_accessor(type_info);
            var location_iter = _make_accessor(location_info);
            return _.chain(param_data)
                .groupBy(location_iter)
                .map(function(data_points_by_location, location) {
                    return {
                        coordinate: parseInt(location),
                        types: _.chain(data_points_by_location)
                            .groupBy(type_iter)
                            .map(function(data, type_key) {
                                return {
                                    type: type_key,
                                    data: data
                                }
                            })
                            .value()
                    };
                })
                .value();
        },

        apply_statistics: function(param_data, value_info) {
            var value_iter = _make_accessor(value_info);

            _apply_to_variant_types(param_data, function(type_data, memo) {
                type_data.statistics = {
                    by_category: _.countBy(type_data.data, value_iter)
                };
            });
        }
    }
});