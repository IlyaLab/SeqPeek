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
    var RegionTrackPrototype = {
        getHeight: function() {
            return this.dimensions.height;
        },

        getRenderingContext: function() {
            return this.rendering_context;
        },

        setRenderingContext: function(ctx) {
            this.rendering_context = ctx;
        },

        applyStackedBarRenderData: function(track, data_info) {
            var data_accessor = DataAdapters.make_accessor(data_info);

            DataAdapters.apply_to_variant_types(data_accessor(track), function(type_data, memo) {
                type_data.render_data = _createNormalizedLinearBar(track, type_data.statistics.by_category);
            });
        },

        _scroll: function() {

        },

        _regionLayout: function(region_data) {
            var self = this,
                current_loc = 0;

            _.each(region_data, function(region) {
                var start = isNaN(region.start) ? 0 : region.start,
                    region_end = region.end;

                var width;

                if (region.type == 'exon') {
                    width = region_end - start;
                }
                else {
                    width = 10;
                }

                var coordinate_scale = d3.scale.linear().domain([start, region_end]).range([current_loc, current_loc + width]);
                var inverse_scale = d3.scale.linear().domain([0, width]).range([start, region_end]);

                region.layout = {
                    screen_x: current_loc,
                    screen_width: width,
                    screen_height: self.dimensions.height / 2.0,
                    coordinate_scale: coordinate_scale,
                    inverse_scale: inverse_scale,
                    get_screen_location_for_coordinate: function(coordinate) {
                        var ctx = self.getRenderingContext();

                        return coordinate_scale(coordinate) + ctx.getViewportPosition()['x'];
                    }
                };

                current_loc = current_loc + width + 1;
            });

            return {
                start_coordinate: region_data[0].start,
                end_coordinate: _.last(region_data).end,
                total_width:  current_loc - 1
            };
        },

        processData: function() {
            this._regionLayout(this.data);
        },

        _applySVG: function(selection, region_data) {
            selection
                .each(function() {
                    this.selectAll("g.region")
                        .data(region_data)
                        .enter()
                        .append("g")
                        .attr("class", function(d) {
                            return "region " + d.type
                        })
                        .attr("transform", function(d) {
                            return "translate(" + d.layout.screen_x + ",0)";
                        });
                });
        },

        _renderExon: function(selection) {
            selection.each(function() {
                this.selectAll(".region.exon")
                    .each(function() {
                        d3.select(this)
                            .append("svg:line")
                            .attr("class", "x-scale")
                            .attr("x1", function(d) {
                                return 0.0;
                            })
                            .attr("x2", function(d) {
                                return d.layout.screen_width;
                            })
                            .attr("y1", function(d) {
                                return d.layout.screen_height;
                            })
                            .attr("y2", function(d) {
                                return d.layout.screen_height;
                            })
                            .style("stroke", "black");
                    });

            });
        },

        _renderNonCoding: function(selection) {
            selection.each(function() {
                this.selectAll(".region.noncoding")
                    .each(function() {
                        d3.select(this)
                            .append("svg:rect")
                            .attr("class", "x-scale")
                            .attr("x", function(d) {
                                return 0.0;
                            })
                            .attr("width", function(d) {
                                return d.layout.screen_width;
                            })
                            .attr("y", function(d) {
                                return d.layout.screen_height - 2.5;
                            })
                            .attr("height", 5)
                            .style("fill", "blue")
                            .style("stroke", "blue");
                    });

            });
        },

        ///////////////////
        // Rendering API //
        ///////////////////
        render: function() {
            var ctx = this.getRenderingContext();

            d3.select(ctx.svg)
                .call(this._applySVG, this.data);

            d3.select(ctx.svg)
                .call(this._renderExon);

            d3.select(ctx.svg)
                .call(this._renderNonCoding);
        }
    };

    return {
        create: function(config) {
            var track = Object.create(RegionTrackPrototype, {});

            track.data = config.data;
            track.dimensions = config.dimensions;

            track.processData();

            return track;
        }
    }
});
