define   (
[
    'd3',
    'vq',
    'underscore',

    'seqpeek_scaling',
    'util/data_adapters'
],
function(
    d3,
    vq,
    _,
    ScalingFunctions,
    DataAdapters
) {
    _createNormalizedLinearBars = function(track, samples_by_categories) {
        var category_sizes = track.statistics.by_category,
            min_height = 10.0,
            max_height = 300.0,
            pixels_per_sample = 200.0;

        var bars = _.reduce(_.keys(samples_by_categories), function(memo, group_name) {
            if (_.has(samples_by_categories, group_name)) {
                var number = samples_by_categories[group_name],
                    cat_size = category_sizes[group_name],
                    height;

                if (cat_size !== undefined && cat_size > 0) {
                    height = pixels_per_sample * (number / cat_size)
                }
                else {
                    height = 0;
                }

                if (number > 0) {
                    memo.array.push({
                        height: height,
                        y: memo.current_y
                    });

                    memo.current_y += height;
                }
            }

            return memo;
        }, {
            array: [],
            current_y: 0
        });

        // Scale if needed
        if (bars.current_y <= min_height || max_height <= bars.current_y) {
            var total_height = d3.min([d3.max([bars.current_y, min_height]), max_height]),
                k = total_height / bars.current_y;

            return _.reduce(bars.array, function(memo, bar) {
                var height = k * bar.height;

                memo.array.push({
                    height: height,
                    y: memo.current_y
                });

                memo.current_y += height;

                return memo;
            },{
                array: [],
                current_y: 0
            });
        }
        else {
            return bars;
        }
    };

    var BarPlotTrackPrototype = {
        getHeight: function() {
            return this.dimensions.height;
        },

        setRenderingContext: function(ctx) {
            this.rendering_context = ctx;
        },

        _applyStackedBarRenderData: function(track, data_info) {
            var data_accessor = DataAdapters.make_accessor(data_info);

            DataAdapters.apply_to_variant_types(data_accessor(track), function(type_data, memo) {
                type_data.render_data = _createNormalizedLinearBars(track, type_data.statistics.by_category);
            });
        },

        //////////////
        // Data API //
        //////////////
        data: function(data, data_key) {
            this._applyStackedBarRenderData(data, data_key);
            this.location_data = data;

            return this;
        },

        height: function(height) {
            this.dimensions = {
                height: height
            };

            return this;
        },

        ///////////////////
        // Rendering API //
        ///////////////////
        draw: function() {
            var ctx = this._getRenderingContext();
        },

        render: function() {
            var ctx = this._getRenderingContext();
        }
    };

    return {
        create: function(config) {
            var track = Object.create(BarPlotTrackPrototype, {});

            return track;
        }
    }
});
