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

        _applySVG: function() {
            var self = this,
                ctx = this._getRenderingContext();

            ctx.svg.selectAll("g.region")
                .data(self.region_data)
                .enter()
                    .append("g")
                    .attr("class", function(d) {
                        return "region " + d.type
                    })
                    .attr("transform", function(d) {
                        return "translate(" + d.layout.screen_x + ",0)";
                    });
        },

        _renderExon: function() {
            var self = this,
                ctx = this._getRenderingContext();

            ctx.svg.selectAll(".region.exon")
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
                            return d.layout.screen_height - 2.5;
                        })
                        .attr("height", 5)
                        .style("fill", "blue")
                        .style("stroke", "blue");
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
                return "translate(" + ctx.getViewportPosition().x + ",0)";
            });
        }
    };

    return {
        create: function() {
            var track = Object.create(RegionTrackPrototype, {});

            return track;
        }
    }
});
