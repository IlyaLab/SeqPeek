define   (
[
    'd3'
],
function (
    d3
) {
    var prototype = {
        _getCoordinateFromScaleLocation: function(x) {
            return this.region_layout.getCoordinateFromScaleLocation(x);
        },

        _getScaleLocationFromCoordinate: function(coordinate) {
            return this.region_layout.getScaleLocationFromCoordinate(coordinate);
        },

        _getCoordinateFromScreenLocation: function(x) {
            return this.region_layout.getCoordinateFromScaleLocation(x / this.viewport_scale);
        },

        _getScreenLocationFromCoordinate: function(coordinate) {
            return this.region_layout.getScaleLocationFromCoordinate(coordinate) * this.viewport_scale;
        },

        _getVisibleCoordinates: function() {
            // Calculate the coordinate range that is visible on the screen
            var start_x = -this.viewport_pos.x;
            var regions_width = this.region_layout.metadata.total_width;
            var offset = d3.max([this.width - regions_width, 0]);
            // First visible scale location, in screen coordinates
            var min_x = d3.max([start_x, 0]);
            // Last visible scale location
            var max_x = d3.min([regions_width, start_x + offset + regions_width / this.viewport_scale]);

            // Use _getCoordinateFromScreenLocation, because min_x is in screen coordinates
            var start = this._getCoordinateFromScreenLocation(min_x);
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
