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
            var height = d3.sum([this.data.track], function(track) {
                return track.getHeight();
            });

            return {
                width: this.config.dimensions.width,
                height: height
            }
        },


        init: function() {
            this.vis = {
                viewport_pos: [0, 0],
                viewport_scale: [1, 1]
            };
        },

        draw: function() {
            var self = this;

            this.config.target_el.innerHTML = "";


            var size_info = this._getVisualizationSize();

            this.vis.size_info = size_info;

            this.vis.viewport_size = [this.config.dimensions.width, size_info.height];

            this.vis.zoom = d3.behavior.zoom()
                .translate(this.vis.viewport_pos)
                .scale(this.vis.viewport_scale[0])
                .on("zoom", function() {
                    _.bind(self._zoomEventHandler, self, {}, true)();
                });

            this.vis.root = d3.select(this.config.target_el)
                .append("svg")
                .attr("id", this.config.guid)
                .attr("width", size_info.width)
                .attr("height", size_info.height)
                .style("pointer-events", "none");

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
                getViewportDimensions: function() {
                    return {
                        width: self.vis.viewport_size[0],
                        height: self.vis.viewport_size[1]
                    }
                },
                getViewportPosition: function() {
                    return {
                        x: self.vis.viewport_pos[0],
                        y: self.vis.viewport_pos[1]
                    }
                },
                getVisibleCoordinates: function() {
                    return self.region_layout._getVisibleCoordinates(-self.vis.viewport_pos[0]);
                },
                getVariantLayout: function() {
                    return self.config.variant_layout;
                }
            }
        },

        _buildRenderingContext: function(svg) {
            var self = this;

            return _.extend(this._buildRenderStateInfo(), {
                svg: svg
            });

            /*
            return {
                svg: svg,
                getViewportDimensions: function() {
                    return {
                        width: self.vis.viewport_size[0],
                        height: self.vis.viewport_size[1]
                    }
                },
                getViewportPosition: function() {
                    return {
                        x: self.vis.viewport_pos[0],
                        y: self.vis.viewport_pos[1]
                    }
                },
                getVisibleCoordinates: function() {
                    return self.region_layout._getVisibleCoordinates(-self.vis.viewport_pos[0]);
                },
                getVariantLayout: function() {
                    return self.config.variant_layout;
                }
            }
            */
        },

        _updateViewportTranslation: function(translate) {
            this.vis.viewport_pos = [translate[0], 0];

            this.data.track.render();
        },

        //////////////
        // Data API //
        //////////////
        viewport: function(param_viewport) {
            this.region_layout = param_viewport;

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
        create: function(target_el) {
            var obj = Object.create(SeqPeekContextPrototype, {}),
                guid = 'C' + vq.utils.VisUtils.guid(); // div id must start with letter

            obj.data = {};

            obj.config = {
                target_el: target_el,
                guid: guid
            };

            obj.init();

            return obj;
        }
    };
});
