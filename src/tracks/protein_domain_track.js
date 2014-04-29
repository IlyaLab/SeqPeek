define   (
[
    'd3',
    'underscore',
    'vq',

    './track_prototype'
],
function(
    d3,
    _,
    vq,

    SeqPeekTrackPrototype
) {
    var ProteinDomainTrackPrototype = {
        _buildRenderData: function() {
            var self = this,
                data = this.config.domain_data,
                ctx = this._getRenderingContext(),
                source_key = this.config.source_key,
                protein_domain_ids,
                domain_scale,
                render_data = [];

            // Ordinal scale for vertically positioning InterPro signatures
            if (_.has(this.config, 'source_order') && _.isArray(this.config.source_order)) {
                protein_domain_ids = this.config.source_order;
                domain_scale = d3.scale.ordinal()
                    .domain(protein_domain_ids)
                    .rangeBands([0, protein_domain_ids.length * (this.config.domain_height + 1)]);
            }
            else {
                protein_domain_ids = _.uniq(_.pluck(data, this.config.source_key));
                domain_scale = d3.scale.ordinal()
                    .domain(protein_domain_ids)
                    .rangeBands([0, protein_domain_ids.length * (this.config.domain_height + 1)]);
            }

            _.each(data, function(match) {
                _.each(match.locations, function(location) {
                    var screen_x0 = ctx.getRegionLayout().getScaleLocationFromCoordinate(location.start),
                        screen_x1 = ctx.getRegionLayout().getScaleLocationFromCoordinate(location.end);

                    render_data.push(_.extend(match, location, {
                        screen_x0: screen_x0,
                        screen_x1: screen_x1,
                        color: self.config.color_scheme[match[source_key]]
                    }));
                });
            });

            this.render_data = render_data;
            this.vertical_scale = domain_scale;
        },

        _buildHovercardHandler: function() {
            var handler_params = _.extend(this.config.hovercard.config, {
                canvas_id: this.config.guid,
                data_config: this.config.hovercard.content
            });

            if (this.config.hovercard.enable_tools) {
                handler_params.tool_config = this.config.hovercard.links;
            }

            return vq.hovercard(handler_params);
        },

        _applySVG: function() {
            var self = this,
                ctx = this._getRenderingContext(),
                source_key = this.config.source_key;

            var domains_g = ctx.svg
                .selectAll("rect.domain")
                .data(this.render_data)
                .enter()
                .append("rect")
                .attr("class", "domain")
                .attr("x", function(d) {
                    return d.screen_x0;
                })
                .attr("width", function(d) {
                    return  d.screen_x1 - d.screen_x0;
                })
                .attr("y", function(d) {
                    return self.vertical_scale(d[source_key]);
                })
                .attr("height", self.config.domain_height)
                .style("fill", function(d) {
                    return d.color;
                });

            if (this.config.hovercard.enable) {
                var handler = this._buildHovercardHandler();

                domains_g
                    .each(function() {
                        d3.select(this).on("mouseover", function(d) {
                            handler.call(this, d);
                        });
                    });
            }
        },

        getVariantLayout: function() {
            return this.config.variant_layout;
        },

        //////////////
        // Data API //
        //////////////
        domain_data: function(data) {
            this.config.domain_data = data;

            return this;
        },

        regions: function(region_data, param_coordinate_getter) {
            this.region_data = region_data;

            return this;
        },

        variant_layout: function(layout_object) {
            this.config.variant_layout = layout_object;

            return this;
        },

        domain_height: function(value) {
            this.config.domain_height = value;

            return this;
        },

        color_scheme: function(color_scheme) {
            this.config.color_scheme = color_scheme;

            return this;
        },

        source_key: function(value) {
            this.config.source_key = value;

            return this;
        },

        source_order: function(value) {
            this.config.source_order = value;

            return this;
        },

        hovercard_config: function(value) {
            this.config.hovercard.config = value;

            return this;
        },

        hovercard_content: function(value) {
            this.config.hovercard.enable = true;
            this.config.hovercard.content = value;

            return this;
        },

        hovercard_links: function(value) {
            this.config.hovercard.enable_tools = true;
            this.config.hovercard.links = value;

            return this;
        },

        ///////////////
        // Brush API //
        ///////////////
        supportsSelection: function() {
            return this._brushinfo.supportsbrush;
        },

        ///////////////////
        // Rendering API //
        ///////////////////
        draw: function() {
            this._buildRenderData();
            this._applySVG();
        },

        render: function() {
            var ctx = this._getRenderingContext();

            ctx.svg.attr("transform", function() {
                var trs =
                    "translate(" + ctx.getViewportPosition().x + ",0)" +
                    "scale(" + ctx.getViewportScale() + ",1)";

                return trs;
            });
        }
    };

    var track_proto = Object.create(SeqPeekTrackPrototype);
    _.extend(track_proto, ProteinDomainTrackPrototype);

    return {
        create: function() {
            var track = Object.create(track_proto, {});
            track._brushinfo = {
                supportsbrush: true
            };
            track.config = {
                hovercard: {
                    enable: false,
                    enable_tools: false
                }
            };
            return track;
        }
    }
});
