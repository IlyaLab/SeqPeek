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

        setRenderingContext: function(ctx) {
            this.rendering_context = ctx;
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
        draw: function() {
            var ctx = this._getRenderingContext();

            d3.select(ctx.svg)
                .call(this._applySVG, this.data);

            d3.select(ctx.svg)
                .call(this._renderExon);

            d3.select(ctx.svg)
                .call(this._renderNonCoding);
        },

        render: function() {
            var ctx = this._getRenderingContext();

            ctx.svg.attr("transform", function() {
                return "translate(" + ctx.getViewportPosition()['x'] + ",0)";
            });
        }
    };

    return {
        create: function(config) {
            var track = Object.create(RegionTrackPrototype, {});

            track.data = config.data;
            track.dimensions = config.dimensions;

            return track;
        }
    }
});
