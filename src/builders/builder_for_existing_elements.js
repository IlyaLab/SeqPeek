define   (
[
    'd3',

    '../util/data_adapters',
    '../util/gene_region_utils',
    '../util/region_layouts',
    '../seqpeek_viewport',
    '../seqpeek_svg_context',
    '../variant_layout',
    '../tracks/bar_plot_track',
    '../tracks/sample_plot_track',
    '../tracks/region_scale_track',
    '../tracks/horizontal_tick_track',
    '../tracks/protein_domain_track'
],
function (
    d3,

    DataAdapters,
    GeneRegionUtils,
    RegionLayouts,
    ViewportFactory,
    SeqPeekSVGContextFactory,
    VariantLayoutFactory,
    BarPlotTrackFactory,
    SamplePlotTrackFactory,
    RegionTrackFactory,
    TickTrackFactory,
    ProteinDomainTrackFactory
) {
    var VERTICAL_PADDING = 10,
        BAR_PLOT_TRACK_MAX_HEIGHT = 100,
        SAMPLE_PLOT_TRACK_MAX_HEIGHT = 100,
        TICK_TRACK_HEIGHT = 25,
        REGION_TRACK_HEIGHT = 10,
        VIEWPORT_WIDTH = 1000;

    var DEFAULT_BAR_PLOT_TRACK_CONFIG = {
        color_scheme: {
            'all': '#fd8f42'
        },
        bar_width: 5.0,
        height: BAR_PLOT_TRACK_MAX_HEIGHT,
        stem_height: 30.0,
        scaling: {
            type: 'log2nabs',
            min_height: 10,
            max_height: BAR_PLOT_TRACK_MAX_HEIGHT - 30,
            scaling_factor: 200
        },
        category_totals: {}
    };

    var DEFAULT_SAMPLE_PLOT_TRACK_CONFIG = {
        color_scheme: {
            'all': 'gray'
        },
        glyph_width: 5.0,
        height: SAMPLE_PLOT_TRACK_MAX_HEIGHT,
        stem_height: 30.0,
        hovercard_config: {
            include_header: false,
            include_footer: true,
            self_hover: true,
            timeout: 200,
            tool_config: []
        },
        hovercard_content: {
            "key": function(d) {
                return "value";
            }
        }
    };

    var DEFAULT_REGION_LAYOUT_CONFIG = {
        intron_width: 5.0
    };

    var DEFAULT_VARIANT_LAYOUT_CONFIG = {
        variant_width: 5.0
    };

    var DEFAULT_VIEWPORT_CONFIG = {
        width: VIEWPORT_WIDTH
    };

    var DEFAULT_REGION_TRACK_CONFIG = {
        height: REGION_TRACK_HEIGHT
    };

    var DEFAULT_TICK_TRACK_CONFIG = {
        height: TICK_TRACK_HEIGHT,
        tick_height: 10,
        tick_text_y: 22
    };

    var DEFAULT_PROTEIN_DOMAIN_TRACK_CONFIG = {
        domain_height: 10,
        height: 40,
        color_scheme: {
            'all': 'gray'
        },
        hovercard_config: {
            include_header: false,
            include_footer: true,
            self_hover: true,
            timeout: 200,
            tool_config: []
        },
        hovercard_content: {
            "DB": function(d) {
                return d.dbname;
            },
            "EVD": function(d) {
                return d.evd;
            },
            "ID": function(d) {
                return d.id;
            },
            "Name": function(d) {
                return d.name;
            },
            "Status": function(d) {
                return d.status;
            },
            "LOC": function(d) {
                return d.start + " - " + d.end;
            }
        }
    };

    var BuilderForExistingElementsPrototype = {

        _initialize: function(config) {
            // Custom configurations
            this.config = config;

            // Internal variables
            this.tracks_array = [];

            this.variant_layout_data = [];

            this.region_data = null;
            this.region_metadata = null;
            this.region_layout = null;

            this.viewport = null;
            this.scroll_handler = null;

            this.variant_layout = null;
        },

        _initRegionLayout: function() {
            var self = this,
                config = _.extend(DEFAULT_REGION_LAYOUT_CONFIG, this.config.region_layout);

            self.region_data = GeneRegionUtils.buildRegionsFromArray(this.config.region_data);

            this.region_layout = RegionLayouts.BasicLayoutFactory
                .create({});

            _.each(config, function(value, function_key) {
                self.region_layout[function_key](value);
            });

            self.region_layout.process(self.region_data);
            self.region_metadata = self.region_layout.getMetadata();
        },

        _initViewport: function() {
            var self = this,
                region_metadata = self.region_metadata;

            this.viewport = ViewportFactory.createFromRegionData(this.region_layout, region_metadata, this.config.viewport.width);

            this.viewport.setViewportPosition({
                x: 0,
                y: 0
            });
        },

        _initVariantLayout: function() {
            var self = this,
                config = _.extend(DEFAULT_VARIANT_LAYOUT_CONFIG, this.config.variant_layout);

            this.variant_layout = VariantLayoutFactory.create({});

            _.each(this.variant_layout_data, function(entry) {
                self.variant_layout.add_track_data(entry.data_array);
            });

            this.variant_layout
                .location_field(this.config.variant_data_location_field)
                .variant_type_field(this.config.variant_data_type_field)
                .regions(this.region_data)
                .processFlatArray('coordinate');

            _.each(config, function(value, function_key) {
                self.variant_layout[function_key](value);
            });
        },

        _initBarPlotTrack: function(track_info) {
            var self = this,
                config = _.extend(DEFAULT_BAR_PLOT_TRACK_CONFIG, this.config.bar_plot_tracks, track_info.config),
                track_data = track_info.data,
                track_instance = BarPlotTrackFactory
                    .create()
                    .data(track_data, function(d) {return d;})
                    .regions(self.region_data, 'coordinate')
                    .variant_layout(self.variant_layout);

            _.each(config, function(value, function_key) {
                track_instance[function_key](value);
            });

            return track_instance;
        },

        _initSamplePlotTrack: function(track_info) {
            var self = this,
                config = _.extend(DEFAULT_SAMPLE_PLOT_TRACK_CONFIG, this.config.sample_plot_tracks, track_info.config),
                track_data = track_info.data,
                track_instance = SamplePlotTrackFactory
                    .create()
                    .data(track_data, function(d) {return d;})
                    .regions(self.region_data, 'coordinate')
                    .variant_layout(self.variant_layout);

            _.each(config, function(value, function_key) {
                track_instance[function_key](value);
            });

            return track_instance;
        },

        _initSampleBasedTrackContext: function(track_instance, track_info) {
            var self = this,
                element = track_info.element;

            return SeqPeekSVGContextFactory.createIntoSVG(element)
                .track(track_instance)
                .width(self.config.viewport.width)
                .scroll_handler(self.scroll_handler)
                .region_layout(self.region_layout)
                .viewport(self.viewport);
        },

        _initRegionScaleTrack: function(track_info) {
            var config = _.extend(DEFAULT_REGION_TRACK_CONFIG, this.config.region_track, track_info.config),
                track_instance = RegionTrackFactory
                    .create()
                    .data(this.region_data);

            _.each(config, function(value, function_key) {
                track_instance[function_key](value);
            });

            return track_instance;
        },

        _initRegionDataDependentContext: function(track_instance, track_info) {
            var self = this,
                element = track_info.element;

            return SeqPeekSVGContextFactory.createIntoSVG(element)
                .track(track_instance)
                .width(self.config.viewport.width)
                .scroll_handler(self.scroll_handler)
                .viewport(self.viewport)
                .region_layout(self.region_layout);

        },

        _initTickTrack: function(track_info) {
            var self = this,
                config = _.extend(DEFAULT_TICK_TRACK_CONFIG, this.config.tick_tracks, track_info.config);

            var track_instance = TickTrackFactory
                .create()
                .data(self.region_data);

            _.each(config, function(value, function_key) {
                track_instance[function_key](value);
            });

            return track_instance;
        },

        _initProteinDomainTrack: function(track_info) {
            var self = this,
                track_data = track_info.data,
                config = _.extend(DEFAULT_PROTEIN_DOMAIN_TRACK_CONFIG, this.config.protein_domain_tracks, track_info.config);

            var track_instance = ProteinDomainTrackFactory
                .create()
                .domain_data(track_data)
                .regions(self.region_data, 'coordinate')
                .variant_layout(self.variant_layout);

            _.each(config, function(value, function_key) {
                track_instance[function_key](value);
            });

            return track_instance;
        },

        _initTrackContexts: function() {
            var self = this;

            _.each(this.tracks_array, function(track_info) {
                var track_instance,
                    context;

                if (track_info.type == 'bar_plot') {
                    track_instance = self._initBarPlotTrack(track_info);
                    context = self._initSampleBasedTrackContext(track_instance, track_info);
                }
                else if (track_info.type == 'sample_plot') {
                    track_instance = self._initSamplePlotTrack(track_info);
                    context = self._initSampleBasedTrackContext(track_instance, track_info);
                }
                else if (track_info.type == 'region_scale') {
                    track_instance = self._initRegionScaleTrack(track_info);
                    context = self._initRegionDataDependentContext(track_instance, track_info);
                }
                else if (track_info.type == 'tick') {
                    track_instance = self._initTickTrack(track_info);
                    context = self._initRegionDataDependentContext(track_instance, track_info);
                }
                else if (track_info.type == 'protein_domains') {
                    track_instance = self._initProteinDomainTrack(track_info);
                    context = self._initRegionDataDependentContext(track_instance, track_info);
                }
                else {
                    console.log("Skipping " + track_info.type);
                    return;
                }

                track_info.track_instance = track_instance;
                track_info.context = context;
            });
        },

        _initScrollHandler: function() {
            var self = this;
            this.scroll_handler = function(event) {
                self.viewport.setViewportPosition({
                    x: event.translate[0],
                    y: 0
                });

                var visible_coordinates = self.viewport._getVisibleCoordinates();
                self.variant_layout.doLayoutForViewport(visible_coordinates, 'coordinate');

                _.each(self.tracks_array, function(track_info) {
                    var context = track_info.context;
                    _.bind(context._updateViewportTranslation, context)();
                });
            }
        },

        ////////////////
        // Public API //
        ////////////////
        addBarPlotTrackWithArrayData: function(variant_array, track_container_element, track_config) {
            var type_field_name = this.config.variant_data_type_field,
                location_field_name = this.config.variant_data_location_field;

            var track_data = DataAdapters.group_by_location(variant_array, type_field_name, location_field_name);
            DataAdapters.apply_statistics(track_data, function() {return 'all';});

            this.variant_layout_data.push({
                data_array: variant_array
            });

            this.tracks_array.push({
                type: 'bar_plot',
                data: track_data,
                element: track_container_element,
                config: track_config
            });
        },

        addSamplePlotTrackWithArrayData: function(variant_array, track_container_element, track_config) {
            var type_field_name = this.config.variant_data_type_field,
                location_field_name = this.config.variant_data_location_field;

            var track_data = DataAdapters.group_by_location(variant_array, type_field_name, location_field_name);
            DataAdapters.apply_statistics(track_data, function() {return 'all';});

            this.variant_layout_data.push({
                data_array: variant_array
            });

            this.tracks_array.push({
                type: 'sample_plot',
                data: track_data,
                element: track_container_element,
                config: track_config
            });
        },

        addRegionScaleTrackToElement: function(track_container_element, track_config) {
            this.tracks_array.push({
                type: 'region_scale',
                element: track_container_element,
                config: track_config
            });
        },

        addTickTrackToElement: function(track_container_element, track_config) {
            this.tracks_array.push({
                type: 'tick',
                element: track_container_element,
                config: track_config
            });
        },

        addProteinDomainTrackToElement: function(domain_object, track_container_element, track_config) {
            this.tracks_array.push({
                type: 'protein_domains',
                data: domain_object,
                element: track_container_element,
                config: track_config
            });
        },

        draw: function() {
            this._initRegionLayout();
            this._initVariantLayout();
            this._initViewport();

            this._initScrollHandler();

            this._initTrackContexts();

            var initial_viewport = this.tracks_array[0].context.getCurrentViewport();
            this.variant_layout.doLayoutForViewport(initial_viewport.getVisibleCoordinates(), 'coordinate');

            _.each(this.tracks_array, function(track_info) {
                track_info.context.draw();
            });
        }
    };

    return {
        create: function(config) {
            var obj = Object.create(BuilderForExistingElementsPrototype, {});
            obj._initialize(config);
            return obj;
        }
    };
});