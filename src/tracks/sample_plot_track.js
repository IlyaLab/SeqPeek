define   (
[
    'd3',
    'underscore',

    '../util/data_adapters',
    '../util/gene_region_utils',
    '../seqpeek_scaling'
],
function(
    d3,
    _,
    DataAdapters,
    GeneRegionUtils,
    ScalingFunctions
) {
    var SAMPLE_GLYPH_RADIUS = 2.5;

    var SamplePlotTrackPrototype = {
        getHeight: function() {
            return this.dimensions.height;
        },

        _applySampleBasedRenderData: function(data) {
            var self = this,
                scaling_function = ScalingFunctions.getScalingFunctionByType(this.config.scaling.type),
                category_totals = this.config.category_totals,
                render_info = _.extend(this.config.scaling, {
                    category_colors: self.config.color_scheme
                });

            DataAdapters.apply_to_variant_types(data, function(type_data, memo) {
                var render_data = {
                    array: []
                };

                _.each(type_data.data, function(data_point, index) {
                    render_data.array.push(_.extend(data_point, {
                        color: 'blue',
                        r: SAMPLE_GLYPH_RADIUS,
                        height: SAMPLE_GLYPH_RADIUS
                    }));
                });

                type_data.render_data = render_data;
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

        _buildSampleRenderData: function() {
            var self = this,
                ctx = this._getRenderingContext(),
                variant_layout = this.getVariantLayout(),
                viewport_x = ctx.getViewportPosition().x,
                sample_rendering_data = [],
                sample_base_y = this.dimensions.height - this.config.stem_height;

            DataAdapters.apply_to_variant_types(this.visible_data, function(type_data, memo, data_by_location)  {
                var coordinate = data_by_location.coordinate,
                    current_y = sample_base_y + SAMPLE_GLYPH_RADIUS;

                _.each(type_data.render_data.array, function(sample_data_point) {
                    current_y = current_y - 2.0 * SAMPLE_GLYPH_RADIUS;
                    sample_rendering_data.push(_.extend(sample_data_point, {
                        y: current_y,
                        screen_x: variant_layout.getScreenLocationForVariant(coordinate, type_data) + viewport_x
                    }));
                });
            }, {});

            this.render_data.samples = sample_rendering_data;
        },

        _buildStemRenderData: function() {
            var self = this,
                ctx = this._getRenderingContext(),
                variant_layout = this.getVariantLayout(),
                viewport_x = ctx.getViewportPosition().x;

            var stem_rendering_data = [];

            GeneRegionUtils.iterateDataWithRegions(this.region_data, this.visible_data, 'coordinate', function(d) {
                var region = d.region;

                DataAdapters.apply_to_variant_types([d.data], function(type_data, memo, location_data) {
                    var coordinate = location_data.coordinate,
                        stem_start_x = region.layout.get_screen_location_for_coordinate(coordinate, ctx),
                        stem_end_x = variant_layout.getScreenLocationForVariant(coordinate, type_data) + viewport_x;

                    stem_rendering_data.push({
                        sx: stem_start_x,
                        sy: self.dimensions.height,
                        tx: stem_end_x,
                        ty: self.dimensions.height - self.config.stem_height,
                        coordinate: coordinate
                    });
                });
            });

            this.render_data.stems = stem_rendering_data;
        },

        getVariantLayout: function() {
            return this.config.variant_layout;
        },

        //////////////
        // Data API //
        //////////////
        data: function(data, data_key) {
            this.location_data = data;
            DataAdapters.apply_track_statistics(this, 'location_data');

            return this;
        },

        regions: function(region_data, param_coordinate_getter) {
            this.region_data = region_data;

            return this;
        },

        color_scheme: function(color_scheme) {
            this.config.color_scheme = color_scheme;

            return this;
        },

        height: function(height) {
            this.dimensions = {
                height: height
            };

            return this;
        },

        bar_width: function(value) {
            this.config.bar_width = value;

            return this;
        },

        stem_height: function(height) {
            this.config.stem_height = height;

            return this;
        },

        variant_layout: function(layout_object) {
            this.config.variant_layout = layout_object;

            return this;
        },

        //////////////
        // Plot API //
        //////////////
        category_totals: function() {
            this.config.category_totals = arguments[0];

            return this;
        },

        scaling: function(config) {
            this.config.scaling = config;

            return this;
        },

        //////////////////////////////////
        // Internal rendering functions //
        //////////////////////////////////
        _renderSampleGlyphs: function() {
            var self = this,
                ctx = this._getRenderingContext();

            ctx.svg
                .selectAll(".variant")
                .remove();

            ctx.svg
                .selectAll(".variant")
                .data(self.render_data.samples)
                .enter()
                .append("svg:circle")
                .attr("class", "variant")
                .attr("cx", function(d) {
                    return d.screen_x;
                })
                .attr("cy", function(d) {
                    return d.y;
                })
                .attr("r",  function(d) {
                    return d.r;
                })
                .style("fill", function(d) {
                    return d.color;
                });
        },

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
            this._applySampleBasedRenderData(this.location_data);

            this.render();
        },

        render: function() {
            this._updateVisibleData();

            this._buildStemRenderData();
            this._renderStems();

            this._buildSampleRenderData();
            this._renderSampleGlyphs();
        }
    };

    return {
        create: function(config) {
            var track = Object.create(SamplePlotTrackPrototype, {});
            track.config = {};
            track.render_data = {};
            return track;
        }
    }
});
