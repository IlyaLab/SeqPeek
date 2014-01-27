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
    var SeqPeekPrototype = {
        mutationSortFn: function(a, b) {
            var subtype_order = _
                .chain(this.data.tracks)
                .pluck('label')
                .reduce(function(memo, label, index) {
                    memo[label] = index;
                    return memo;
                }, {})
                .value();

            var mutation_order = _
                .chain(this.config.mutation_order)
                .reduce(function(memo, label, index) {
                    memo[label] = index;
                    return memo;
                }, {})
                .value();

            if (!_.has(mutation_order, a.mutation_type) || !_.has(mutation_order, b.mutation_type)) {
                return 0;
            }

            if( mutation_order[a.mutation_type] < mutation_order[b.mutation_type]) {
                return -1;
            }
            else if( mutation_order[a.mutation_type] > mutation_order[b.mutation_type]) {
                return 1;
            }
            else {
                if (subtype_order[a.cancer_subtype] < subtype_order[b.cancer_subtype]) {
                    return -1;
                }
                else if (subtype_order[a.cancer_subtype] > subtype_order[b.cancer_subtype]) {
                    return 1;
                }
                else {
                    return 0;
                }
            }
        },

        mutationIdFn: function(d) {
            return d.mutation_id;
        },

        getMutationLabelRows: function(d) {
            return _
                .chain(this.config.mutation_label_rows)
                .map(function(f) {
                    return f.label + " - " + d[f.name];
                })
                .value();
        },

        createTrackStatistics: function(track, array_field_name) {
            var that = this;

            // Find out the maximum number of mutations in a single location
            //var max_samples_in_location = _.reduce(track.mutations_by_loc, function(memo, mutation_array, loc) {
            var max_samples_in_location = _.reduce(track[array_field_name], function(memo, mutation_array, loc) {
                var len = d3.sum(mutation_array, function(d) {
                    return d.sample_ids.length;
                });

                if (len > memo) {
                    memo = len;
                }

                return memo;
            }, 0);

            // Find out the minimum number of mutations in a single location
            //var min_samples_in_location = _.reduce(track.mutations_by_loc, function(memo, mutation_array, loc) {
            var min_samples_in_location = _.reduce(track[array_field_name], function(memo, mutation_array, loc) {
                var len = d3.sum(mutation_array, function(d) {
                    return d.sample_ids.length;
                });

                if (len < memo) {
                    memo = len;
                }

                return memo;
            }, max_samples_in_location);

            track.statistics = {
                min_samples_in_location: min_samples_in_location,
                max_samples_in_location: max_samples_in_location
            };
        },

        _samplesColorByForProteinTrack: function(d, color_by, track) {
            if (!_.has(d, 'processed_samples')) {
                d.processed_samples = {
                    color_by: {}
                };
            }

            var grouped,
                bar_data;

            if (_.isFunction(color_by.group_fn)) {
                grouped = color_by.group_fn(d.sample_ids);
            }
            else {
                grouped = _.countBy(d.sample_ids, function(s) {
                    return s.value;
                });
            }

            if (color_by.type == 'fract') {
                bar_data = ScalingFunctions.createFractionalBars(track, color_by, grouped, track.statistics);
            }
            else if (color_by.type == 'log2nabs') {
                bar_data = ScalingFunctions.createLog2Bars(track, color_by, grouped, track.statistics);
            }
            else if (color_by.type == 'log2nnorm') {
                bar_data = ScalingFunctions.createNormalizedLogBars(track, color_by, grouped, track.statistics);
            }
            else if (color_by.type == 'linnorm') {
                bar_data = ScalingFunctions.createNormalizedLinearBars(track, color_by, grouped, track.statistics);
            }
            else {
                console.error('Invalid color_by type \'' + color_by.type + '\'');
            }

            var data_obj = _.clone(color_by);
            data_obj.bar_data = bar_data.array;
            data_obj.category_counts = grouped;
            d.processed_samples.color_by = data_obj;
        },

        processData: function() {
            var that = this;
            var data = this.data;

            var processSamples = function(entries) {
                var mutation_data = _.extend({}, entries[0], {}),
                    id_field = that.config.mutation_sample_id_field;

                mutation_data.sample_ids = _.map(entries, function(e) {
                    return {
                        id: e[id_field],
                        value: e.value
                    };
                });

                mutation_data[id_field] = null;

                return mutation_data;
            };

            data.subtype_to_index_map = {};

            _.each(data.tracks, function(track, index) {
                data.subtype_to_index_map[track.label] = index;

                if (! _.has(track, 'mutations_by_loc') && ! _.has(track, 'mutations_processed')) {
                    var mutations_by_loc = _
                        .chain(track.mutations)
                        .groupBy('mutation_id')
                        .map(processSamples)
                        .groupBy('location')
                        .value();

                    // Create flat array of all mutations
                    var all_mutations = [];

                    _.each(mutations_by_loc, function(mutations, location) {
                        all_mutations.push.apply(all_mutations, mutations);
                    });

                    track.mutations_by_loc = mutations_by_loc;
                    track.mutations_processed = all_mutations;

                    that.createTrackStatistics(track, 'mutations_by_loc');

                    // If 'Color By' functionality is enabled, calculate needed statistics
                    if (_.has(track, 'color_by') && track.color_by.type != 'none') {
                        _.each(mutations_by_loc, function(mutations, location) {
                            _.each(mutations, function(m) {
                                that._samplesColorByForProteinTrack(m, track.color_by, track);
                            });
                        });
                    }
                }

                var default_layout = {
                    background_ticks: {
                        y1: 0,
                        y2: 0
                    },
                    mutations: {
                        y: 0
                    },
                    protein_scale_line: {
                        enabled: true,
                        y: 0
                    },
                    protein_scale_ticks: {
                        enabled: true,
                        y: 0
                    },
                    protein_domains: {
                        enabled: true,
                        y: 0
                    },
                    y: 0
                };

                track.layout = _.extend(default_layout, track.layout);

                track.tooltips.hovercard = vq.hovercard({
                    canvas_id: that.config.guid,
                    include_header: false,
                    include_footer: true,
                    self_hover: true,
                    timeout: 200,
                    param_data: true,
                    data_config: track.tooltips.items,
                    tool_config: track.tooltips.links
                });
            });

            data.all_mutations_by_loc = _
                .chain(data.tracks)
                .pluck('mutations_by_loc')
                .reduce(function(memo, locations, index) {
                    _.each(locations, function(data, loc) {
                        if (!_.has(memo, loc)) {
                            memo[loc] = data.slice(0);
                        }
                        else {
                            // Concatenate the array 'data' to memo[loc}
                            memo[loc].push.apply(memo[loc], data.slice(0));
                        }
                    });
                    return memo;
                }, {})
                .value();

            this.alignMutationsForProteinTrack();
        },

        _getDimensionsForProteinTrack: function(track, config, param_layout) {
            var that = this;
            var layout = param_layout || _.extend({}, track.layout);

            // TODO Make this dependent on label font size
            var label_offset = 7.0;

            var mutations_height = 0;

            var stackedSamplesHeightFn = function(mutations_processed) {
                return d3.max(mutations_processed, function(m) {
                    return m.sample_ids.length * config.mutation_shape_width;
                });
            };

            var colorByBarsSamplesHeightFn = function(mutations_processed) {
                return d3.max(mutations_processed, function(m) {
                    return _.reduce(m.processed_samples.color_by.bar_data,
                        function(total, d) {
                            return total + d.height;
                        }, 0);
                });
            };

            // Resolve the maximum height of the mutation shape stack including stems if needed
            if (_.has(track, 'color_by')) {
                mutations_height = colorByBarsSamplesHeightFn(track.mutations_processed);
            }
            else {
                mutations_height = stackedSamplesHeightFn(track.mutations_processed);
            }

            if (config.enable_mutation_stems === true) {
                mutations_height = mutations_height + config.mutation_groups.stems.height;
            }

            // Height of scale line if displayed
            var protein_scale_height = 0;
            if (layout.protein_scale_ticks.enabled === true) {
                protein_scale_height = config.location_tick_height;
            }

            // Height of protein domains in total if displayed
            var domains_height = 0;

            if (layout.protein_domains.enabled === true) {
                domains_height = that.vis.domain_scale.rangeExtent()[1] + that.config.protein_domains.padding;
            }

            layout.mutations.y = mutations_height;
            layout.protein_scale_line.y = layout.mutations.y;

            // If stems are not drawn, move the scale line down so that it will not overlap with the mutation shapes
            if (config.enable_mutation_stems === false) {
                layout.protein_scale_line.y += config.mutation_shape_width / 2.0;
            }

            layout.protein_scale_ticks.y = layout.protein_scale_line.y + protein_scale_height;

            layout.protein_domains.y = layout.protein_scale_ticks.y + domains_height;

            layout.height = mutations_height + protein_scale_height + domains_height;

            layout.label_y = mutations_height / 2.0 + label_offset;

            layout.background_ticks.y1 = -mutations_height;
            layout.background_ticks.y2 = 0;

            if (layout.protein_domains.enabled === false) {
                layout.background_ticks.y2 = layout.protein_scale_ticks.enabled ? (config.location_tick_height / 2.0) : config.mutation_shape_width / 2.0;
            }

            return layout;
        },

        getTrackDimension: function(track, config, param_layout)  {
            var self = this;

            if (track.type == 'protein') {
                return self._getDimensionsForProteinTrack(track, config, param_layout);
            }
            else if (track.type == 'genomic') {
                return self._getDimensionsForGenomicTrack(track, config, param_layout);
            }
            else {
                console.error("Unknown track type \'" + track.type + "\'");
                return null;
            }
        },

        updateVerticalScaleRanges: function() {
            var that = this;
            var data = this.data;

            var current_y = 0;

            _.each(data.tracks, function(subtype) {
                var layout = that.getTrackDimension(subtype, that.config);

                layout.y = current_y;
                _.extend(subtype.layout, layout);

                current_y = current_y + layout.height;

                if (layout.protein_domains.enabled === false ||
                    layout.protein_scale_ticks.enabled === false) {
                    current_y = current_y + 5.0;
                }
            });
        },

        getMaxVisualizationSize: function() {
            var that = this;
            var data = this.data;

            // Resolve the maximum total height of the tracks, assuming that the protein scale
            // and protein domains are displayed for every subtype.
            var max_height = 0;

            var test_layout = {
                background_ticks: {
                    y1: 0,
                    y2: 0
                },
                mutations: {
                    y: 0
                },
                protein_scale_line: {
                    enabled: true,
                    y: 0
                },
                protein_scale_ticks: {
                    enabled: true,
                    y: 0
                },
                protein_domains: {
                    enabled: true,
                    y: 0
                },
                y: 0
            };

            var test_config = _.extend({}, that.config, {
                enable_mutation_stems: true
            });

            _.each(data.tracks, function(subtype) {
                var layout = that.getTrackDimension(subtype, test_config, test_layout);

                // TODO
                max_height += (layout.height + that.config.protein_scale.vertical_padding);
            });

            return {
                width: this.config.band_label_width + this.config.protein_scale.width,
                height: max_height
            };
        },

        getDefaultVisualizationSize: function() {
            var that = this;
            var data = this.data,
                layout;

            // Resolve the maximum total height of the tracks, assuming that the protein scale
            // and protein domains are displayed only on the last subtype.
            var max_height = 0;

            var default_layout = {
                background_ticks: {
                    y1: 0,
                    y2: 0
                },
                mutations: {
                    y: 0
                },
                protein_scale_line: {
                    enabled: false,
                    y: 0
                },
                protein_scale_ticks: {
                    enabled: false,
                    y: 0
                },
                protein_domains: {
                    enabled: false,
                    y: 0
                },
                y: 0
            };

            var last_layout = {
                background_ticks: {
                    y1: 0,
                    y2: 0
                },
                mutations: {
                    y: 0
                },
                protein_scale_line: {
                    enabled: true,
                    y: 0
                },
                protein_scale_ticks: {
                    enabled: true,
                    y: 0
                },
                protein_domains: {
                    enabled: true,
                    y: 0
                },
                y: 0
            };

            var test_config = _.extend({}, that.config, {
                enable_mutation_stems: true
            });

            // Add height of all but the last cancer
            _.chain(data.tracks)
                .initial()
                .each(function(track) {
                    layout = that.getTrackDimension(track, test_config, default_layout);
                    // TODO
                    // Size of the data-area element becomes correct, but the vertical padding
                    // is not actually applied to be present between the tracks.
                    max_height += (layout.height + that.config.protein_scale.vertical_padding);
                });

            // Add height of the last cancer
            layout = that.getTrackDimension(_.last(data.tracks), test_config, last_layout);
            max_height += layout.height;

            return {
                width: this.config.band_label_width + this.config.protein_scale.width,
                height: max_height
            };
        },

        getSize: function() {
            return {
                width: this.vis.size_info.width + 2.0 * this.config.plot.horizontal_padding,
                height: this.vis.size_info.height + 2.0 * this.config.plot.vertical_padding
            }
        },

        draw: function(data, param_config) {
            var that = this,
                protein_domain_ids;

            this.config.target_el.innerHTML = "";
            this.data = data;

            _.extend(this.config, param_config);

            this.processData();
            this.processDataGenomic();

            this.vis = {
                refs: {
                    labels: {},
                    panel: {},
                    symbols: {}
                }
            };

            // Linear scale for location in protein
            this.vis.ref_scale = d3.scale.linear().domain([0, data.protein.length]).range([0, this.config.protein_scale.width]);

            // Ordinal scale for vertically positioning InterPro signatures
            if (_.has(this.config.protein_domains, 'order') && _.isArray(this.config.protein_domains.order)) {
                protein_domain_ids = this.config.protein_domains.order;
                this.vis.domain_scale = d3.scale.ordinal()
                    .domain(protein_domain_ids)
                    .rangeBands([0, protein_domain_ids.length * (this.config.signature_height + 1)]);
            }
            else {
                protein_domain_ids = _.uniq(_.pluck(data.protein.domains, this.config.protein_domains.key));
                this.vis.domain_scale = d3.scale.ordinal()
                    .domain(protein_domain_ids)
                    .rangeBands([0, protein_domain_ids.length * (this.config.signature_height + 1)]);
            }

            var size_info = this.getDefaultVisualizationSize();
            this.updateVerticalScaleRanges();

            this.vis.size_info = size_info;

            this.vis.viewport_size = [this.config.protein_scale.width, size_info.height];
            this.vis.viewport_scale = [1, 1];
            this.vis.viewport_pos = [0, 0];

            this.vis.visible_coordinates = [0, 1500];

            // Align mutations and calculate screen locations, then
            // set viewport such that all mutations are visible initially.
            //this.setInitialViewport();

            this.vis.zoom = d3.behavior.zoom()
                .translate(this.vis.viewport_pos)
                .scale(this.vis.viewport_scale[0])
                .on("zoom", function() {
                    _.bind(that.zoomEventHandler, that, {}, true)();
                });

            this.vis.root = d3.select(this.config.target_el)
                .append("svg")
                .attr("id", this.config.guid)
                .attr("width", (2 * this.config.plot.horizontal_padding + size_info.width))
                .attr("height", (2 * this.config.plot.vertical_padding + size_info.height))
                .style("pointer-events", "none");

            // Area for labels
            this.vis.root
                .append("g")
                .attr("class", "label-area")
                .attr("width", this.config.band_label_width)
                .attr("height", size_info.height)
                .attr("transform", "translate(" + this.config.plot.horizontal_padding + "," + this.config.plot.vertical_padding + ")")
                .style("pointer-events", "all");

            // Area for scale lines, reference lines and tick marks
            this.vis.root
                .append("g")
                .attr("class", "panel-area")
                .attr("x", 0.0)
                .attr("y", 0.0)
                .attr("width", this.vis.viewport_size[0])
                .attr("height", this.vis.viewport_size[1])
                .attr("transform", "translate(" + (this.config.plot.horizontal_padding + this.config.band_label_width) + "," + this.config.plot.vertical_padding + ")")
                .style("pointer-events", "none");

            // Area for graphical elements with clipping
            this.vis.root
                .append("svg:svg")
                .attr("class", "data-area")
                .attr("x", (this.config.plot.horizontal_padding + this.config.band_label_width))
                .attr("y", (this.config.plot.vertical_padding))
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

            // Calculate scale factor for protein domains to 100% viewport
            var domain = this.vis.ref_scale.domain();
            this.vis.domain_rect_scale_factor = this.config.protein_scale.width / (domain[1] - domain[0]);

            this.tooltips = {
                interpro: hovercard = vq.hovercard({
                    canvas_id: this.config.guid,
                    include_header: false,
                    include_footer: true,
                    self_hover: true,
                    timeout: 200,
                    data_config: that.config.tooltips.interpro.items,
                    tool_config: []
                })
            };

            this.render();
        },

        zoomEventHandler: function() {
            var e = d3.event;

            this.vis.viewport_scale = [e.scale, 0.0];
            this.vis.viewport_pos = e.translate;

            this._scrollProteinTracks();

            this._scrollRegions();
        },

        setInitialViewport: function() {


            // Find maximum extent
            var left = d3.min(this.data.tracks, function(track) {
                if (! _.has(track, 'mutation_layout') && ! _.has(track, 'variant_layout')) {
                    console.error("setInitialViewport: Track does not mutation or variant layout");
                    return {};
                }

                if (_.has(track, 'mutation_layout')) {
                    return track.mutation_layout.extent.left;
                }
                else if (_.has(track, 'variant_layout')) {
                    return track.variant_layout.extent.left;
                }
            });
            var right = d3.max(this.data.tracks, function(track) {
                if (! _.has(track, 'mutation_layout') && ! _.has(track, 'variant_layout')) {
                    console.error("setInitialViewport: Track does not mutation or variant layout");
                    return {};
                }

                //return d.mutation_layout.extent.right;
                if (_.has(track, 'mutation_layout')) {
                    return track.mutation_layout.extent.right;
                }
                else if (_.has(track, 'variant_layout')) {
                    return track.variant_layout.extent.right;
                }
            });

            var x_translate = Math.abs(d3.min([left, 0.0]));

            var viewport_width = x_translate + d3.max([this.config.protein_scale.width, right]);

            this.vis.viewport_pos = [
                x_translate,
                0.0
            ];

            this.vis.viewport_scale = [
                this.config.protein_scale.width / viewport_width,
                0.0
            ];
        },

        changeTracks: function(new_tracks, config) {
            var data = this.data,
                order = config.subtype_order;

            // Filter out tracks that might already be in the visualization
            _.chain(new_tracks)
                .filter(function(s) {
                    return _.has(data.subtype_to_index_map, s.label) === false;
                })
                .each(function(s) {
                    data.tracks.push(s);
                });

            // Remove tracks that are not included in the 'order' array
            data.tracks = _.filter(data.tracks, function(s) {
                return order.indexOf(s.label) != -1;
            });

            data.tracks = data.tracks.sort(function(a, b) {
                if (order.indexOf(a.label) < order.indexOf(b.label)) {
                    return -1;
                }
                else if (order.indexOf(a.label) == order.indexOf(b.label)) {
                    return 0;
                }
                else {
                    return 1;
                }
            });

            if (_.isFunction(config.post_process_fn)) {
                config.post_process_fn(data.tracks);
            }

            // Do data mangling for new tracks
            this.processData();

            // Do layouts for new tracks
            this.updateVerticalScaleRanges();

            this.render();
        },

        render: function() {
            var that = this;
            var data = this.data;

            // --------
            // Graphics
            // --------
            var track_content_g = this.vis.root
                .selectAll(".data-area")
                .selectAll("g.seqpeek-track")
                .data(data.tracks, function(d) {
                    return d.label;
                });

            var tracks_enter = track_content_g.enter();
            var tracks_exit = track_content_g.exit();

            var track = tracks_enter
                .append("g")
                .attr("class", "seqpeek-track")
                .attr("height", function(d) {
                    return d.layout.subtype_height;
                })
                .attr("transform", function(d) {
                    return "translate(0," + d.layout.y + ")";
                })
                .style("opacity", 1e-6);

            track
                .append("g")
                .attr("class", function(d) {
                    return d.type;
                })
                .attr("transform", "translate(0,0)");

            // Update
            track_content_g
                .attr("height", function(d) {
                    return d.layout.subtype_height;
                })
                .attr("transform", function(d) {
                    return "translate(0," + d.layout.y + ")";
                })
                .style("opacity", 1.0);

            // Exit
            tracks_exit
                .remove();

            this.vis.refs.symbols.protein = this.vis.root.selectAll(".data-area g.protein");
            this.vis.refs.symbols.genomic = this.vis.root.selectAll(".data-area g.genomic");

            // ------
            // Labels
            // ------
            track_content_g = this.vis.root
                .selectAll("g.label-area")
                .selectAll("g.seqpeek-track")
                .data(data.tracks, function(d) {
                    return d.label;
                });

            tracks_enter = track_content_g.enter();
            tracks_exit = track_content_g.exit();

            track = tracks_enter
                .append("g")
                .attr("class", "seqpeek-track")
                .attr("height", function(d) {
                    return d.layout.subtype_height;
                })
                .attr("transform", function(d) {
                    return "translate(0," + d.layout.y + ")";
                })
                .style("opacity", 1e-6);

            track
                .append("text")
                .attr("left", 0)
                .attr("y", function(d) {
                    return d.layout.label_y;
                })
                .text(function(d) {
                    return d.label;
                }).on("mouseover", function(d) {
                    if (_.has(d, 'label_mouseover_handler')) {
                        var handler = d.label_mouseover_handler;
                        handler(d);
                    }
                });

            // Update
            track_content_g
                .attr("height", function(d) {
                    return d.layout.subtype_height;
                })
                .attr("transform", function(d) {
                    return "translate(0," + d.layout.y + ")";
                })
                .style("opacity", 1.0);

            // Exit
            tracks_exit
                .remove();

            // -----
            // Panel
            // -----
            track_content_g = this.vis.root
                .selectAll("g.panel-area")
                .selectAll("g.seqpeek-track")
                .data(data.tracks, function(d) {
                    return d.label;
                });

            tracks_enter = track_content_g.enter();
            tracks_exit = track_content_g.exit();

            track = tracks_enter
                .append("g")
                .attr("class", "seqpeek-track")
                .attr("height", function(d) {
                    return d.layout.subtype_height;
                })
                .attr("transform", function(d) {
                    return "translate(0," + d.layout.y + ")";
                })
                .style("opacity", 1e-6);

            track
                .each(function(d) {
                    if (d.type == 'protein') {
                        d3.select(this)
                            .append("g")
                            .attr("class", "protein")
                            .attr("transform", "translate(0,0)")
                            // Vertical reference lines on the protein scale
                            .append("g")
                            .attr("class", "background-ticks")
                            .attr("transform", function(d) {
                                return "translate(0," + (d.layout.mutations.y) + ")";
                            });
                    }
                    else if (d.type == 'genomic') {
                        d3.select(this)
                            .append("g")
                            .attr("class", "genomic")
                            .attr("transform", "translate(0,0)");
                    }
                });

            // Update
            track_content_g
                .attr("height", function(d) {
                    return d.layout.subtype_height;
                })
                .attr("transform", function(d) {
                    return "translate(0," + d.layout.y + ")";
                })
                .style("opacity", 1.0);

            // Exit
            tracks_exit
                .remove();

            this.vis.refs.panel.protein = this.vis.root.selectAll(".panel-area g.protein");
            this.vis.refs.panel.genomic = this.vis.root.selectAll(".panel-area g.genomic");

            this.applyLayoutChange();
            this.applyLayoutGenomic();
        },

        applyLayoutChange: function() {
            this.updateTickScale();

            this.applyDataElements();
            this.applyPanelElements();

            this.applyReferenceLines();
            this.applyProteinScales();
            this.applyProteinDomains();

            this.applyMutationGroups();
            this.applyMutationMarkers();

            this.applyStems();
        },

        applyLayoutGenomic: function() {
            var that = this;

            _.chain(this.data.tracks)

                .filter(function(d) {
                    return d.type == 'genomic';
                })
                .each(function(track) {
                    track.region_metadata = that.regionLayout(track.region_data);
                });

            this.vis.visible_genomic_coordinates = this._getVisibleCoordinates();

            this.updateVariantScreenLocationsForAllTracks();

            this.vis.refs.symbols.genomic.call(this.applyGeneRegions);
            this.vis.refs.panel.genomic.call(this.applyGeneRegions);


            this.renderCodingRegions();
            this.renderVariantGroups();
            this.renderVariantStems();
        },

        _scrollProteinTracks: function() {
            this.updateTickScale();

            this.updateReferenceLines();
            this.updateProteinScaleTicks();
            this.updateProteinDomains();
            this.updateMutationMarkers();
        },


        applyMutationGroups: function() {
            var that = this;
            var data = this.data;

            var tracks = this.vis.root
                .selectAll(".data-area")
                .selectAll("g.seqpeek-track");

            tracks
                .each(function(track_data) {
                    var mutation_group = d3
                        .select(this)
                        .selectAll(".protein")
                        .selectAll("g.mutations")
                        .data(function(d) {
                            return [d];
                        }, function(d) {
                            return d.label;
                        });

                    mutation_group
                        .enter()
                        .append("g")
                        .attr("class", "mutations")
                        .style("opacity", 1e-6);

                    mutation_group
                        .attr("transform", function(d) {
                            // Transform:
                            //
                            // 1. translate (<viewport x>, <mutations placement y>)
                            // 2. scale (<viewport x scale>, -1)
                            var trs =
                                "translate(" + (that.vis.viewport_pos[0]) + "," + (d.layout.mutations.y) + ")" +
                                    "scale(" + that.vis.viewport_scale[0] + ", -1)";

                            return trs;
                        })
                        .style("opacity", 1.0);
                });
        },

        applyDataElements: function() {
            var that = this;
            var data = this.data;

            var tracks = this.vis.root
                .selectAll(".data-area")
                .selectAll("g.seqpeek-track");

            tracks
                .each(function(track_data) {
                    var domains = d3
                        .select(this)
                        .selectAll(".protein")
                        .selectAll("g.domains")
                        .data(function(d) {
                            return d.layout.protein_domains.enabled === true ? [data.protein.domains] : [];
                        });

                    domains
                        .enter()
                        .append("g")
                        .attr("class", "domains")
                        .attr("transform", function() {
                            // Transform:
                            //
                            // 1. translate (<viewport x>, <domain placement y>)
                            // 2. scale (<domain rectangle to 100% viewport>, 0)
                            // 3. scale (<viewport x scale>, -1)
                            var trs =
                                "translate(" + (that.vis.viewport_pos[0]) + "," + (track_data.layout.protein_domains.y) + ")" +
                                    "scale(" + that.vis.viewport_scale[0] * that.vis.domain_rect_scale_factor + ", -1)";

                            return trs;
                        })
                        .style("opacity", 1e-6);

                    var domains_exit = domains.exit();

                    if (that.config.enable_transitions) {
                        domains = domains
                            .transition()
                            .duration(500);
                    }

                    domains
                        .style("opacity", 1.0);

                    domains_exit
                        .remove();
                });
        },

        applyPanelElements: function() {
            var that = this;

            var tracks = this.vis.root
                .selectAll(".panel-area")
                .selectAll("g.seqpeek-track");

            tracks
                .each(function(track_data) {
                    var background_lines = d3
                        .select(this)
                        .selectAll(".protein")
                        .selectAll("g.background-ticks");

                    background_lines
                        .attr("transform", function(d) {
                            return "translate(0," + (d.layout.mutations.y) + ")";
                        });
                });

            tracks
                .each(function(track_data) {
                    var protein_scales = d3
                        .select(this)
                        .selectAll(".protein")
                        .selectAll("g.scale")
                        .data(function(d) {
                            return (d.layout.protein_scale_ticks.enabled ||
                                d.layout.protein_scale_line.enabled) === true ? [track_data] : [];
                        });

                    protein_scales
                        .enter()
                        .append("g")
                        .attr("class", "scale")
                        .attr("transform", function() {
                            return "translate(0," + (track_data.layout.protein_scale_ticks.y) + ")";
                        })
                        .style("opacity", 1e-6);

                    var protein_scales_exit = protein_scales.exit();

                    protein_scales
                        .attr("transform", function() {
                            return "translate(0," + (track_data.layout.protein_scale_ticks.y) + ")";
                        })
                        .style("opacity", 1.0);

                    protein_scales_exit
                        .remove();
                });
        },

        applyGeneRegions: function(selection) {
            selection
                .each(function() {
                    d3.select(this)
                        .selectAll("g.region")
                        .data(function(d) {
                            return d.region_data;
                        })
                        .enter()
                        .append("g")
                        .attr("class", function(d) {
                            return "region " + d.type
                        })
                        .attr("transform", function(d) {
                            return "translate(" + d.layout.screen_x + ",0)";
                        });
                });
        },

        _buildLocationGroups: function(mutations_by_loc) {
            var that = this;
            var mutationIdFn = this.mutationIdFn;

            return _
                .chain(mutations_by_loc)
                .map(function(mutations, location) {
                    var group,
                        scale = d3.scale.ordinal();

                    mutations.sort(_.bind(that.mutationSortFn, that));

                    var mutation_ids_sorted = _
                        .chain(mutations)
                        .map(mutationIdFn)
                        .uniq()
                        .value();

                    scale.domain(mutation_ids_sorted);
                    scale.rangeBands([0, mutation_ids_sorted.length * that.config.mutation_shape_width]);

                    var width = scale.rangeExtent()[1];

                    group = {
                        data: {
                            // The "location" variable needs to be converted to a numerical type
                            // for the sort below to work correctly.
                            location: parseInt(location, 10),
                            mutations: mutations
                        },
                        scale: scale,
                        left_extent: width / 2.0,
                        right_extent: width / 2.0,
                        start_loc: 0.0,
                        width: width
                    };

                    return group;
                })
                .sortBy(function(group) {
                    return group.data.location;
                })
                .value();
        },

        alignMutationsForProteinTrack: function() {
            var that = this;
            var data = this.data;

            var buildLocationGroupsAcrossTracks = _.once(_.bind(this._buildLocationGroups, this));

            _.chain(data.tracks)
                .filter(function(track) {
                    return track.type == 'protein'
            })
            .each(function(track) {
                var layout = {};
                var location_groups;

                if (that.config.mutation_layout === 'by_subtype') {
                    location_groups = buildLocationGroups(track.mutations_by_loc);
                }
                else if (that.config.mutation_layout === 'all_subtypes') {
                    location_groups = buildLocationGroupsAcrossTracks(that.data.all_mutations_by_loc);
                }

                layout.location_groups = location_groups;

                layout.location_to_node_map = _.reduce(location_groups, function(memo, group) {
                    memo[group.data.location] = group;
                    return memo;
                }, {});

                layout.location_to_node_index_map = _.reduce(location_groups, function(memo, group, index) {
                    memo[group.data.location] = index;
                    return memo;
                }, {});

                track.mutation_layout = layout;
            });
        },

        basicProteinTrackLayout: function(mutation_data, param_scale) {
            var that = this,
                location_groups = mutation_data.mutation_layout.location_groups,
                location_to_node_map = mutation_data.mutation_layout.location_to_node_map,
                location_to_node_index_map = mutation_data.mutation_layout.location_to_node_index_map;

            var node_locations = _
                .chain(location_to_node_map)
                .keys()
                .map(function(d) {return parseInt(d, 10);})
                .sortBy(function(d) {return d;})
                .value();

            var pivot_location = node_locations[Math.floor(node_locations.length / 2)];

            var x_scale = param_scale;

            var pivot_node = location_to_node_map[pivot_location];
            var pivot_index = location_to_node_index_map[pivot_location];

            pivot_node.start_loc = x_scale(pivot_node.data.location) - pivot_node.left_extent;

            // Justify locations right of the pivot
            var group_padding = that.config.mutation_groups.padding;
            var current_loc = pivot_node.start_loc + pivot_node.width + group_padding;

            _.chain(location_groups.slice(pivot_index))
                .rest()
                .each(function(node) {
                    if ((x_scale(node.data.location) - node.left_extent) >= current_loc) {
                        node.start_loc = x_scale(node.data.location) - node.left_extent;
                        current_loc = node.start_loc + node.width + group_padding;
                    }
                    else {
                        node.start_loc = current_loc;
                        current_loc = current_loc + node.width + group_padding;
                    }
                });

            // Justify locations left of the pivot
            current_loc = pivot_node.start_loc - group_padding;

            _.chain(location_groups.slice(0, pivot_index + 1).reverse())
                .rest()
                .each(function(node) {
                    if ((x_scale(node.data.location) + node.right_extent) < current_loc) {
                        node.start_loc = x_scale(node.data.location) - node.left_extent;
                        current_loc = node.start_loc - group_padding;
                    }
                    else {
                        node.start_loc = current_loc - node.width;
                        current_loc = current_loc - node.width - group_padding;
                    }
                });

            mutation_data.mutation_layout.extent = {
                left: _.first(location_groups).start_loc,
                right: function() { return this.start_loc + this.width; }.call(_.last(location_groups))
            };
        },

        updateVariantScreenLocationsForAllTracks: function() {
            _.each(this.data.tracks, function(track) {
                if (track.type == 'protein') {
                    this.basicProteinTrackLayout(track, this.vis.ref_scale)
                }
                else if (track.type == 'genomic') {
                    this.basicGenomicTrackLayout(track, this.vis.ref_scale)
                }
                else {
                    console.error("Unknown track type \'" + track.type + "\'");
                }
            }, this);
        },

        updateTickScale: function() {
            var scale = this.vis.viewport_scale[0],
                translate = this.vis.viewport_pos[0],
                x0 = this.vis.ref_scale;

            this.vis.tick_scale =
                d3.scale.linear()
                    .domain((x0.range().map(function(x) { return (x - translate) / scale; }).map(x0.invert)))
                    .range([0, this.config.protein_scale.width]);
        },

        getVisibleTicks: function() {
            var min_x = 0,
                max_x = this.data.protein.length;

            return _.filter(this.vis.tick_scale.ticks(20), function(tick) {
                return tick >= min_x && max_x >= tick;
            });
        },

        applyReferenceLines: function() {
            var that = this;

            this.vis.refs.panel.protein
                .selectAll("g.background-ticks")
                .each(function(subtype_data) {
                    var layout = subtype_data.layout;

                    var background_tick = d3.select(this)
                        .selectAll(".loc-tick")
                        .data(function() {
                            return that.getVisibleTicks();
                        }, String);

                    background_tick
                        .enter()
                        .append("g")
                        .attr("class", "loc-tick")
                        .attr("transform", function(d) {
                            return "translate(" + that.vis.tick_scale(d) + ",0)";
                        })
                        .append("svg:line")
                        .attr("y1", layout.background_ticks.y1)
                        .attr("y2", layout.background_ticks.y2)
                        .style("stroke-width", 1.0)
                        .style("stroke", "#ccc");

                    d3.select(this)
                        .selectAll(".loc-tick line")
                        .transition()
                        .duration(500)
                        .attr("y1", layout.background_ticks.y1)
                        .attr("y2", layout.background_ticks.y2);
                });

        },

        updateReferenceLines: function() {
            var that = this,
                x = this.vis.tick_scale;

            this.vis.refs.panel.protein
                .selectAll("g.background-ticks")
                .each(function(track_data) {
                    var layout = track_data.layout;

                    var ref_line = d3.select(this).selectAll(".loc-tick")
                        .data(function() {
                            return that.getVisibleTicks();
                        }, String);

                    ref_line
                        .enter()
                        .append("g")
                        .attr("class", "loc-tick")
                        .attr("transform", function(d) {
                            return "translate(" + x(d) + ",0)";
                        })
                        .append("svg:line")
                        .attr("y1", layout.background_ticks.y1)
                        .attr("y2", layout.background_ticks.y2)
                        .style("stroke-width", 1.0)
                        .style("stroke", "#ccc");

                    ref_line
                        .attr("transform", function(d) {
                            return "translate(" + x(d) + ",0)";
                        });

                    ref_line
                        .exit()
                        .remove();
                });
        },

        updateProteinScaleTicks: function() {
            var that = this,
                x = this.vis.tick_scale;

            this.vis.refs.panel.protein
                .selectAll(".scale")
                .each(function(track_data) {
                    var scale_ticks = d3.select(this)
                        .selectAll(".loc-tick")
                        .data(function(d) {
                            if (d.layout.protein_scale_ticks.enabled === true) {
                                return that.getVisibleTicks();
                            }

                            return [];
                        }, String);

                    scale_ticks
                        .enter()
                        .append("g")
                        .attr("class", "loc-tick")
                        .attr("transform", function(d) {
                            return "translate(" + x(d) + ",0)";
                        })
                        .append("svg:text")
                        .attr("text-anchor", "middle")
                        .attr("y", function() {
                            return 0;
                        })
                        .text(function(d) {
                            return d;
                        });

                    scale_ticks
                        .attr("transform", function(d) {
                            return "translate(" + x(d) + ",0)";
                        });

                    scale_ticks
                        .exit()
                        .remove();
                });
        },

        applyProteinScales: function() {
            var that = this;

            this.vis.refs.panel.protein
                .selectAll(".scale")
                .each(function(track_data) {
                    var scale_line = d3.select(this)
                        .selectAll(".protein-scale")
                        .data(function(d) {
                            if (d.layout.protein_scale_line.enabled === true) {
                                return [d];
                            }

                            return [];
                        }, function(d) {
                            return d.label;
                        });

                    var scale_line_enter = scale_line.enter();
                    var scale_line_exit = scale_line.exit();

                    scale_line_enter
                        .append("svg:line")
                        .attr("class", "protein-scale")
                        .attr("y1", function(d) { return d.layout.protein_scale_ticks.enabled === true ? -that.config.location_tick_height : 0; })
                        .attr("y2", function(d) { return d.layout.protein_scale_ticks.enabled === true ? -that.config.location_tick_height : 0; })
                        .attr("x1", 0)
                        .attr("x2", that.config.protein_scale.width)
                        .style("stroke", "black")
                        .style("opacity", 1e-6);

                    if (that.config.enable_transitions) {
                        scale_line = scale_line
                            .transition()
                            .duration(500);

                        scale_line_exit = scale_line_exit
                            .transition()
                            .duration(500)
                            .style("opacity", 1e-6);
                    }

                    scale_line
                        .attr("y1", function(d) { return d.layout.protein_scale_ticks.enabled === true ? -that.config.location_tick_height : 0; })
                        .attr("y2", function(d) { return d.layout.protein_scale_ticks.enabled === true ? -that.config.location_tick_height : 0; })
                        .style("opacity", 1.0);

                    scale_line_exit
                        .remove();
                });

            this.updateProteinScaleTicks();
        },

        updateMutationMarkers: function() {
            var that = this;

            this.vis.refs.symbols.protein
                .selectAll(".mutations")
                .each(function() {
                    d3.select(this)
                        .attr("transform", function(d) {
                            // Transform:
                            //
                            // 1. translate (<viewport x>, <mutations placement y>)
                            // 2. scale (<viewport x scale>, -1)

                            var trs =
                                "translate(" + (that.vis.viewport_pos[0]) + "," + (d.layout.mutations.y) + ")" +
                                    "scale(" + that.vis.viewport_scale[0] + ", -1)";

                            return trs;
                        });
                });
        },

        applyMutationMarkers: function() {
            var that = this;
            var mutationIdFn = this.mutationIdFn;

            this.vis.refs.symbols.protein
                .selectAll(".mutations")
                .each(function(mutation_data) {
                    var location_to_node_map = mutation_data.mutation_layout.location_to_node_map,
                        hovercard = mutation_data.tooltips.hovercard;

                    var renderCircles = function(d) {
                        d3.select(this)
                            .selectAll(".mutation-type.mutation")
                            .data(d.sample_ids, String)
                            .enter()
                            .append("svg:circle")
                            .attr("r", that.config.mutation_shape_width / 2.0)
                            .attr("class", "mutation")
                            .attr("cx", 0.0)
                            .attr("cy", function(sample, index) {
                                return index * that.config.mutation_shape_width;
                            });

                        d3.select(this).on("mouseover", function(d) {
                            hovercard.call(this, d);
                        });
                    };

                    var renderBars = function(d) {
                        d3.select(this)
                            .selectAll(".mutation-type.mutation")
                            .data(function(d) {
                                return d.processed_samples.color_by.bar_data;
                            })
                            .enter()
                            .append("svg:rect")
                            .attr("class", "mutation")
                            .attr("x", -(that.config.mutation_shape_width / 2.0))
                            .attr("y", function(d) {
                                return d.y;
                            })
                            .attr("width", that.config.mutation_shape_width)
                            .attr("height", function(d) {
                                return d.height;
                            })
                            .style("fill", function(d) {
                                return d.color;
                            });

                        d3.select(this).on("mouseover", function(d) {
                            hovercard.call(this, d);
                        });
                    };

                    var applyMutationTypeGroups = function(data) {
                        var group = location_to_node_map[data.location];

                        var mutation_type_g = d3
                            .select(this)
                            .selectAll("g.mutation-type")
                            .data(function() {
                                return data.mutations;
                            }, mutationIdFn);

                        var mutation_type_enter = mutation_type_g.enter(),
                            mutation_type_exit = mutation_type_g.exit();

                        mutation_type_enter
                            .append("svg:g")
                            .attr("class", "mutation-type")
                            .attr("transform", function(d) {
                                var x = group.scale(mutationIdFn(d)) + that.config.mutation_shape_width / 2.0;
                                var y = that.config.mutation_groups.stems.height * (that.config.enable_mutation_stems === true ? 1 : 0);
                                return "translate(" + x + "," + y + ")";
                            })
                            .style("fill", function(d) {
                                var colors = that.config.mutation_colors,
                                    field = that.config.mutation_color_field;

                                if (_.has(colors, d[field])) {
                                    return colors[d[field]];
                                }
                                else {
                                    return 'lightgray';
                                }
                            })
                            .style("opacity", 1e-6);

                        if (that.config.enable_transitions) {
                            mutation_type_g = mutation_type_g
                                .transition()
                                .duration(500);

                            mutation_type_exit = mutation_type_exit
                                .transition()
                                .duration(500)
                                .style("opacity", 1e-6);
                        }

                        // Update
                        mutation_type_g
                            .attr("transform", function(d) {
                                var x = group.scale(mutationIdFn(d)) + that.config.mutation_shape_width / 2.0;
                                var y = that.config.mutation_groups.stems.height * (that.config.enable_mutation_stems === true ? 1 : 0);
                                return "translate(" + x + "," + y + ")";
                            })
                            .style("opacity", 1.0);

                        mutation_type_exit
                            .remove();
                    };

                    var mutation_group_g = d3.select(this)
                        .selectAll(".mutation.group")
                        .data(_.map(mutation_data.mutations_by_loc, function(mutations, location) {
                            return {
                                location: location,
                                mutations: mutations
                            };
                        }, function(d) {
                            return d.location;
                        }));

                    mutation_group_g
                        .enter()
                        .append("svg:g")
                        .attr("class", "mutation group")
                        .attr("transform", function(d) {
                            var node = location_to_node_map[d.location];
                            return "translate(" + node.start_loc + ",0)";
                        });

                    // Update
                    mutation_group_g
                        .each(applyMutationTypeGroups);

                    if (_.has(mutation_data, 'color_by')) {
                        mutation_group_g
                            .selectAll(".mutation-type")
                            .each(renderBars);
                    }
                    else {
                        mutation_group_g
                            .selectAll(".mutation-type")
                            .each(renderCircles);
                    }

                    mutation_group_g
                        .transition()
                        .duration(500)
                        .attr("transform", function(d) {
                            var node = location_to_node_map[d.location];
                            return "translate(" + node.start_loc + ",0)";
                        });

                    mutation_group_g
                        .exit()
                        .remove();
                });
        },

        applyProteinDomains: function() {
            var that = this;

            var tracks = this.vis.root
                .selectAll(".data-area")
                .selectAll("g.seqpeek-track");

            tracks
                .selectAll(".protein")
                .selectAll(".domains")
                .each(function() {
                    var domains_g =  d3.select(this)
                        .selectAll("g.match")
                        .data(function(d) {
                            return d;
                        })
                        .enter()
                        .append("g")
                        .attr("class", function(d) {
                            return "match " + d.dbname;
                        })
                        .attr("transform", function(d) {
                            var category = d[that.config.protein_domains.key];
                            return "translate(0," + that.vis.domain_scale(category) + ")";
                        });

                    domains_g
                        .selectAll("rect.domain-location")
                        .data(function(d) {
                            var fields = ['dbname', 'evd', 'id', 'name', 'status'];
                            var loc_data = [];
                            _.each(d.locations, function(loc) {
                                var obj = _.pick(d, fields);
                                obj.location = loc;
                                loc_data.push(obj);
                            });

                            return loc_data;
                        }, function(d) {
                            return d.id + "+" + d.location.start + "+" + d.location.end;
                        })
                        .enter()
                        .append("rect")
                        .attr("class", "domain-location")
                        .attr("x", function(d) {
                            return d.location.start;
                        })
                        .attr("width", function(d) {
                            var aa_length = d.location.end - d.location.start;
                            return aa_length;
                        })
                        .attr("height", that.config.signature_height)
                        .style("vector-effect", "non-scaling-stroke");

                    domains_g
                        .selectAll("rect.domain-location")
                        .each(function() {
                            d3.select(this).on("mouseover", function(d) {
                                that.tooltips.interpro.call(this, d);
                            });
                        });

                    domains_g
                        .selectAll("rect.domain-location")
                        .attr("x", function(d) {
                            return d.location.start;
                        })
                        .attr("width", function(d) {
                            return aa_length = d.location.end - d.location.start;
                        });
                });
        },

        updateProteinDomains: function() {
            var that = this;

            this.vis.root
                .selectAll(".data-area")
                .selectAll("g.seqpeek-track")
                .each(function(track_data) {
                    d3.select(this)
                        .selectAll("g.domains")
                        .attr("transform", function() {
                            // Transform:
                            //
                            // 1. translate (<viewport x>, <domain placement y>)
                            // 2. scale (<domain rectangle to 100% viewport>, 0)
                            // 3. scale (<viewport x scale>, -1)
                            var trs =
                                "translate(" + (that.vis.viewport_pos[0]) + "," + (track_data.layout.protein_domains.y) + ")" +
                                    "scale(" + that.vis.viewport_scale[0] * that.vis.domain_rect_scale_factor + ", -1)";

                            return trs;
                        });
                });
        },

        applyStems: function() {
            var that = this;
            var mutationIdFn = this.mutationIdFn;

            this.vis.refs.symbols.protein.selectAll(".mutations")
                .each(function(track_data) {
                    var diagonal = d3.svg.diagonal()
                        .projection(function(d) {
                            return [d.x, d.y];
                        })
                        .source(function(d) {
                            return {
                                x: that.vis.ref_scale(d.location),
                                y: 0
                            };
                        })
                        .target(function(d) {
                            var node = track_data.mutation_layout.location_to_node_map[d.location];
                            return {
                                x: node.start_loc + that.config.mutation_shape_width / 2.0 + node.scale(mutationIdFn(d)),
                                y: that.config.mutation_groups.stems.height - that.config.mutation_shape_width + 1
                            };
                        });

                    var stem = d3
                        .select(this)
                        .selectAll("path.stem")
                        .data(function(d) {
                            return that.config.enable_mutation_stems ? d.mutations_processed : [];
                        }, mutationIdFn);

                    var stem_exit = stem.exit();

                    stem
                        .enter()
                        .append("svg:path")
                        .attr("class", "stem")
                        .style("fill", "none")
                        .style("stroke", "gray")
                        .style("stroke-width", that.config.mutation_groups.stems.stroke_width)
                        .style("vector-effect", "non-scaling-stroke")
                        .append("svg:title")
                        .text(function(d) {
                            return that.getMutationLabelRows(d).join("\n");
                        });

                    if (that.config.enable_transitions) {
                        stem = stem
                            .transition()
                            .duration(500);
                    }

                    stem
                        .attr("d", diagonal);

                    stem_exit
                        .remove();
                });
        },

        setStems: function(stems_enabled) {
            this.config.enable_mutation_stems = stems_enabled;

            this.updateVerticalScaleRanges();
            this.applyStems();
            this.render();
        },

        // ------------
        // Genomic mode
        // ------------

        _getDimensionsForGenomicTrack: function(track, config, param_layout) {
            var layout = param_layout || _.extend({}, track.layout);

            layout.protein_scale_line.y = 450;

            layout.height = 500;

            layout.variants = {
                y: 400
            };

            return layout;
        },

        _samplesColorByForGenomicTrack: function(d, color_by, track, param_statistics) {
            if (!_.has(d, 'processed_samples')) {
                d.processed_samples = {
                    color_by: {}
                };
            }

            var grouped,
                bar_data;

            if (_.isFunction(color_by.group_fn)) {
                grouped = color_by.group_fn(d.sample_ids);
            }
            else {
                grouped = _.countBy(d.sample_ids, function(s) {
                    return s.value;
                });
            }

            if (color_by.type == 'fract') {
                bar_data = ScalingFunctions.createFractionalBars(track, color_by, grouped, param_statistics);
            }
            else if (color_by.type == 'log2nabs') {
                bar_data = ScalingFunctions.createLog2Bars(track, color_by, grouped, param_statistics);
            }
            else if (color_by.type == 'log2nnorm') {
                bar_data = ScalingFunctions.createNormalizedLogBars(track, color_by, grouped, param_statistics);
            }
            else if (color_by.type == 'linnorm') {
                bar_data = ScalingFunctions.createNormalizedLinearBars(track, color_by, grouped, param_statistics);
            }
            else {
                console.error('Invalid color_by type \'' + color_by.type + '\'');
            }

            var data_obj = _.clone(color_by);
            data_obj.bar_data = bar_data.array;
            data_obj.category_counts = grouped;
            d.processed_samples.color_by = data_obj;
        },

        processDataGenomic: function() {
            var that = this;
            var data = this.data;

            var processSamples = function(entries) {
                var mutation_data = _.extend({}, entries[0], {}),
                    id_field = that.config.mutation_sample_id_field;

                mutation_data.sample_ids = _.map(entries, function(e) {
                    return {
                        id: e[id_field],
                        value: e.value
                    };
                });

                mutation_data[id_field] = null;

                return mutation_data;
            };

            data.subtype_to_index_map = {};

            _.chain(data.tracks)
            .filter(function(track) {
                return track.type == 'genomic';
            })
            .each(function(track, index) {
                data.subtype_to_index_map[track.label] = index;

                if (! _.has(track, 'variants_by_loc') && ! _.has(track, 'variants_processed')) {
                    var variants_by_loc = _
                        .chain(track.variants)
                        .groupBy(track.variant_id_field)
                        .map(processSamples)
                        .groupBy(track.variant_coordinate_field)
                        .value();

                    // Create flat array of all mutations
                    var all_variants = [];

                    _.each(variants_by_loc, function(variants, location) {
                        all_variants.push.apply(all_variants, variants);
                    });

                    track.variants_by_loc = variants_by_loc;
                    track.variants_processed = all_variants;

                    that.createTrackStatistics(track, 'variants_by_loc');

                    // If 'Color By' functionality is enabled, calculate needed statistics
                    if (_.has(track, 'color_by') && track.color_by.type != 'none') {
                        _.each(variants_by_loc, function(variants, location) {
                            _.each(variants, function(m) {
                                that._samplesColorByForProteinTrack(m, track.color_by, track);
                            });
                        });
                    }
                }

                _.each(track.region_data, function(region) {
                    if (! _.has(region, 'variants_by_loc') && ! _.has(region, 'variants_processed')) {
                        var variants_by_loc = _
                            .chain(region.data)
                            .groupBy(track.variant_id_field)
                            .map(processSamples)
                            .groupBy(track.variant_coordinate_field)
                            .value();

                        // Create flat array of all mutations
                        var all_variants = [];

                        _.each(variants_by_loc, function(variants, location) {
                            all_variants.push.apply(all_variants, variants);
                        });

                        region.variants_by_loc = variants_by_loc;
                        region.variants_processed = all_variants;

                        that.createTrackStatistics(region, 'variants_by_loc');

                        // If 'Color By' functionality is enabled, calculate needed statistics
                        if (_.has(track, 'color_by') && track.color_by.type != 'none') {
                            _.each(variants_by_loc, function(variants, location) {
                                _.each(variants, function(m) {
                                    that._samplesColorByForGenomicTrack(m, track.color_by, track, track.statistics);
                                });
                            });
                        }
                    }
                });

                var default_layout = {
                    background_ticks: {
                        y1: 0,
                        y2: 0
                    },
                    mutations: {
                        y: 0
                    },
                    protein_scale_line: {
                        enabled: true,
                        y: 0
                    },
                    protein_scale_ticks: {
                        enabled: true,
                        y: 0
                    },
                    protein_domains: {
                        enabled: true,
                        y: 0
                    },
                    y: 0
                };

                track.layout = _.extend(default_layout, track.layout);

                track.tooltip_handlers = {
                    variants: vq.hovercard({
                        canvas_id: that.config.guid,
                        include_header: false,
                        include_footer: true,
                        self_hover: true,
                        timeout: 200,
                        param_data: true,
                        data_config: track.tooltips.variants.items
                    })
                };
            });

            data.all_variants_by_loc = _
                .chain(data.tracks)
                .pluck('variants_by_loc')
                .reduce(function(memo, locations, index) {
                    _.each(locations, function(data, loc) {
                        if (!_.has(memo, loc)) {
                            memo[loc] = data.slice(0);
                        }
                        else {
                            // Concatenate the array 'data' to memo[loc}
                            memo[loc].push.apply(memo[loc], data.slice(0));
                        }
                    });
                    return memo;
                }, {})
                .value();

            this.alignVariantsGenomic();
        },

        _buildLocationGroupsForVariants: function(mutations_by_loc) {
            var that = this;
            var mutationIdFn = this.mutationIdFn;

            return _
                .chain(mutations_by_loc)
                .map(function(mutations, location) {
                    var group,
                        scale = d3.scale.ordinal();

                    mutations.sort(_.bind(that.mutationSortFn, that));

                    var mutation_ids_sorted = _
                        .chain(mutations)
                        .map(mutationIdFn)
                        .uniq()
                        .value();

                    scale.domain(mutation_ids_sorted);
                    scale.rangeBands([0, mutation_ids_sorted.length * that.config.mutation_shape_width]);

                    var width = scale.rangeExtent()[1];

                    group = {
                        data: {
                            // The "location" variable needs to be converted to a numerical type
                            // for the sort below to work correctly.
                            location: parseInt(location, 10),
                            mutations: mutations
                        },
                        scale: scale,
                        left_extent: width / 2.0,
                        right_extent: width / 2.0,
                        start_loc: 0.0,
                        width: width
                    };

                    return group;
                })
                .sortBy(function(group) {
                    return group.data.location;
                })
                .value();
        },

        _buildLocationGroupsForVariantsInRegion: function(region) {
            var that = this;
            var mutationIdFn = this.mutationIdFn,
                mutations_by_loc = region.variants_by_loc;

            return _
                .chain(mutations_by_loc)
                .map(function(mutations, location) {
                    var group,
                        scale = d3.scale.ordinal();

                    mutations.sort(_.bind(that.mutationSortFn, that));

                    var mutation_ids_sorted = _
                        .chain(mutations)
                        .map(mutationIdFn)
                        .uniq()
                        .value();

                    scale.domain(mutation_ids_sorted);
                    scale.rangeBands([0, mutation_ids_sorted.length * that.config.mutation_shape_width]);

                    var width = scale.rangeExtent()[1];

                    group = {
                        data: {
                            // The "location" variable needs to be converted to a numerical type
                            // for the sort below to work correctly.
                            location: parseInt(location, 10),
                            mutations: mutations
                        },
                        scale: scale,
                        left_extent: width / 2.0,
                        right_extent: width / 2.0,
                        start_loc: 0.0,
                        width: width
                    };

                    return group;
                })
                .sortBy(function(group) {
                    return group.data.location;
                })
                .value();
        },

        alignVariantsGenomic: function() {
            var that = this;
            var data = this.data;


            _.chain(data.tracks)
                .filter(function(track) {
                    return track.type == 'genomic'
                })
                .each(function(track) {

                    _.each(track.region_data, function(region) {
                        var layout = {},
                            location_groups = that._buildLocationGroupsForVariantsInRegion(region);

                        layout.location_groups = location_groups;

                        layout.location_to_node_map = _.reduce(location_groups, function(memo, group) {
                            memo[group.data.location] = group;
                            return memo;
                        }, {});

                        layout.location_to_node_index_map = _.reduce(location_groups, function(memo, group, index) {
                            memo[group.data.location] = index;
                            return memo;
                        }, {});

                        region.variant_layout = layout;
                    });

                    var layout = {};
                    var location_groups;

                    location_groups = that._buildLocationGroupsForVariants(track.variants_by_loc);

                    layout.location_groups = location_groups;

                    layout.location_to_node_map = _.reduce(location_groups, function(memo, group) {
                        memo[group.data.location] = group;
                        return memo;
                    }, {});

                    layout.location_to_node_index_map = _.reduce(location_groups, function(memo, group, index) {
                        memo[group.data.location] = index;
                        return memo;
                    }, {});

                    track.variant_layout = layout;
                });
        },

        basicGenomicTrackLayout: function(track, param_scale) {
            var that = this,
                location_to_node_map = track.variant_layout.location_to_node_map,
                viewport_x = this.vis.viewport_pos[0],
                vis_coord = this.vis.visible_genomic_coordinates;

            var node_locations = _
                .chain(location_to_node_map)
                .keys()
                .map(function(d) {return parseInt(d, 10);})
                .sortBy(function(d) {return d;})
                .value();

            var pivot_location = node_locations[0];

            var x_scale = d3.scale.linear().domain([0, 1500]).range([0, 500]);

            var pivot_node = location_to_node_map[pivot_location];

            pivot_node.start_loc = x_scale(pivot_node.data.location) - pivot_node.left_extent;

            // Justify locations right of the pivot
            var group_padding = 5.0;
            var current_loc = 0.0 + viewport_x;

            var is_visible_group = function(coordinate) {
                return vis_coord[0] <= coordinate  && coordinate <= vis_coord[1];
            };

            _.each(track.region_data, function(region) {
                _.each(region.variant_layout.location_groups, function(node) {
                    var location = node.data.location;

                    if (is_visible_group(location)) {
                        var variant_screen_loc = region.layout.get_screen_location_for_coordinate(location);

                        node.start_loc = variant_screen_loc > current_loc ? variant_screen_loc : current_loc;
                        node.start_loc -= node.left_extent;

                        current_loc = node.start_loc + node.width + group_padding;
                    }
                });
            });
        },


        regionLayout: function(region_data) {
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
                    width = 10;
                }

                var coordinate_scale = d3.scale.linear().domain([start, region_end]).range([current_loc, current_loc + width]);
                var inverse_scale = d3.scale.linear().domain([0, width]).range([start, region_end]);

                region.layout = {
                    screen_x: current_loc,
                    screen_width: width,
                    coordinate_scale: coordinate_scale,
                    inverse_scale: inverse_scale,
                    get_screen_location_for_coordinate: function(coordinate) {
                        return coordinate_scale(coordinate) + self.vis.viewport_pos[0];
                    }
                };

                current_loc = current_loc + width + 1;
            });

            return {
                start_coordinate: region_data[0].start,
                end_coordinate: _.last(region_data).end,
                total_width:  current_loc - 1
            };
        },

        renderCodingRegions: function() {
            this.vis.root
                .selectAll(".panel-area")
                .selectAll("g.seqpeek-track")
                .selectAll(".genomic")
                .each(function(track) {
                    var get_scale_y = function() {
                        return track.layout.protein_scale_line.y;
                    };

                    d3.select(this).selectAll(".region.exon")
                        .each(function() {
                            d3.select(this)
                                .append("svg:line")
                                .attr("class", "x-scale")
                                .attr("x1", function(d) {
                                    return 0.0;
                                })
                                .attr("x2", function(d) {
                                    return d.layout.screen_width;
                                })
                                .attr("y1", function(d) {
                                    return get_scale_y();
                                })
                                .attr("y2", function(d) {
                                    return get_scale_y();
                                })
                                .style("stroke", "black");
                        });
                });

            this.vis.root
                .selectAll(".panel-area")
                .selectAll("g.seqpeek-track")
                .selectAll(".genomic")
                .each(function(track) {
                    var get_scale_y = function() {
                        return track.layout.protein_scale_line.y;
                    };

                    d3.select(this).selectAll(".region.noncoding")
                        .each(function() {
                            d3.select(this)
                                .append("svg:rect")
                                .attr("class", "x-scale")
                                .attr("x", function(d) {
                                    return 0.0;
                                })
                                .attr("width", function(d) {
                                    return d.layout.screen_width;
                                })
                                .attr("y", function(d) {
                                    return get_scale_y() - 2.5;
                                })
                                .attr("height", 5)
                                .style("fill", "blue")
                                .style("stroke", "blue");
                        });
                });
        },

        _getCoordinateFromScaleLocation: function(track, x) {
            var region;

            for (var i = 0; i < track.region_data.length; ++i) {
                region = track.region_data[i];

                if (region.layout.screen_x <= x && x <= (region.layout.screen_x + region.layout.screen_width)) {
                    return region.layout.inverse_scale(x);
                }
            }

            return _.last(track.region_data).end;
        },

        _getVisibleCoordinates: function() {
            var x = -this.vis.viewport_pos[0],
                width = this.vis.viewport_size[0],
                track = this.data.tracks[0],
                min_x = d3.max([x, 0]),
                max_x = d3.min([x + width, width]);

            if (track.type == 'protein') {
                return this.vis.visible_coordinates;
            }

            this._getCoordinateFromScaleLocation(this.data.tracks[0], -180 + 1300);

            var start = this._getCoordinateFromScaleLocation(this.data.tracks[0], min_x);
            var end = this._getCoordinateFromScaleLocation(this.data.tracks[0], max_x);

            if (start < track.region_metadata.start_coordinate) {
                start = track.region_metadata.start_coordinate;
            }

            if (end > track.region_metadata.end_coordinate) {
                end = track.region_metadata.end_coordinate;
            }

            return [start, end];
        },

        _scrollRegions: function() {
            var that = this;

            this.vis.visible_genomic_coordinates = this._getVisibleCoordinates([]);

            this.vis.root
                .selectAll(".panel-area")
                .selectAll("g.seqpeek-track")
                .selectAll(".genomic")
                .each(function() {
                    d3.select(this)
                        .attr("transform", function(d) {
                            // Transform:
                            //
                            // 1. translate (<viewport x>, <mutations placement y>)
                            // 2. scale (<viewport x scale>, -1)
                            /*
                             var trs =
                             "translate(" + (that.vis.viewport_pos[0]) + "," + (d.layout.mutations.y) + ")" +
                             "scale(" + that.vis.viewport_scale[0] + ", -1)";
                             */
                            var trs =
                                "translate(" + (that.vis.viewport_pos[0]) + ",0)";

                            return trs;
                        });
                });

            this._updateVisibleVariantGroupsForTracks();

            this.updateVariantScreenLocationsForAllTracks();

            this._scrollVariantGroups();
            this._scrollStems();
        },

        _scrollVariantGroups: function() {
            this.vis.refs.symbols.genomic
                .selectAll(".variants")
                .selectAll(".variant.group")
                .remove();

            this.renderVariantGroups();
        },

        _scrollStems: function() {
            this.vis.refs.symbols.genomic
                .selectAll(".variants")
                .selectAll(".stem")
                .remove();

            this.renderVariantStems();
        },

        _updateVisibleVariantGroupsForTracks: function() {
            _.chain(this.data.tracks)
                .filter(function(track) {
                    return track.type == 'genomic';
                })
                .each(function(track) {

                });
        },

        _getDataByLocationMapForTrack: function(track) {
            var that = this,
                vis_coord = this.vis.visible_genomic_coordinates;

            if (track.type == 'protein') {
                return track.mutations_by_loc;
            }
            else if (track.type == 'genomic') {
                var data_by_loc = _.reduce(track.region_data, function(data_array, region) {

                    _.each(region.variants_by_loc, function(variants, location) {
                        data_array.push({
                            location: location,
                            mutations: variants,
                            layout: region.variant_layout,
                            group: region.variant_layout.location_to_node_map[location]
                        });
                    });

                    return data_array;
                }, []);

                return _.filter(data_by_loc, function(location_info) {
                    var int_loc = parseInt(location_info.location);

                    return int_loc >= vis_coord[0] && vis_coord[1] >= int_loc;
                });
            }
            else {
                console.error("Unknown track type: \'" + track.type + "\'");
                return null;
            }
        },

        _applyVariantTypeGroups: function(selection, mutationIdFn, track_layout) {
            this.each(function(data) {
                var group = data.group;

                var mutation_type_g = d3
                    .select(this)
                    .selectAll("g.variant-type")
                    .data(function() {
                        return data.mutations;
                    }, mutationIdFn);

                var mutation_type_enter = mutation_type_g.enter(),
                    mutation_type_exit = mutation_type_g.exit();

                mutation_type_enter
                    .append("svg:g")
                    .attr("class", "variant-type")
                    .attr("transform", function(d) {
                        var x = group.scale(mutationIdFn(d)) + 10.0 / 2.0;
                        var y = -track_layout.variants.y;
                        return "translate(" + x + "," + y + ")";
                    });

                mutation_type_exit
                    .remove();
            });
        },

        renderVariantGroups: function() {
            var self = this;

            var get_visible_variant_groups = function(data) {
                return data.variant_layout.location_groups;
            };

            var tracks = this.vis.root
                .selectAll(".data-area")
                .selectAll("g.seqpeek-track");

            tracks
                .each(function(track_data) {
                    var variant_group = d3
                        .select(this)
                        .selectAll(".genomic")
                        .selectAll("g.variants")
                        .data(function(d) {
                            return [d];
                        }, function(d) {
                            return d.label;
                        });

                    variant_group
                        .enter()
                        .append("g")
                        .attr("class", "variants")
                        .attr("transform", function(d) {
                            var trs = "scale(1,-1)";
                            return trs;
                        });
                });

            var renderBars = function(d) {
                d3.select(this)
                    .selectAll(".variant-type.variant")
                    .data(function(d) {
                        return d.processed_samples.color_by.bar_data;
                    })
                    .enter()
                    .append("svg:rect")
                    .attr("class", "variant")
                    .attr("x", -self.config.mutation_shape_width)
                    .attr("y", function(d) {
                        return d.y;
                    })
                    .attr("width", self.config.mutation_shape_width)
                    .attr("height", function(d) {
                        return d.height;
                    })
                    .style("fill", function(d) {
                        return d.color;
                    });
            };


            this.vis.refs.symbols.genomic
                .selectAll(".variants")
                .each(function(track) {
                    var data_by_loc = self._getDataByLocationMapForTrack(track);

                    var variant_group_g = d3.select(this)
                        .selectAll(".variant.group")
                        .data(data_by_loc);

                    variant_group_g
                        .enter()
                        .append("svg:g")
                        .attr("class", "variant group")
                        .attr("transform", function(d) {
                            return "translate(" + d.group.start_loc + ",0)";
                        });

                    variant_group_g.call(self._applyVariantTypeGroups, self.mutationIdFn, track.layout);

                    if (_.has(track, 'color_by')) {
                        variant_group_g
                            .selectAll(".variant-type")
                            .each(renderBars)
                            .on("mouseover", function(d) {
                                track.tooltip_handlers.variants.call(this, d);
                            });
                    }
                });
        },

        _buildStemData: function(track) {
            var that = this;

            var result = _.reduce(track.region_data, function(stem_array, region) {

                _.each(region.variant_layout.location_groups, function(node) {
                    var coordinate = node.data.location;
                    _.each(node.scale.domain(), function(variant_type) {
                        stem_array.push({
                            sx: region.layout.get_screen_location_for_coordinate(coordinate),
                            sy: -track.layout.height + 50.0,
                            tx: node.start_loc + that.config.mutation_shape_width / 2.0 + node.scale(variant_type),
                            ty: -400,
                            coordinate: coordinate
                        });
                    });
                });

                return stem_array;

            }, []);

            // Filter out invisible stems
            var vis_coord = this.vis.visible_genomic_coordinates;

            return _.filter(result, function(stem) {
                var coord = stem.coordinate;
                return coord >= vis_coord[0] && vis_coord[1] >= coord;
            });
        },

        renderVariantStems: function() {
            var that = this;

            this.vis.refs.symbols.genomic
                .selectAll(".variants")
                .each(function(track_data) {
                    var diagonal = d3.svg.diagonal()
                        .projection(function(d) {
                            return [d.x, d.y];
                        })
                        .source(function(d) {
                            return {
                                x: d.sx,
                                y: d.sy
                            };
                        })
                        .target(function(d) {
                            return {
                                x: d.tx,
                                y: d.ty
                            };
                        });

                    var stem_data = that._buildStemData(track_data),
                        stem = d3
                        .select(this)
                        .selectAll("path.stem")
                        .data(stem_data);

                    var stem_exit = stem.exit();

                    stem
                        .enter()
                        .append("svg:path")
                        .attr("class", "stem")
                        .style("fill", "none")
                        .style("stroke", "gray")
                        .style("stroke-width", that.config.mutation_groups.stems.stroke_width)
                        .style("vector-effect", "non-scaling-stroke")
                        .append("svg:title")
                        .text(function(d) {
                            return that.getMutationLabelRows(d).join("\n");
                        });

                    stem
                        .attr("d", diagonal);

                    stem_exit
                        .remove();
                });

        }
    };

    return {
        create: function(target_el) {
            var obj = Object.create(SeqPeekPrototype, {}),
                guid = 'C' + vq.utils.VisUtils.guid(); // div id must start with letter

            obj.config = {
                target_el: target_el,
                guid: guid
            };

            return obj;
        }
    };
});
