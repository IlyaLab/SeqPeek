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
    '../tracks/horizontal_tick_track'
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
    TickTrackFactory
) {
    var VERTICAL_PADDING = 10,
        BAR_PLOT_TRACK_MAX_HEIGHT = 100,
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

    var BuilderForExistingElementsPrototype = {

        _initialize: function(config) {
            // Custom configurations
            this.config = config;

            // Internal variables
            this.tracks_array = [];

            this.bar_plot_track_data = [];
            this.bar_plot_track_instances = [];
            this.bar_plot_SVG_contexts = [];

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
                region_data = self.region_data,
                region_metadata = self.region_metadata;

            this.viewport = ViewportFactory.createFromRegionData(region_data, region_metadata, this.config.viewport.width);

            this.viewport.setViewportPosition({
                x: 0,
                y: 0
            });
        },

        _initVariantLayout: function() {
            var self = this,
                config = _.extend(DEFAULT_VARIANT_LAYOUT_CONFIG, this.config.variant_layout);

            this.variant_layout = VariantLayoutFactory.create({});

            _.each(this.bar_plot_track_data, function(entry) {
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

        _initBarPlotTracks: function() {
            var self = this,
                config = _.extend(DEFAULT_BAR_PLOT_TRACK_CONFIG, this.config.bar_plot_tracks);

            _.each(this.bar_plot_track_data, function(entry) {
                var track_data = entry.data,
                    track_instance = entry.factory
                        .create()
                        .data(track_data, function(d) {return d;})
                        .regions(self.region_data, 'coordinate')
                        .variant_layout(self.variant_layout);

                _.each(config, function(value, function_key) {
                    track_instance[function_key](value);
                });

                self.bar_plot_track_instances.push(track_instance);
            });
        },

        _initBarPlotContexts: function() {
            var self = this;

            _.chain(_.zip(
                this.bar_plot_track_instances,
                this.bar_plot_track_data
            ))
            .each(function(bar_plot_info) {
                var track_instance = bar_plot_info[0],
                    element = bar_plot_info[1].element;

                var context = SeqPeekSVGContextFactory.createIntoSVG(element)
                    .track(track_instance)
                    .width(self.config.viewport.width)
                    .scroll_handler(self.scroll_handler)
                    .viewport(self.viewport);

                self.bar_plot_SVG_contexts.push(context);
            });
        },

        _initRegionScaleTrack: function() {
            var config = _.extend(DEFAULT_REGION_TRACK_CONFIG, this.config.region_track),
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

            var context = SeqPeekSVGContextFactory.createIntoSVG(element)
                .track(track_instance)
                .width(self.config.viewport.width)
                .scroll_handler(self.scroll_handler)
                .viewport(self.viewport);

            return context;
        },

        _initTrackContexts: function() {
            var self = this;

            _.each(this.tracks_array, function(track_info) {
                if (track_info.type == 'region_scale') {
                    var track_instance = self._initRegionScaleTrack(),
                        context = self._initRegionDataDependentContext(track_instance, track_info);

                    track_info.track_instance = track_instance;
                    track_info.context = context;
                }
                else if (track_info.type == 'tick') {
                    var track_instance = self._initTickTrack(),
                        context = self._initRegionDataDependentContext(track_instance, track_info);

                    track_info.track_instance = track_instance;
                    track_info.context = context;
                }
                else {
                    console.log("Skipping " + track_info.type);
                }
            });
        },

        _initTickTrack: function() {
            var self = this,
                config = _.extend(DEFAULT_TICK_TRACK_CONFIG, this.config.tick_track);

            var track_instance = TickTrackFactory
                .create()
                .data(self.region_data);

            _.each(config, function(value, function_key) {
                track_instance[function_key](value);
            });

            return track_instance;
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

                // Update viewport for each bar plot context
                _.each(self.bar_plot_SVG_contexts, function(context) {
                    _.bind(context._updateViewportTranslation, context)();
                });

                _.each(self.tracks_array, function(track_info) {
                    var context = track_info.context;
                    _.bind(context._updateViewportTranslation, context)();
                });
            }
        },

        ////////////////
        // Public API //
        ////////////////
        addBarPlotTrackWithArrayData: function(variant_array, track_container_element) {
            var type_field_name = this.config.variant_data_type_field,
                location_field_name = this.config.variant_data_location_field;

            var track_data = DataAdapters.group_by_location(variant_array, type_field_name, location_field_name);
            DataAdapters.apply_statistics(track_data, function() {return 'all';});

            this.bar_plot_track_data.push({
                data_array: variant_array,
                data: track_data,
                element: track_container_element,
                factory: BarPlotTrackFactory
            });
        },

        addSamplePlotTrackWithArrayData: function(variant_array, track_container_element) {
            var type_field_name = this.config.variant_data_type_field,
                location_field_name = this.config.variant_data_location_field;

            var track_data = DataAdapters.group_by_location(variant_array, type_field_name, location_field_name);
            DataAdapters.apply_statistics(track_data, function() {return 'all';});

            this.bar_plot_track_data.push({
                data_array: variant_array,
                data: track_data,
                element: track_container_element,
                factory: SamplePlotTrackFactory
            });
        },

        addRegionScaleTrackToElement: function(track_container_element) {
            this.tracks_array.push({
                type: 'region_scale',
                element: track_container_element
            });
        },

        addTickTrackToElement: function(track_container_element) {
            this.tracks_array.push({
                type: 'tick',
                element: track_container_element
            });
        },

        draw: function() {
            this._initRegionLayout();
            this._initVariantLayout();
            this._initViewport();

            this._initBarPlotTracks();

            this._initScrollHandler();

            this._initBarPlotContexts();

            this._initTrackContexts();

            var initial_viewport = this.bar_plot_SVG_contexts[0].getCurrentViewport();
            this.variant_layout.doLayoutForViewport(initial_viewport.getVisibleCoordinates(), 'coordinate');

            _.each(this.bar_plot_SVG_contexts, function(context) {
                context.draw();
            });

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