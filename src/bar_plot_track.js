define   (
[
    'd3',
    'vq',
    'underscore',

    'seqpeek_scaling',
    'util/data_adapters',
    'util/gene_region_utils'
],
function(
    d3,
    vq,
    _,
    ScalingFunctions,
    DataAdapters,
    GeneRegionUtils
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

        _updateVisibleData: function() {
            var visible_coordinates = this._getRenderingContext().getVisibleCoordinates(),
                start = visible_coordinates[0],
                stop = visible_coordinates[1];

            this.visible_data = _.chain(this.location_data)
                .filter(function(data) {
                    return start <= data.coordinate && data.coordinate <= stop;
                })
                .value();
        },

        _buildStemData: function() {
            var self = this,
                ctx = this._getRenderingContext(),
                visible_coordinates = ctx.getVisibleCoordinates(),
                start = visible_coordinates[0],
                stop = visible_coordinates[1];

            var stem_rendering_data = [];

            _.each(this.region_data, function(region) {
                DataAdapters.apply_to_variant_locations(region.data, function(d) {
                    var coordinate = d.coordinate;

                    if (start <= coordinate && coordinate <= stop) {
                        var screen_x = region.layout.get_screen_location_for_coordinate(coordinate, ctx);

                        stem_rendering_data.push({
                            sx: screen_x,
                            sy: self.dimensions.height,
                            tx: screen_x,
                            ty: self.dimensions.height - self.config.stem_height,
                            coordinate: coordinate
                        });
                    }
                }, {});
            });

            this.render_data.stems = stem_rendering_data;
        },

        //////////////
        // Data API //
        //////////////
        data: function(data, data_key) {
            this._applyStackedBarRenderData(data, data_key);
            this.location_data = data;

            return this;
        },

        regions: function(region_data, param_coordinate_getter) {
            GeneRegionUtils.fillDataIntoRegions(region_data, this.location_data, param_coordinate_getter);
            this.region_data = region_data;

            return this;
        },

        height: function(height) {
            this.dimensions = {
                height: height
            };

            return this;
        },

        stem_height: function(height) {
            this.config.stem_height = height;

            return this;
        },

        //////////////////////////////////
        // Internal rendering functions //
        //////////////////////////////////
        _renderStems: function() {
            var ctx = this._getRenderingContext();

            var diagonal = d3.svg.diagonal()
                .projection(function(d) {
                    return [d.x, d.y];
                })
                .source(function(d) {
                    return {
                        x: d.sx,
                        y: d.sy
                    };
                })
                .target(function(d) {
                    return {
                        x: d.tx,
                        y: d.ty
                    };
                });

            ctx.svg
                .selectAll(".stem")
                .remove();

            ctx.svg.selectAll(".stem")
                .data(this.render_data.stems)
                .enter()
                .append("svg:path")
                .attr("class", "stem")
                .style("fill", "none")
                .style("stroke", "gray")
                .attr("d", diagonal);
        },

        ///////////////////
        // Rendering API //
        ///////////////////
        draw: function() {
            this.render();
        },

        render: function() {
            this._buildStemData();
            this._renderStems();
        }
    };

    return {
        create: function(config) {
            var track = Object.create(BarPlotTrackPrototype, {});
            track.config = {};
            track.render_data = {};
            return track;
        }
    }
});
