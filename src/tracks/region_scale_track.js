define   (
[
    'd3',
    'underscore'
],
function(
    d3,
    _
) {
    var RegionTrackPrototype = {
        getHeight: function() {
            return this.dimensions.height;
        },

        _buildHovercardHandler: function() {
            var handler_params = _.extend(this.config.hovercard.config, {
                canvas_id: this.config.guid,
                data_config: this.config.hovercard.content
            });

            if (this.config.hovercard.enable_tools) {
                handler_params.tool_config = this.config.hovercard.links;
            }

            return vq.hovercard(handler_params);
        },

        _applySVG: function() {
            var self = this,
                ctx = this._getRenderingContext();

            var regions_g = ctx.svg.selectAll("g.region")
                .data(self.region_data)
                .enter()
                    .append("g")
                    .attr("class", function(d) {
                        return "region " + d.type
                    })
                    .attr("transform", function(d) {
                        return "translate(" + d.layout.screen_x + ",0)";
                    });

            if (this.config.hovercard.enable || this.config.hovercard.enable_tools) {
                var handler = this._buildHovercardHandler();

                regions_g
                    .each(function() {
                        d3.select(this).on("mouseover", function(d) {
                            handler.call(this, d);
                        });
                    });
            }
        },

        _renderExon: function() {
            var self = this,
                ctx = this._getRenderingContext();

            ctx.svg.selectAll(".region.exon")
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
                            return 0.0;
                        })
                        .attr("height", self.getHeight())
                        .style("fill", "lightgray")
                        .style("stroke", "lightgray");
                });
        },

        _renderNonCoding: function() {
            var self = this,
                ctx = this._getRenderingContext();

            ctx.svg.selectAll(".region.noncoding")
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
                            return self.getHeight() / 2.0 - 2.5;
                        })
                        .attr("height", 5.0)
                        .style("fill", "gray")
                        .style("stroke", "gray");
                });
        },

        //////////////
        // Data API //
        //////////////
        data: function(region_data) {
            this.region_data = region_data;

            return this;
        },

        height: function(height) {
            this.dimensions = {
                height: height
            };

            return this;
        },

        guid: function(value) {
            this.config.guid = value;

            return this;
        },

        hovercard_config: function(value) {
            this.config.hovercard.config = value;

            return this;
        },

        hovercard_content: function(value) {
            this.config.hovercard.enable = true;
            this.config.hovercard.content = value;

            return this;
        },

        hovercard_links: function(value) {
            this.config.hovercard.enable_tools = true;
            this.config.hovercard.links = value;

            return this;
        },
        ///////////////
        // Brush API //
        ///////////////
        supportsSelection: function() {
            return false;
        },

        ///////////////////
        // Rendering API //
        ///////////////////
        draw: function() {
            this._applySVG();
            this._renderExon();
            this._renderNonCoding();
        },

        render: function() {
            var ctx = this._getRenderingContext();

            ctx.svg.attr("transform", function() {
                var trs =
                    "translate(" + ctx.getViewportPosition().x + ",0)" +
                    "scale(" + ctx.getViewportScale() + ",1)";

                return trs;
            });
        }
    };

    return {
        create: function() {
            var track = Object.create(RegionTrackPrototype, {});
            track.config = {
                hovercard: {
                    enable: false,
                    enable_tools: false
                }
            };
            return track;
        }
    }
});
