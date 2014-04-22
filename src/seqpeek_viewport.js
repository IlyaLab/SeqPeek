define   (
[
    'd3'
],
function (
    d3
) {
    var prototype = {
        _getCoordinateFromScaleLocation: function(x) {
            return this.region_layout.getCoordinateFromScreenLocation(x) / this.viewport_scale;
        },

        _getScaleLocationFromCoordinate: function(coordinate) {
            return this.region_layout.getScreenLocationFromCoordinate(coordinate) * this.viewport_scale;
        },

        _getVisibleCoordinates: function() {
            // Calculate the coordinate range that is visible on the screen
            var start_x = -this.viewport_pos.x,
                scaled_width = this.width * this.viewport_scale,
                min_x = d3.max([start_x, 0]),
                max_x = d3.min([start_x + scaled_width, scaled_width]);

            var start = this._getCoordinateFromScaleLocation(min_x);
            var end = this._getCoordinateFromScaleLocation(max_x);

            if (start < this.region_metadata.start_coordinate) {
                start = this.region_metadata.start_coordinate;
            }

            if (end > this.region_metadata.end_coordinate) {
                end = this.region_metadata.end_coordinate;
            }

            return [start, end];
        },

        getViewportPosition: function() {
            return this.viewport_pos;
        },

        setViewportPosition: function(param) {
            this.viewport_pos = param;
        },

        getViewportScale: function() {
            return this.viewport_scale;
        },

        setViewportScale: function(param) {
            this.viewport_scale = param;
        },

        region_layout: function(value) {
            this.region_layout = value;

            return this;
        }
    };

    return {
        createFromRegionData: function(region_layout, metadata, width) {
            var obj = Object.create(prototype, {});
            obj.region_layout = region_layout;
            obj.region_metadata = metadata;
            obj.viewport_pos = {
                x: 0,
                y: 0
            };
            obj.viewport_scale = 1.0;
            obj.width = width;

            return obj;
        }
    }
});
