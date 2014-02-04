define   (
[

],
function (

) {
    var _basic_layout_prototype = {
        process: function(region_data) {
            var self = this,
                current_loc = 0;

            _.each(region_data, function(region) {
                var start = isNaN(region.start) ? 0 : region.start,
                    region_end = region.end;

                var width;

                if (region.type == 'exon') {
                    width = region_end - start;
                }
                else {
                    width = self.options.noncoding_region_width;
                }

                var coordinate_scale = d3.scale.linear().domain([start, region_end]).range([current_loc, current_loc + width]);
                var inverse_scale = d3.scale.linear().domain([0, width]).range([start, region_end]);

                region.layout = {
                    screen_x: current_loc,
                    screen_width: width,
                    screen_height: 10.0,
                    coordinate_scale: coordinate_scale,
                    inverse_scale: inverse_scale,
                    get_screen_location_for_coordinate: function(coordinate, rendering_context) {
                        return coordinate_scale(coordinate) + rendering_context.getViewportPosition()['x'];
                    }
                };

                current_loc = current_loc + width + 1;
            });

            return {
                start_coordinate: region_data[0].start,
                end_coordinate: _.last(region_data).end,
                total_width:  current_loc - 1
            };
        }
    };

    return {
        BasicLayoutFactory: {
            create: function(config) {
                var obj = Object.create(_basic_layout_prototype, {});
                obj.options = {
                    noncoding_region_width: config.noncoding_region_width !== undefined ? config.noncoding_region_width : 10
                };

                return obj;
            }
        }
    };
});
