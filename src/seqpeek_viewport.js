define   (
[
    'd3'
],
function (
    d3
) {
    var prototype = {
        _getCoordinateFromScaleLocation: function(x) {
            var region;

            for (var i = 0; i < this.region_data.length; ++i) {
                region = this.region_data[i];

                if (region.layout.screen_x <= x && x <= (region.layout.screen_x + region.layout.screen_width)) {
                    return region.layout.inverse_scale(x);
                }
            }

            return _.last(this.region_data).end;
        },

        _getVisibleCoordinates: function() {
            var start_x = -this.viewport_pos.x,
                min_x = d3.max([start_x, 0]),
                max_x = d3.min([start_x + self.width, self.width]);

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

        translate: function(x_translation) {

        }
    };

    return {
        createFromRegionData: function(region_data, metadata, width) {
            var obj = Object.create(prototype, {});
            obj.region_data = region_data;
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
