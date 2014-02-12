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
