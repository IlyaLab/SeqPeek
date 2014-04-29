define (
[
    'd3',
    'underscore'
],
function(
    d3,
    _
) {
    var SeqPeekTrackPrototype = {
        getHeight: function() {
            return this.dimensions.height;
        },

        height: function(height) {
            this.dimensions = {
                height: height
            };

            return this;
        },

        guid: function(value) {
            this.config.guid = value;

            return this;
        }
    };

    return SeqPeekTrackPrototype;
});
