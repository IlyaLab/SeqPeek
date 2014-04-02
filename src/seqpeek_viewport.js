define   (
[
    'd3'
],
function (
    d3
) {
    var prototype = {
        _getCoordinateFromScaleLocation: function(x) {
            return this.region_layout.getCoordinateFromScreenLocation(x);
        },

        _getVisibleCoordinates: function() {
            var start_x = -this.viewport_pos.x,
                min_x = d3.max([start_x, 0]),
                max_x = d3.min([start_x + this.width, this.width]);

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
            obj.width = width;

            return obj;
        }
    }
});
