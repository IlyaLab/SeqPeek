define   (
[
    'd3',
    'underscore',
    'vq'
],
function(
    d3,
    _,
    vq
) {
    var MiniLocatorPrototype = {
        init: function() {
            this.config.width = this.config.canvas_el.width;
            this.config.height = this.config.canvas_el.height;
            this.ctx = this.config.canvas_el.getContext("2d");
        },

        update: function() {

        },

        data: function(region_data) {
            this.region_data = region_data;

            return this;
        },

        scale: function(value) {
            this.config.scale = value;

            return this;
        },

        render: function(min_x, max_x) {
            var ctx = this.ctx;
            this._clearCanvas();

            ctx.save();
            ctx.scale(this.config.scale, 1);

            _.each(this.region_data, function(region) {
                if (region.type == "exon") {
                    this._renderExon(region);
                }
                else if (region.type == "noncoding") {
                    this._renderNonCoding(region);
                }
            }, this);
            this.ctx.restore();

            this._renderViewportExtent(min_x, max_x);
        },

        _clearCanvas: function() {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.config.width, this.config.height);
            this.ctx.restore();
        },

        _renderExon: function(region) {
            var ctx = this.ctx;

            var x = region.layout.screen_x;
            var y = 0;
            var h = this.config.height / 2.0;
            var w = region.layout.screen_width;

            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.closePath();

            ctx.lineWidth = 0;
            ctx.fillStyle = "gray";
            ctx.fill();
        },

        _renderNonCoding: function() {
            var ctx = this.ctx;

            var x = region.layout.screen_x;
            var y = 0;
            var h = this.config.height / 2.0;
            var w = region.layout.screen_width;

            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.closePath();

            ctx.lineWidth = 0;
            ctx.fillStyle = "red";
            ctx.fill();
        },

        _renderViewportExtent: function(min_x, max_x) {
            var ctx = this.ctx;
            var scale = this.config.scale;

            var x = scale * min_x;
            var y = this.config.height / 2.0;
            var h = this.config.height / 2.0;
            var w = scale * (max_x - min_x);

            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.closePath();

            ctx.lineWidth = 1;
            ctx.strokeStyle = "black";
            ctx.stroke();
        }
    };

    return {
        create: function(target_canvas) {
            var obj = Object.create(MiniLocatorPrototype, {});
            obj.config = {
                canvas_el: target_canvas
            };
            obj.init();
            return obj;
        }
    }
});