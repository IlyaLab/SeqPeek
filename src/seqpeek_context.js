define   (
[
    'd3',
    'vq',
    'underscore',

    'seqpeek_scaling'
],
function(
    d3,
    vq,
    _,
    ScalingFunctions
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

        draw: function(data, param_config) {
            var that = this;

            this.config.target_el.innerHTML = "";
            this.data = data;

            _.extend(this.config, param_config);

            this.vis = {
                refs: {
                    labels: {},
                    panel: {},
                    symbols: {}
                }
            };

            var size_info = this._getVisualizationSize();

            this.vis.size_info = size_info;

            this.vis.viewport_size = [this.config.dimensions.width, size_info.height];
            this.vis.viewport_scale = [1, 1];
            this.vis.viewport_pos = [0, 0];

            this.vis.visible_coordinates = [0, 1500];

            this.vis.zoom = d3.behavior.zoom()
                .translate(this.vis.viewport_pos)
                .scale(this.vis.viewport_scale[0])
                .on("zoom", function() {
                    _.bind(that.zoomEventHandler, that, {}, true)();
                });

            this.vis.root = d3.select(this.config.target_el)
                .append("svg")
                .attr("id", this.config.guid)
                .attr("width", size_info.width)
                .attr("height", size_info.height)
                .style("pointer-events", "none");

            // Area for scale lines, reference lines and tick marks
            this.vis.root
                .append("g")
                .attr("class", "panel-area")
                .attr("x", 0.0)
                .attr("y", 0.0)
                .attr("width", this.vis.viewport_size[0])
                .attr("height", this.vis.viewport_size[1])
                //.attr("transform", "translate(" + (this.config.plot.horizontal_padding + this.config.band_label_width) + "," + this.config.plot.vertical_padding + ")")
                .style("pointer-events", "none");

            // Area for graphical elements with clipping
            this.vis.data_area = this.vis.root
                .append("svg:svg")
                .attr("class", "data-area")
                //.attr("x", (this.config.plot.horizontal_padding + this.config.band_label_width))
                //.attr("y", (this.config.plot.vertical_padding))
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


        _buildRenderingContext: function(svg) {
            var self = this;

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
                }
            }
        },

        render: function() {
            var track_g = this.vis.data_area
                .append("g")
                .attr("class", "seqpeek-track");

            this.data.track.setRenderingContext(this._buildRenderingContext(track_g));

            this.data.track.render();
        }
    };

    return {
        create: function(target_el) {
            var obj = Object.create(SeqPeekContextPrototype, {}),
                guid = 'C' + vq.utils.VisUtils.guid(); // div id must start with letter

            obj.config = {
                target_el: target_el,
                guid: guid
            };

            return obj;
        }
    };
});
