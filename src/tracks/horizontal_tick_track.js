define (
[
    'd3',
    'underscore'
],
function(
    d3,
    _
) {
    var LocationDisplayTrackPrototype = {
        init: function() {
            this.current_scale = null;
        },

        getHeight: function() {
            return this.dimensions.height;
        },

        _getRegionID: function(region) {
            return region.start + '+' + region.end + '+' + region.type;
        },

        _getTicksForRegion: function(region) {
            return this.region_ticks[this._getRegionID(region)];
        },

        _buildScales: function() {
            var self = this,
                ctx = this._getRenderingContext(),
                viewport = ctx.getViewport(),
                region_ticks = {};

            _.chain(this.region_data)
                .filter(function(region) {
                    return region.type == 'exon';
                })
                .each(function(region) {
                    var id = self._getRegionID(region);

                    var region_start_on_screen = viewport._getScaleLocationFromCoordinate(region.start);
                    var region_end_on_screen = viewport._getScaleLocationFromCoordinate(region.end);

                    var scale =  d3.scale
                        .linear()
                        .domain([region.start, region.end])
                        .range([region_start_on_screen, region_end_on_screen]);

                    var num_ticks = Math.floor((region_end_on_screen - region_start_on_screen) / 100);
                    var ticks = scale.ticks(num_ticks);

                    region_ticks[id] = _.map(ticks, function(tick_coordinate) {
                        return {
                            tick_text: tick_coordinate,
                            x: scale(tick_coordinate)
                        };
                    });
                });

            this.region_ticks = region_ticks;
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

            ctx.svg.selectAll(".region.exon .location-tick")
                .remove();

            ctx.svg.selectAll(".region.exon")
                .each(function() {
                    // Tick locations
                    var tick_g = d3.select(this)
                        .selectAll(".location-tick")
                        .data(function(region) {
                            return self._getTicksForRegion(region);
                        })
                        .enter()
                        .append("svg:g")
                        .attr("class", "location-tick")
                        .attr("transform", function(d) {
                            return "translate(" + d.x + ",0)";
                        });

                    // Tick marks
                    tick_g
                        .append("svg:line")
                        .attr("y1", 0)
                        .attr("y2", self.config.tick_height)
                        .style("stroke", "lightgray");

                    // Tick labels
                    tick_g
                        .append("svg:text")
                        .text(function(d) {
                            return d.tick_text;
                        })
                        .attr("y", self.config.tick_text_y)
                        .style("text-anchor", "middle");
                });
        },

        _renderNonCoding: function() {
            var self = this,
                ctx = this._getRenderingContext();

            // TODO
            // Implement some kind of indicator for non-coding regions
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

        tick_height: function(height) {
            this.config.tick_height = height;

            return this;
        },

        tick_text_y: function(value) {
            this.config.tick_text_y = value;

            return this;
        },

        ///////////////////
        // Rendering API //
        ///////////////////
        draw: function() {
            this._applySVG();

            this.render();
        },

        render: function() {
            var ctx = this._getRenderingContext(),
                scale = ctx.getViewport().getViewportScale();

            // Generate new ticks only if viewport zoom has changed since last render
            if (scale != this.current_scale) {
                this._buildScales();

                this._renderExon();
                this._renderNonCoding();

                this.current_scale = scale;
            }

            ctx.svg.attr("transform", function() {
                return "translate(" + ctx.getViewportPosition().x + ",0)";
            });
        }
    };

    return {
        create: function() {
            var obj = Object.create(LocationDisplayTrackPrototype, {});
            obj.config = {};
            obj.init();
            return obj;
        }
    }
});
