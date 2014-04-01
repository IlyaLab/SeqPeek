define   (
[
    'd3',
    'vq',
    'underscore'
],
function(
    d3,
    vq,
    _
) {
    var SeqPeekContextPrototype = {
        _getVisualizationSize: function() {
            return {
                width: this.config.dimensions.width,
                height: this.data.track.getHeight()
            }
        },

        init: function() {
            this.data = {};

            this.vis = {
                viewport_pos: [0, 0],
                viewport_scale: [1, 1]
            };
        },

        initDiv: function(target_div) {
            var self = this;
            this.init();

            target_div.innerHTML = "";

            this.vis.root = d3.select(target_div)
                .append("svg")
                .style("pointer-events", "none");

            this.set_svg_size = _.once(function() {
                self.vis.root
                    .attr("width", self.vis.size_info.width)
                    .attr("height", self.vis.size_info.height);
            });
        },

        initSVG: function(target_svg) {
            this.init();

            this.vis.root = target_svg;

            this.set_svg_size = function() {};
        },

        draw: function() {
            var self = this;

            this.vis.size_info = this._getVisualizationSize();
            this.vis.viewport_size = [this.config.dimensions.width, this.vis.size_info.height];

            // Set the width and height attributes of the SVG element, if the createIntoDiv function
            // was used to create this object.
            this.set_svg_size();

            this.vis.zoom = d3.behavior.zoom()
                .translate(this.vis.viewport_pos)
                .scale(this.vis.viewport_scale[0])
                .on("zoom", function() {
                    _.bind(self._zoomEventHandler, self, {}, true)();
                });

            // Area for graphical elements with clipping
            this.vis.data_area = this.vis.root
                .append("svg:svg")
                .attr("class", "data-area")
                .attr("width", this.vis.viewport_size[0])
                .attr("height", this.vis.viewport_size[1])
                .style("pointer-events", "all");

            // Rectangle for mouse events
            this.vis.root
                .selectAll(".data-area")
                .append("svg:rect")
                .attr("class", "zoom-rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", this.vis.viewport_size[0])
                .attr("height", this.vis.viewport_size[1])
                .style("fill-opacity", 0.0)
                .call(this.vis.zoom);

            this.render();
        },

        _zoomEventHandler: function() {
            var e = d3.event;

            if (this._scrollHandler !== undefined && _.isFunction(this._scrollHandler)) {
                _.bind(this._scrollHandler, this)({
                    translate: e.translate,
                    scale: e.scale
                });
            }
        },

        _buildRenderStateInfo: function() {
            var self = this;
            return {
                getRegionLayout: function() {
                    return self.config.region_layout;
                },

                getViewportDimensions: function() {
                    return {
                        width: self.vis.viewport_size[0],
                        height: self.vis.viewport_size[1]
                    };
                },
                getViewportPosition: function() {
                    var viewport_pos = self.config.viewport.getViewportPosition();

                    return {
                        x: viewport_pos.x,
                        y: viewport_pos.y
                    };
                },
                getVisibleCoordinates: function() {
                    return self.config.viewport._getVisibleCoordinates(-self.vis.viewport_pos[0]);
                },
                getVariantLayout: function() {
                    return self.config.variant_layout;
                }
            }
        },

        _buildRenderingContext: function(svg) {
            return _.extend(this._buildRenderStateInfo(), {
                svg: svg
            });
        },

        _updateViewportTranslation: function() {
            this.vis.viewport_pos = this.config.viewport.getViewportPosition();

            this.data.track.render();
        },

        //////////////
        // Data API //
        //////////////
        region_layout: function(value) {
            this.config.region_layout = value;

            return this;
        },

        viewport: function(param_viewport) {
            this.config.viewport = param_viewport;

            return this;
        },

        scroll_handler: function(scrollHandlerFN) {
            this._scrollHandler = scrollHandlerFN;

            return this;
        },

        width: function(width) {
            this.config.dimensions = {
                width: width
            };

            return this;
        },

        track: function(track) {
            var self = this;

            track._getRenderingContext = function() {
                return self._buildRenderingContext(self.track_g);
            };

            this.data.track = track;

            return this;
        },

        ///////////////////
        // Rendering API //
        ///////////////////
        getCurrentViewport: function() {
            return this._buildRenderStateInfo();
        },

        render: function() {
            this.track_g = this.vis.data_area
                .append("g")
                .attr("class", "seqpeek-track");

            this.data.track.draw();
        }
    };

    return {
        createIntoDiv: function(target_el) {
            var obj = Object.create(SeqPeekContextPrototype, {});

            obj.config = {
                target_el: target_el
            };

            obj.initDiv(target_el);

            return obj;
        },

        createIntoSVG: function(target_svg) {
            var obj = Object.create(SeqPeekContextPrototype, {});

            obj.config = { };

            obj.initSVG(target_svg);

            return obj;
        }
    };
});
