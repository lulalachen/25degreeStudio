/**
 * Montessori 2015
 */

var Design = {

	data: {
		editable: false,
		untouched: true,
		mandatory_thumb_save_needed: false,
		variables_loaded: false,
		temp_thumb_json_data: '',
		thumb_json_data: '',

		thumb_position : '',
		dragging: false,
		file_name:	'montessori_data.js',

		thumbs_index_width: 980,
		thumbs_index_height: 980,

		percent_scale: 1,
		inspector_open: false,
		click_event: "click",

		is_paginating: false,

		limit_vert: false,
		limit_horiz: true,
		auto_save: true,
		snap: true,
		stack: true,
		saving_progress: false
	},

	init: function(){

		if ( Cargo.Model.DisplayOptions.get("use_set_links") && Cargo.Model.DisplayOptions.get("projects_in_text_nav") ) {

			Cargo.Collection.Navigation.url = Cargo.API.GetNavigationCargoPath(0, 9999);
			Cargo.Collection.Navigation.fetch({reset: true});

		}

	},

	paginateInPlace: function(){

		// Paginate without scrolling in 500ms increments
		var totalProjects = Cargo.Model.DisplayOptions.GetTotalProjects();

		// paginate again if projects in memory is less than maximum amount of load-able projects
		// and amount of load-able projects  is smaller than the pagination
		if ( Cargo.Helper.GetTotalProjectsInMemory() < totalProjects  && totalProjects > Cargo.Model.DisplayOptions.get("pagination_count")) {

	      setTimeout(function(){

			if (! Design.data.is_paginating ) {
				Design.data.is_paginating = true;
				Cargo.View.Main.NextPage();
			}

			Design.paginateInPlace();

		}, 500);

		// Otherwise, we have finished paginating and the pagination string gets updated from pagination_complete
		}

	},

	floatThumbs:function(){

		// Reset scale for thumbnails back to 100%
		Design.data.percent_scale = 1;

		// thumbnails floated left or right
		var horiz_align = ["left", "right"][Math.floor(Math.random()*2)];
		var thumbnails_num = $('.thumbnail_wrapper').length

		// make sure .container doesn't expand beyond width of the screen
		$('.container').css("float", "none");
		var viewport_width = Math.max(750, $('.container').width() );

		$('.container').attr("style", "");

		if ( Design.data.limit_vert && Design.data.limit_horiz){
			$('#thumbnails').css("width", viewport_width * (thumbnails_num/10) + "px");
		} else if ( Design.data.limit_vert && !Design.data.limit_horiz ){
			$('#thumbnails').css("width", viewport_width * (thumbnails_num/5) + "px");
		} else {
			$('#thumbnails').width(viewport_width);
		}



		setTimeout(function(){

	        $('.thumbnail_wrapper').each(function(){
		        $(this).css({
					"width": $(this).data("width")+"px",
					"height": $(this).data("height")+"px",
			        "top":"0",
			        "left":"0",
			        "position":"relative",
			        "float": horiz_align,
			        "display":"block",
			        "padding": "0 40px 40px 0"
		        });

				$(this).data({
					x: $(this).offset().left,
					y: $(this).offset().top
				});
			});
			$('.thumbnail_wrapper, .thumbnail, #thumbnails').attr("style", "");
			Design.data.untouched = false;
			Design.updateThumbPositionString();
		})
	},

	updatePanel: function(){
		if ( Design.data.auto_save ){
			$('#design_panel #auto_save').removeClass("selected").find("span").text("on");
		} else {
			$('#design_panel #auto_save').addClass("selected").find("span").text("off");
		}

		if (Design.data.stack ){
			$('#design_panel #stack').removeClass("selected").find("span").text("on");
		} else {
			$('#design_panel #stack').addClass("selected").find("span").text("off");
		}

		if (Design.data.snap ){
			$('#design_panel #snap').removeClass("selected").find("span").text("on");
		} else {
			$('#design_panel #snap').addClass("selected").find("span").text("off");
		}

		if (Design.data.limit_vert ){
			$('#design_panel #limit_vert').removeClass("selected").find("span").text("on");
		} else {
			$('#design_panel #limit_vert').addClass("selected").find("span").text("off");
		}

		if (Design.data.limit_horiz ){
			$('#design_panel #limit_horiz').removeClass("selected").find("span").text("on");
		} else {
			$('#design_panel #limit_horiz').addClass("selected").find("span").text("off");
		}

		$('.ui-draggable').each(function(){
			Design.makeDrag( $(this) );
		});

	},

	toggleSaveButton: function(){

		// if we're auto-saving, if the data we have is the same as the newest data,
		// or if we're in a preview frame, hide the save button
		if ( Design.data.auto_save || Design.data.temp_thumb_json_data == Design.data.thumb_json_data || Cargo.API.Config.preview){

			$('a#save_button').hide();
		} else {

			$('a#save_button').show();
		}
	},

	loadThumbVars: function(){



		// check through global vars in js
		if(typeof file_thumb_position === "undefined") {

			Design.data.mandatory_thumb_save_needed = true;
			Design.floatThumbs();
		} else {
			Design.data.thumb_position = file_thumb_position;
		}

		if (typeof file_thumbs_index_width !=="undefined"){

			Design.data.thumbs_index_width = file_thumbs_index_width;

		}


		if (typeof file_thumbs_index_height !=="undefined"){

			Design.data.thumbs_index_height = file_thumbs_index_height;

		}

		Design.formatThumbnails();


		// Get vars from options string
		if ( typeof file_auto_save !=="undefined"){

			Design.data.auto_save = file_auto_save;
			Design.data.stack = file_stack;
			Design.data.snap = file_snap;
			Design.data.limit_horiz = file_limit_horiz;
			Design.data.limit_vert = file_limit_vert;
		}

		Design.updatePanel();
		Design.setViewport();

		Design.data.variables_loaded = true;

	},

	updateThumbPositionString: function(){


		var file_data = { },
			min_z_index = 999999999,
			right_thumb_edge =0,
			left_thumb_edge = -99999,
			top_thumb_edge = -99999,
			bottom_thumb_edge = 0;


		$('.thumbnail_wrapper').each(function(){

			// absolute values
			var floatLeft = $(this).data("x");
			var floatTop = $(this).data("y");

			if ( left_thumb_edge == -99999 ){
				left_thumb_edge = floatLeft;
			}

			if ( top_thumb_edge == -99999 ){
				top_thumb_edge = floatTop;
			}

			left_thumb_edge = Math.min ( left_thumb_edge, floatLeft);
			right_thumb_edge = Math.max( right_thumb_edge, floatLeft + $(this).data("width"));
			top_thumb_edge = Math.min ( top_thumb_edge, floatTop );
			bottom_thumb_edge = Math.max( bottom_thumb_edge, floatTop + $(this).data("height"));

		});


		//		Only set height and width of overall thumbnail if we have all of the projects
		if ( Cargo.Helper.GetTotalProjectsInMemory() >= Cargo.Model.DisplayOptions.GetTotalProjects() || Cargo.Model.DisplayOptions.get("pagination_count") > Cargo.Model.DisplayOptions.GetTotalProjects()) {
			Design.data.thumbs_index_width = right_thumb_edge - left_thumb_edge;
			Design.data.thumbs_index_height = bottom_thumb_edge - top_thumb_edge;

		} else {

		// however we can scale according to the limitations, so that paginating edge doesn't appear overlong
			if ( Design.data.limit_vert && !Design.data.limit_horiz ){

				Design.data.thumbs_index_width = right_thumb_edge - left_thumb_edge;

			} else if ( !Design.data.limit_vert && Design.data.limit_horiz){

				Design.data.thumbs_index_height = bottom_thumb_edge - top_thumb_edge;

			}
		}

		if (Design.data.limit_vert){
			$('body').addClass("vertical_limit");
		} else {
			$('body').removeClass("vertical_limit");
		}

		if (Design.data.limit_horiz){
			$('body').addClass("horizontal_limit");
		} else {
			$('body').removeClass("horizontal_limit");
		}

		$(".thumbnail_wrapper").each(function() {
			var	floatLeft,
				floatTop,
				leftOffset,
				topOffset;

			floatLeft = $(this).data("x");
			floatTop = $(this).data("y");

			leftOffset = floatLeft - left_thumb_edge;
			topOffset = floatTop - top_thumb_edge;

			// setup thumbs for whitespace reflow ,
			$(this).data({
				"x": leftOffset,
				"y": topOffset,
				"z": $(this).css("z-index")
			});

			// But only save dynamic offsets if we are not on a filter or set
			if ( (Cargo.Helper.IsFilter() || Cargo.Helper.IsOnSet()) && Design.data.untouched ){


			} else {

				file_data[$(this).data('id')] = {
					"x": leftOffset,
					"y": topOffset,
					"z": $(this).data("z")
				};


			}

		});


		Design.setViewport();



		Design.data.thumb_position = $.extend({}, Design.data.thumb_position, file_data);

		// If we're on a filter/set and haven't touched anything, just re-use the old variables
		if ( (Cargo.Helper.IsFilter() || Cargo.Helper.IsOnSet() ) &&  Design.data.untouched ){
			Design.data.temp_thumb_json_data = 'var file_thumb_position = ' +JSON.stringify(file_thumb_position) + ";\n"
												+'var file_thumbs_index_width = '+file_thumbs_index_width+';\n'
												+'var file_thumbs_index_height = '+file_thumbs_index_height+';\n';
		// otherwise save new positions
		} else {
			Design.data.temp_thumb_json_data = 'var file_thumb_position = ' +JSON.stringify(Design.data.thumb_position) + ";\n"
												+'var file_thumbs_index_width = '+Design.data.thumbs_index_width+';\n'
												+'var file_thumbs_index_height = '+Design.data.thumbs_index_height+';\n';
		}


		// populate variable if empty
		if ( Design.data.thumb_json_data == "" ){
			Design.data.thumb_json_data	= new String(Design.data.temp_thumb_json_data).valueOf();
		}

		// If we have completed our initial load, then begin the timer
// 		if ( Design.data.variables_loaded){
			Design.setSaveTimer();
// 		}

	},

	setHeaderSpacer: function(){

		var header_height = header_height = $('.site_header').outerHeight(true);
		if ( $('.site_header').css("position") != "relative" ) {
			$('#header_spacer').height(header_height);
		} else {
			$('#header_spacer').height(0);
		}

	},

	setViewport: function(){


		Design.setHeaderSpacer();
		// avoid search views
		if ( $('#thumbnails').length < 1){
			return;
		}

		var thumbs_index_width = Design.data.thumbs_index_width,
			thumbs_index_height = Design.data.thumbs_index_height
			thumb_aspect= thumbs_index_width / thumbs_index_width,
			viewport_width = $('.container').width(),
			viewport_height = window.innerHeight - ( $('#thumbnails').offset().top + $('.site_footer').outerHeight(true)),
			viewport_aspect = viewport_width/viewport_height,
			overflow_y = "auto",
			overflow_x = "auto";

		if ( Design.data.limit_vert || Design.data.limit_horiz ) {

			if ( Design.data.limit_vert && !Design.data.limit_horiz ){

				Design.data.percent_scale = viewport_height / thumbs_index_height;

			} else if ( !Design.data.limit_vert && Design.data.limit_horiz){

				Design.data.percent_scale = viewport_width / thumbs_index_width;

			} else if ( Design.data.limit_vert && Design.data.limit_horiz) {

				if ( viewport_height > thumbs_index_height ){
					Design.data.percent_scale = Math.max(viewport_width / thumbs_index_width, viewport_height / thumbs_index_height)
				} else {
					Design.data.percent_scale = Math.min(viewport_width / thumbs_index_width, viewport_height / thumbs_index_height)
				}

			}

		} else {
			Design.data.percent_scale = 1;
		}
		Design.data.percent_scale = Math.max(Math.min(Design.data.percent_scale, 1), 0.05);

		if ( $('.thumbnail_wrapper').length > 0){
			$('#thumbnails').css({
				"width": Design.data.percent_scale*thumbs_index_width + "px",
				"height": Design.data.percent_scale*thumbs_index_height + "px"
			});
		} else {
			$('#thumbnails').css({
				"width": 100 + "px",
				"height": 100 + "px"
			});
		}



		$('body').attr({
			"data-scroll_x": overflow_x,
			"data-scroll_y": overflow_y
		});


		$('.thumbnail_wrapper').each(function(){

			$(this).css({
				"left": $(this).data("x")* Design.data.percent_scale + "px",
				"top": $(this).data("y")* Design.data.percent_scale + "px",
				"z-index": $(this).data("z"),

				"width": $(this).data("width")* Design.data.percent_scale + "px",
				"height": $(this).data("height")* Design.data.percent_scale + "px"

			})
		})


	},

	setSaveTimer: _.debounce(function() {
		Design.data.saving_progress = true;
	    this.saveFile();
	}, 3000),

	saveFile: function(){

		if ( !Design.data.editable ){
			return
		}

		Design.data.saving_progress = true;
		var options_string,
			file_data;

		// If no data has been loaded, suppress save
		if ( !Design.data.variables_loaded ){
			Design.data.saving_progress = false;
			$('#thumb_position_loader').hide();
			Design.toggleSaveButton();

			return
		}

		// if we are not an editor or if we are in a preview, do not save
		if (!Design.data.editable || Cargo.API.Config.preview){
			Design.data.thumb_json_data	= new String(Design.data.temp_thumb_json_data).valueOf();
			Design.data.saving_progress = false;
			$('#thumb_position_loader').hide();
			Design.toggleSaveButton();

			return
		}

		// if nothing has been interacted (dragged / randomized ) do not save
		// Unless we haven't saved once yet
		if ( Design.data.untouched  && !Design.data.mandatory_thumb_save_needed ){
			Design.data.saving_progress = false;
			$('#thumb_position_loader').hide();

			return
		}

		$('#thumb_position_loader').show();


		// if we're auto-saving, pull in the newest thumbnail position data
		// Or if a project thumbnail has been turned on, we need to save
		if ( Design.data.auto_save || Design.data.mandatory_thumb_save_needed ){
			Design.data.thumb_json_data	= new String(Design.data.temp_thumb_json_data).valueOf();
		}

		// regardless of auto-save thumb positions, we still auto-save design options
		options_string =  "var file_auto_save = " + Design.data.auto_save + ";\n"
		+"var file_snap = " + Design.data.snap + ";\n"
		+"var file_stack = " + Design.data.stack + ";\n"
		+"var file_limit_horiz = " + Design.data.limit_horiz +";\n"
		+"var file_limit_vert = " + Design.data.limit_vert +";\n";

		file_data = Design.data.thumb_json_data + options_string;

		Cargo.API.PutSiteFile(Design.data.file_name, file_data, function(){

				Design.data.saving_progress = false;
				Design.data.mandatory_thumb_save_needed = false;
				$('#thumb_position_loader').hide();
				Design.toggleSaveButton();

		});
	},

	Mobile : {

		data : {

			mobileMargin : 0,
			thumbWidth : 240,
			headerHeight: 0

		},

		init: function(){

			var viewportContents = "";

			if ( $('meta[name="viewport"]').length > 0 ){
				viewportContents = $('meta[name="viewport"]').attr("content");
			}


			if ( Cargo.Helper.isMobile() ) {

				// Give button elements touch active state, allow :active styling
				$('.project_nav a, .header_text a, .navigation_toggle').bind( "touchstart", function(){
					return true;
				});



				// make sure that content has the right size after resize
				$(window).resize(function(){

					setTimeout(function(){

						Cargo.Plugins.elementResizer.refresh();

					}, 250);

				});


			}

			if ( Cargo.Helper.isTablet()){

				$('body').addClass("tablet");

			}

			if ( Cargo.Helper.isPhone() ){

				if ( Cargo.Model.DisplayOptions.get("scale_thumbs_mobile") ){
					if ( !Design.data.limit_vert){
						Design.data.limit_horiz = true;
					}
				}

				$('body').addClass("mobile");

				$('.navigation_toggle').bind("click", function(){

					Design.Mobile.toggleNav();

				});

				$('.navigation').bind( "touchstart", function(e){

					var touchtarget = $(e.target);

					if ( !touchtarget.is('a') ) {

						Design.Mobile.toggleNav();

					}

				});


				Cargo.Event.on("project_load_complete direct_link_loaded", function(pid) {

					Design.Mobile.toggleNav(true);

				});


			}
		},

		toggleNav: function(closeNav){

			if ( $('.navigation_toggle').is(".active") || closeNav ){

				$(".navigation, .navigation_toggle").removeClass("active");

			} else {

				$(".navigation, .navigation_toggle").addClass("active");

			}

		}

	},

	/**
	 * Wrap all contents inside div blocks
	 */
	FormatProjectContent: function() {

		$(".project_content > div", Cargo.View.ProjectDetail.$el).each(function(){

			if (this.attributes.length ===0 ){

			   $(this).addClass('block text');

			}

		});

		// Format the text into blocks
		this.formatText($(".project_content"));

	},


	formatText: function(node, includeWhitespaceNodes) {

		var c = node.contents(),
			validTags = ['img', 'object', 'video', 'audio', 'iframe', 'div'],
			pageCache = [],
			pageCount = 0,
			textPages = {},
			newPageFromCache = true;

		c.each(function(key, val) {

			if ($.inArray(getTag(val), validTags) >= 0) {
				// save cache as new page
				if (pageCache.length > 0) {
					textPages[pageCount] = pageCache;
					pageCache = [];
					pageCount++;
				}
			} else {
				if (isValidText(val.data) && val.nodeType != 8) {
					pageCache.push(val);
				}
			}

		});

		// Still some stuff left in cache
		if (pageCache.length > 0) {
			// Check if it needs a new page
			for (var i = 0; i < pageCache.length; i++) {
				if (pageCache[i].nodeType == 8 || pageCache[i].nodeName == "SCRIPT" || pageCache[i].nodeName == "STYLE") {
					// Contains text, create new page
					newPageFromCache = false;
				}
			}

			if (newPageFromCache) {
				// Create new page
				textPages[pageCount] = pageCache;
				pageCache = [];
				pageCount++;
			} else {
				for (var i = 0; i < pageCache.length; i++) {
					// Dump and hide remaining elements
					$(pageCache[i]).hide().appendTo($('.project_footer'));
				}
			}
		}

		$.each(textPages, function(key, arr) {
			var breaks = 0;

			$.each(arr, function(key, el) {
				if (el.nodeName == "BR") {
					breaks++;
				}
			});

			if (breaks < arr.length) {
				var first = arr[0];
				var parent = $('<div class="text" />');
				$(first).before(parent);

				$.each(arr, function(key, el) {
					$(el).appendTo(parent);
				});
			} else {
				$.each(arr, function(key, el) {
					$(el).remove();
				});
			}
		});

		function isValidText(txt, strict) {
			if (txt !== undefined) {
				txt = txt.replace(/<!--([\s\S]*?)-->/mig, "");
				txt = txt.replace(/(\r\n|\n|\r|\t| )/gm, "");
				txt = txt.replace(/[^A-Za-z0-9\s!?\.,-\/#!$%\^&\*;:{}=\-_`~()[[\]]/g, "");

				if (txt.length > 0) {
					return true;
				}
			} else {
				if (strict) {
					return false;
				} else {
					return true;
				}
			}

			return false;
		}

		function getTag(el) {
			if (typeof el !== "undefined") {
				var tag = el.tagName;
				if (typeof tag === "undefined") {
					tag = 'text';
				}

				return tag.toLowerCase();
			}
		}
	},


	scroll: {

		indexPosition : 0,

		defaultScroll : function() {
			// Configured on setup
		},

		project : function() {

			// Set the data if we were on an index page
			if ( !$('body').is('[data-pagetype]') ) {

				this.indexPosition = $(window).scrollTop();

			}



			if ( Cargo.View.ProjectDetail.$el.css("position") == "fixed" ){
				Cargo.View.ProjectDetail.$el.scrollTop(0);
			} else {
				$(window).scrollTop(0);
			}


		},

		index : function() {

			$(window).scrollTop(this.indexPosition);

		},

		setup : function() {

			var self = this;

			// Set the default scroll event
			this.defaultScroll = Cargo.Helper.ScrollToTop;

			// Reset helper methods
			Cargo.Helper.ScrollToTop = function() {

				// Only scroll if project/page is open
				if ( Cargo.Helper.GetCurrentPageType() ){

					Design.scroll.defaultScroll();

				}

				// Close mobile nav if on Phone
				if( Cargo.Helper.isPhone()){

					Design.Mobile.toggleNav(true);

				}
			};

		}

	},


	keybindings: function() {

		// Remove previous bindings
		Cargo.Core.KeyboardShortcut.Remove("Left");
		Cargo.Core.KeyboardShortcut.Remove("Right");

		Cargo.Core.KeyboardShortcut.Add("Left", 37, function() {
			Action.Project.Prev();
			return false;
		});

		Cargo.Core.KeyboardShortcut.Add("Right", 39, function() {
			Action.Project.Next();
			return false;
		});

		Cargo.Core.KeyboardShortcut.Add("Escape", 27, function() {

			// Don't go to index if lightbox is open
			if ( lightbox.isActive ){

				return

			} else {

				Action.Project.Index();
				return;
			}

		});

	},


	makeDrag: function(obj){
		obj.unbind("mousedown.drag");
		obj.unbind("dragstart");
		obj.unbind("dragstop");
		obj.unbind("mouseup.drag");
		obj.unbind("mousemove.drag");
		obj.unbind("drag");


		var snapString,
			stackString,
			user_drag = Cargo.Model.DisplayOptions.get("allow_user_drag"),
			padLeft,
			padTop,
			padRight,
			padBottom,
			mouseMoving = false,
			outlineTimeout;

		if ( !Design.data.editable && !user_drag){
			return
		}

		if ( Design.data.snap ){
			snapString = '.ui-draggable, #thumbnails';
		} else {
			snapString = false;
		}

		if ( Design.data.stack ) {
			stackString = '.thumbnail_wrapper';
		} else {
			stackString = false;
		}

		// needs to listen  for mousedown before dragstart
		// so that style tag can be measured and built
		obj.bind("mousedown.drag", function(event){

			// build snap style tag
			if ( event.which ==1 && Design.data.snap ){
				var snapStyleString ="";

				// measure by appending elem to body and measuring it
				$('body').append('<div class="snap_to measure" style="position: fixed; top: -9999px; left: -9999px;"></div>');

				padLeft = parseInt($('.snap_to.measure').css("padding-left"))* Design.data.percent_scale;
				padTop = parseInt($('.snap_to.measure').css("padding-top"))* Design.data.percent_scale;
				padRight = parseInt($('.snap_to.measure').css("padding-right"))* Design.data.percent_scale;
				padBottom = parseInt($('.snap_to.measure').css("padding-bottom"))* Design.data.percent_scale;

				snapStyleString = ".ui-draggable.snap_to {\n"
								+"padding-top: "+0+"px!important; \n"
								+"padding-left: "+0+"px!important; \n"
								+"padding-right: "+padRight+"px!important; \n"
								+"padding-bottom: "+padBottom+"px!important; \n"
								+"}\n"
								+".ui-draggable.snap_to .thumb_info {\n"
								+"opacity: 0; \n"
							+"}";

				$('style#snap_to').text(snapStyleString);
				$('.snap_to.measure').remove();

			}

			obj.bind("mousemove.drag", function(event){
				if ( event.which ==1 ){
					// we know we're starting to move, so we add the class and bind our events
					if ( Design.data.snap && Design.data.editable ){
						$('.thumbnail_wrapper').addClass("snap_to");
					}
				}

			});
		});


		obj.bind("dragstart", function(event){

			if ( Design.data.editable ){
				// Add blue outline around thumbs
				clearTimeout(outlineTimeout);
				$('#thumbnails').css({
					"outline": "1px dashed #06f"
				});
			}

			Design.data.dragging = true;
		});

		obj.bind("dragstop", function(event, ui){

			Design.data.untouched = false;

			var leftPos = parseFloat( obj.position().left);
			var topPos = parseFloat( obj.position().top);

			setTimeout(function(){
				Design.data.dragging = false;
			}, 40);

			/* we scale up data according to active percentage scale, while keeping the active position where it is*/
			obj.data({
				"x": leftPos * (1/Design.data.percent_scale),
				"y" : topPos * (1/Design.data.percent_scale)
			});


			if ( Design.data.snap && Design.data.editable ){
				$('.ui-draggable').removeClass("snap_to");
				$('style#snap_to').text("");
			}

			// If an editor, then we update the positions for the file
			if (Design.data.editable ){
				Design.updateThumbPositionString();
				outlineTimeout = setTimeout(function(){
					$('#thumbnails').css({
						"outline": "0px solid #06f"
					});
				}, 500)

			}

			// Otherwise, the viewport stays the same but the thumbs get re-stacked
			if ( !Design.data.editable && user_drag ){

				setTimeout(function(){

					$('.thumbnail_wrapper').each(function(){

						$(this).data({
							"z": parseInt($(this).css("z-index"))
						});

					});

					Design.setViewport();

				});

			}

		});

		obj.bind("mouseup.drag", function(event){
			obj.unbind("mousemove.drag");

			if ( Design.data.snap && Design.data.editable ){
				$('.ui-draggable').removeClass("snap_to");
				$('style#snap_to').text("");
			}

		});

		if ( Design.data.editable ) {

			obj.draggable({
				snap: snapString,
				delay: 100,
				snapMode: 'both',
				snapTolerance: 10,
				stack: stackString,
			    scrollSensitivity: 120

			});

		} else {

			obj.draggable({
				snap: false,
				stack: '.ui-draggable',
			    scrollSensitivity: 120
			});

		}

	},


	formatThumbnails: function() {

		if ( typeof Design.data.thumb_position !== "object"){
			return;
		}

		$(".thumbnail_wrapper[data-formatted!='true']").each(function(i) {

			var thumb_id = $(this).data("id");

			var keys = _.keys(Design.data.thumb_position);
			var thumb_data;

			// if we have data for that thumb, assign it to the thumb
			if (typeof Design.data.thumb_position[thumb_id] !== "undefined"){
				thumb_data = Design.data.thumb_position[thumb_id];

				$(this).data({
					"x": thumb_data.x,
					"y": thumb_data.y,
					"z": thumb_data.z
				});

			} else {

				// Set default data for
				$(this).data({
					"x": i * 40,
					"y": i * 40,
					"z": 999 + 10 * i
				});

			}

			if ($(this).find(".thumb_image img").attr("src") == "/_gfx/thumb_custom.gif") {
				$(this).find('.thumbnail').addClass("default_thumb");

				$(this).data({
					"width": 320,
					"height": 200
				});
			}

			if ( Design.data.editable || Cargo.Model.DisplayOptions.get("allow_user_drag") ){

				Design.makeDrag($(this));

			}


			$('.thumb_info', this).bind("click.thumb_info dblclick.thumb_info", function(e){

				if ( !$(e.target).is('a') && !Design.data.dragging && e.type == Design.data.click_event ){

				    Cargo.Event.trigger("add_history", $(this).closest('.thumbnail_wrapper').find('a[rel="history"]').attr("href"));

				}

			});

			$(this).attr("data-formatted", "true");

		});

	},

	formatNavigation: function() {

		if ( Cargo.Model.DisplayOptions.get("use_set_links") ) {

			if ( Cargo.Model.DisplayOptions.get("projects_in_text_nav") === false ) {
				$('.set_link').addClass('no_projects');
			}


			$(".set_link").each(function(i){

				if ( $(this).prev().not(".set_wrapper, .set_link.no_projects").length > 0 ) {
					$(this).addClass("first")
				}

				if ( $(this).next().not(".set_link").length > 0 ) {
					$(this).addClass("last")
				}

			})

		}

	}

};

/**
 * Events
 */

$(function() {
	$('body').css('visibility', 'hidden');

	if ( Cargo.View.ProjectDetail !== undefined ) {

		Design.data.editable = Cargo.Helper.GetIsEditor()

		Design.loadThumbVars();

		Design.init();
		Design.Mobile.init();
		Design.updateThumbPositionString();
		Design.paginateInPlace();


		$('body').css('visibility', 'visible');
		Design.scroll.setup();
		Design.keybindings();

		if ( !Cargo.Helper.IsSearch() ) {

			Design.formatThumbnails();

		}

		Design.formatNavigation();

	} else {
		Design.Mobile.init();
		Design.formatNavigation();

		$('body').css('visibility', 'visible');
	}


	if ( !Cargo.Helper.IsAdminEditProject() ){
		$('#project').bind("click.to_index dblclick.to_index", function(e){
			if ( $(e.target).is('#project') && e.type == Design.data.click_event ){

				// if we're in inspector and not in project list/editor, go with click
				Action.Project.Index();

			}
		});
	} else {
		$('#project').css("cursor", "auto")
	}

	if ( Design.data.editable ){
		$('#help_content').html($('#help_content').attr('data-content'))
		$('a#design_symbol').click(function(e){
		   e.preventDefault();
		   e.stopPropagation();
		   $(this).hide();
		   $('#design_panel #design_options').show();

		   $(document).bind("mousedown.closemenu", function(e){
		        if ( !$(e.target).is("#design_panel, #design_panel *") ){
					e.preventDefault();
					e.stopPropagation();
		            $('a#design_symbol').show();
		            $('#design_panel #design_options').hide();
		            $('#design_panel #help_content').hide();

		            $(document).unbind("mousedown.closemenu");
		        }
		    });
		});

		$('#design_panel #help').bind("click", function(e){
			e.preventDefault();
			if ( $('#design_panel #help_content').is(":visible") ){
				$('#design_panel #help_content').hide();
			} else {
				$('#design_panel #help_content').show();
			}
		});

		$('#design_panel #help_content').bind("click", function(e){
			e.preventDefault();
			$('#design_panel #help_content').hide();
		});

		$('#design_panel a#stack, #design_panel a#snap, #design_panel a#auto_save, a#limit_horiz, a#limit_vert').bind("click", function(e){
			var optionType = $(this).attr("id");
			e.preventDefault();
			Design.data.untouched = false;

			if ( Design.data[optionType] ){
				Design.data[optionType] = false;
			} else {
				Design.data[optionType] = true;

				if ( optionType == "auto_save" ){
					Design.updateThumbPositionString();
				}

			}

			Design.updatePanel();

			if (optionType == "limit_vert" || optionType == "limit_horiz"){
				Design.updateThumbPositionString();
			}


			Design.setSaveTimer();

		});

		$('#design_panel a#randomize').bind("click", function(e){
			e.preventDefault();

			// Randomize order of thumbnails before floating them
			$('.thumbnail_wrapper').each(function(){
				var randomNum = Math.random();
				if (randomNum > .3){
					$(this).appendTo($('#thumbnails'));
				} else if ( randomNum < .8){
					$(this).prependTo($('#thumbnails'));
				}
			});

			Design.data.untouched = false;
			Design.floatThumbs();
			Design.setSaveTimer();

		})

		$('a#save_button').click(function(e){

			// Save button clicks  copy over json data string
			Design.data.thumb_json_data	= new String(Design.data.temp_thumb_json_data).valueOf();

			e.preventDefault();
			$(this).hide();


			Design.saveFile();

		})

	} else {
		$('a#save_button').remove();
		$('#design_panel').remove();
	}



	Cargo.Event.on("show_index_complete", function(pid) {

		Design.scroll.index();
		Design.setViewport();

	});



});

var timeoutID;
$(window).resize(function(){
	clearTimeout(timeoutID);

	// debounce resizing methods to avoid scrollbar thrashing
	timeoutID = setTimeout(function(){
		Design.setViewport();
	}, 60)


});


Cargo.Event.on("slideshow_on", function(el, obj) {

	$('.slideshow .video_component').each(function(){

		$(this).css({

			width: $('object', this).attr("width") + "px",
			height: $('object', this).attr("height") + "px",
			"data-elementresizer-child": "data-elementresizer-child",
		});


	});


	Cargo.Plugins.elementResizer.refresh();

	// Add classes for slideshow if nav is active
	if ( Cargo.Model.DisplayOptions.get("slide_text_nav").enabled ) {

		if ( Cargo.Model.DisplayOptions.get("slide_nav_position") == "top" ){

			el.addClass("slideshow_navigation_on_top");

		} else {

			el.addClass("slideshow_navigation_on_bottom");

		}

	}

});

Cargo.Event.on("fullscreen_destroy_hotkeys", function() {

	Design.keybindings();

});

Cargo.Event.on("reseed_project_complete", function(){
	Design.paginateInPlace();

	// If a project is turned on and off, we need to save if we're ready to save
	if ( Cargo.Helper.IsAdminEdit() ){
		Design.data.untouched = false;
		Design.data.mandatory_thumb_save_needed = true;
	}

	Design.formatThumbnails();
	Design.updateThumbPositionString();
});


Cargo.Event.on("project_collection_reset", function() {
	Design.formatThumbnails();
	Design.updateThumbPositionString();

});

Cargo.Event.on("direct_link_loaded", function(){
	Design.setHeaderSpacer();
	Design.init();
	Cargo.Plugins.elementResizer.refresh();

});

Cargo.Event.on("project_load_start", function(pid) {


	Design.scroll.project();

});
Cargo.Event.on("element_resizer_init", function(plugin) {
	plugin.setOptions({
	    minimumHeight: 0,
		adjustElementsToWindowHeight: false
	});
});



Cargo.Event.on("project_load_complete", function(pid) {
	Design.setHeaderSpacer();


	if ( Cargo.View.ProjectDetail !== undefined ) {


		var imgs,
			randomImgIndex,
			bgColorString;

	    if ( $('#site_bg_color', Cargo.View.ProjectDetail.$el).length > 0 ){
		    bgColorString = ".entry { background-color: " + Cargo.Model.Project.GetBgColor() + "}";
			$('#site_bg_color', Cargo.View.ProjectDetail.$el).text(bgColorString);
	    }

		//set splash page
		if ( $('.splash', Cargo.View.ProjectDetail.$el).length > 0){


			$('#thumbnails').hide();

			// select random image in the splash
			$('.splash', Cargo.View.ProjectDetail.$el).each(function(){

				imgs = $('img', this);
				randomImgIndex = Math.floor( Math.random() * imgs.length );

				$('#project').css("background-image", "url(" + imgs.eq( randomImgIndex ).attr("src_o") + ")").addClass("splash");

			});

			$('.entry').hide();

		}

		// Remove active state on Set link if thumbnails are hidden
		if ( (Cargo.Helper.GetCurrentPageType() =="page" && !Cargo.Model.DisplayOptions.get("thumbs_below_pages") && Cargo.Helper.IsOnSet()) ||	$('.splash', Cargo.View.ProjectDetail.$el).length > 0) {

			$('.set_link.active').removeClass("active");

		}

		Design.FormatProjectContent();
	}


});


Cargo.Event.on("pagination_complete", function() {

	Design.data.is_paginating = false;
	Design.updateThumbPositionString();

});

Cargo.Event.on("navigation_reset", function() {
    Design.formatNavigation();
});

// Re-trigger start page active state after nav is reloaded
Cargo.Event.on("navigation_reset project_load_complete", function(){
    if ( $('body').is('.start_project') || Cargo.Helper.IsOnStartProject() ) {
        $('#menu_' + Cargo.Helper.GetStartProjectId() ).addClass("active");
    }
});


Cargo.Event.on("inspector_open", function() {
	Design.data.inspector_open = true;
	Design.data.click_event = "dblclick";

	setInterval(function(){
		Design.setHeaderSpacer();
	}, 1000);
});


window.addEventListener("beforeunload", function (e) {

	if ( !Design.data.editable){
		return
	}

	// if json file hasn't been written yet, suppress warning
	if ( typeof file_thumb_position === "undefined" ){
		return;
	}

    var thumb_saving = 'Thumbnail positions or Design options\n'
						    +'are currently being saved.\n'
                            + 'If you leave now, your changes will be lost.';

	var thumb_unsaved = "You have not saved the positions of your thumbnails.\n"
                            + 'If you leave before saving, your changes will be lost.';


	if ( Design.data.saving_progress  && !Cargo.API.Config.preview ){
	    (e || window.event).returnValue = thumb_saving; //Gecko + IE
	    return thumb_saving; //Gecko + Webkit, Safari, Chrome etc.
	}


	if (Design.data.thumb_json_data !== Design.data.temp_thumb_json_data && !Cargo.API.Config.preview ){
	    (e || window.event).returnValue = thumb_unsaved; //Gecko + IE
	    return thumb_unsaved; //Gecko + Webkit, Safari, Chrome etc.
	}

});
