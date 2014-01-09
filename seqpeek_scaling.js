define([
    'd3',
    'underscore'
],
function(
    d3,
    _
) {
    return {
        createFractionalBars: function(track, color_by, samples_by_categories, param_statistics) {
            var total_samples = _.reduce(samples_by_categories, function(memo, value, key) {
                return memo + value;
            }, 0);

            return _.reduce(color_by.group_names, function(memo, group_name) {
                if (_.has(samples_by_categories, group_name)) {
                    var number = samples_by_categories[group_name],
                        fract = number / total_samples,
                        height = fract * color_by.max_height;

                    memo.array.push({
                        height: height,
                        color: color_scale(group_name),
                        y: memo.current_y
                    });

                    memo.current_y += height;
                }

                return memo;
            }, {
                array: [],
                current_y: 0
            });
        },

        createLinearBars: function(track, color_by, samples_by_categories, param_statistics) {
            var pixels_per_sample = 1,
                category_max_height = color_by.max_height / _.keys(samples_by_categories).length;

            var log_scale = d3.scale
                .log().base([2])
                .domain([1.0, param_statistics.max_samples_in_location])
                .range([5, category_max_height]);

            var bars = _.reduce(color_by.group_names, function(memo, group_name) {
                if (_.has(samples_by_categories, group_name)) {
                    var number = samples_by_categories[group_name],
                        height = log_scale(d3.max([1.0, number]));

                    if (number > 0) {
                        memo.array.push({
                            height: height,
                            color: color_by.color_scale(group_name),
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

            return bars;
        },

        createLog2Bars: function(track, color_by, samples_by_categories, param_statistics) {
            var category_max_height = color_by.max_height / _.keys(samples_by_categories).length;

            var log_scale = d3.scale
                .log().base([2])
                .domain([1.0, param_statistics.max_samples_in_location])
                .range([5, category_max_height]);

            var bars = _.reduce(color_by.group_names, function(memo, group_name) {
                if (_.has(samples_by_categories, group_name)) {
                    var number = samples_by_categories[group_name],
                        height = log_scale(d3.max([1.0, number]));

                    if (number > 0) {
                        memo.array.push({
                            height: height,
                            color: color_by.color_scale(group_name),
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

            return bars;
        },

        createNormalizedLinearBars: function(track, color_by, samples_by_categories, param_statistics) {
            var category_sizes = color_by.category_sizes,
                min_height = color_by.min_height,
                max_height = color_by.max_height,
                pixels_per_sample = color_by.pixels_per_sample;

            var bars = _.reduce(color_by.group_names, function(memo, group_name) {
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
                            color: color_by.color_scale(group_name),
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
                        color: bar.color,
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
        },

        createNormalizedLogBars: function(track, color_by, samples_by_categories, param_statistics) {
            var category_sizes = color_by.category_sizes,
                category_max_height = color_by.max_height / _.keys(category_sizes).length;

            var log_scale = d3.scale
                .log().base([2])
                .domain([1.0, color_by.category_sum])
                .range([5, color_by.max_height]);

            var bars = _.reduce(color_by.group_names, function(memo, group_name) {
                if (_.has(samples_by_categories, group_name)) {
                    var number = samples_by_categories[group_name],
                        cat_size = category_sizes[group_name],
                        height = d3.max([1.0, category_max_height * (number / cat_size)]);

                    if (number > 0) {
                        memo.array.push({
                            height: height,
                            color: color_by.color_scale(group_name),
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

            var total_height = log_scale(bars.current_y),
                k = total_height / bars.current_y;

            return _.reduce(bars.array, function(memo, bar) {
                var height = k * bar.height;

                memo.array.push({
                    height: height,
                    color: bar.color,
                    y: memo.current_y
                });

                memo.current_y += height;

                return memo;
            },{
                array: [],
                current_y: 0
            });
        }
    }
});