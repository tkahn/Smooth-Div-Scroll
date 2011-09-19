/*
 * jQuery SmoothDivScroll 1.1
 *
 * Copyright (c) 2010 Thomas Kahn
 * Licensed under the GPL license.
 *
 * http://www.maaki.com/thomas/SmoothDivScroll/
 *
 * Depends:
 * jquery.ui.widget.js
 *
 */
(function($) {

	$.widget("thomaskahn.smoothDivScroll", {
		// Default options
		options: {
			scrollingHotSpotLeft: "div.scrollingHotSpotLeft",
			scrollingHotSpotRight: "div.scrollingHotSpotRight",
			scrollableArea: "div.scrollableArea",
			scrollWrapper: "div.scrollWrapper",
			hiddenOnStart: false,
			ajaxContentURL: "",
			countOnlyClass: "",
			scrollStep: 15,
			scrollInterval: 10,
			mouseDownSpeedBooster: 3,
			autoScroll: "",
			autoScrollDirection: "right",
			autoScrollingStep: 5,
			autoScrollInterval: 10,
			visibleHotSpots: "",
			hotSpotsVisibleTime: 5,
			startAtElementId: ""
		},
		_create: function() {

			// Set variables
			var self = this, o = this.options, el = this.element;

			el.data("scrollWrapper", el.find(o.scrollWrapper));
			el.data("scrollingHotSpotRight", el.find(o.scrollingHotSpotRight));
			el.data("scrollingHotSpotLeft", el.find(o.scrollingHotSpotLeft));
			el.data("scrollableArea", el.find(o.scrollableArea));
			el.data("speedBooster", 1);
			el.data("motherElementOffset", el.offset().left);
			el.data("scrollXPos", 0);
			el.data("hotSpotWidth", el.find(o.scrollingHotSpotLeft).width());
			el.data("scrollableAreaWidth", 0);
			el.data("startingPosition", 0);
			el.data("rightScrollInterval", null);
			el.data("leftScrollInterval", null);
			el.data("autoScrollInterval", null);
			el.data("hideHotSpotBackgroundsInterval", null);
			el.data("previousScrollLeft", 0);
			el.data("pingPongDirection", "right");
			el.data("getNextElementWidth", true);
			el.data("swapAt", null);
			el.data("startAtElementHasNotPassed", true);
			el.data("swappedElement", null);
			el.data("originalElements", el.data("scrollableArea").children(o.countOnlyClass));
			el.data("visible", true);
			el.data("initialAjaxContentLoaded", false);
			el.data("enabled", true);

			// If the user wants to have visible hotspots, here is where it's taken care of
			if (o.autoScroll !== "always") {
				switch (o.visibleHotSpots) {
					case "always":
						self.showHotSpotBackgrounds();
						break;
					case "onstart":
						self.showHotSpotBackgrounds();
						el.data("hideHotSpotBackgroundsInterval", setTimeout(function() {
							self.hideHotSpotBackgrounds("slow");
						}, (o.hotSpotsVisibleTime * 1000)));
						break;
					default:
						break;
				}
			}
			/*****************************************
			SET UP EVENTS FOR SCROLLING RIGHT
			*****************************************/
			// Check the mouse X position and calculate the relative X position inside the right hotspot
			el.data("scrollingHotSpotRight").bind("mousemove", function(e) {
				var x = e.pageX - (this.offsetLeft + el.data("motherElementOffset"));
				el.data("scrollXPos", Math.round((x / el.data("hotSpotWidth")) * o.scrollStep));
				if (el.data("scrollXPos") === Infinity) {
					el.data("scrollXPos", 0);
				}
			});

			// mouseover right hotspot - scrolling
			el.data("scrollingHotSpotRight").bind("mouseover", function() {

				// Clear autoscrolling, if it should only run on start
				if ((o.autoScroll === "onstart" && el.data("autoScrollInterval") !== null)) {
					clearInterval(el.data("autoScrollInterval"));
					el.data("autoScrollInterval", null);
					self._trigger("autoScrollIntervalStopped");
				}

				// Start the scrolling interval
				el.data("rightScrollInterval", setInterval(function() {

					if (el.data("scrollXPos") > 0 && el.data("enabled")) {
						el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + (el.data("scrollXPos") * el.data("speedBooster")));

						self._showHideHotSpots();
					}

				}, o.scrollInterval));

				// Callback
				self._trigger("mouseOverRightHotSpot");

			});

			// mouseout right hotspot
			el.data("scrollingHotSpotRight").bind("mouseout", function() {
				clearInterval(el.data("rightScrollInterval"));
				el.data("scrollXPos", 0);
			});

			// mousedown right hotspot (add scrolling speed booster)
			el.data("scrollingHotSpotRight").bind("mousedown", function() {
				el.data("speedBooster", o.mouseDownSpeedBooster);
			});

			// mouseup anywhere (stop boosting the scrolling speed)
			$("body").bind("mouseup", function() {
				el.data("speedBooster", 1);
			});

			/*****************************************
			SET UP EVENTS FOR SCROLLING LEFT
			*****************************************/
			// Check the mouse X position and calculate the relative X position inside the left hotspot
			el.data("scrollingHotSpotLeft").bind("mousemove", function(e) {
				var x = el.data("scrollingHotSpotLeft").innerWidth() - (e.pageX - el.data("motherElementOffset"));
				el.data("scrollXPos", Math.round((x / el.data("hotSpotWidth")) * o.scrollStep));
				if (el.data("scrollXPos") === Infinity) {
					el.data("scrollXPos", 0);
				}

			});

			// mouseover left hotspot
			el.data("scrollingHotSpotLeft").bind("mouseover", function() {

				// Clear autoscrolling, if it should only run on start

				if ((o.autoScroll === "onstart" && el.data("autoScrollInterval") !== null)) {
					clearInterval(el.data("autoScrollInterval"));
					el.data("autoScrollInterval", null);
					self._trigger("autoScrollIntervalStopped");
				}

				el.data("leftScrollInterval", setInterval(function() {
					if (el.data("scrollXPos") > 0 && el.data("enabled")) {
						el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - (el.data("scrollXPos") * el.data("speedBooster")));

						self._showHideHotSpots();
					}

				}, o.scrollInterval));

				// Callback
				self._trigger("mouseOverLeftHotSpot");
			});

			// mouseout left hotspot
			el.data("scrollingHotSpotLeft").bind("mouseout", function() {
				clearInterval(el.data("leftScrollInterval"));
				el.data("scrollXPos", 0);
			});

			// mousedown left hotspot (add scrolling speed booster)
			el.data("scrollingHotSpotLeft").bind("mousedown", function() {
				el.data("speedBooster", o.mouseDownSpeedBooster);
			});

			/*****************************************
			SET UP EVENT FOR RESIZING THE BROWSER WINDOW
			*****************************************/
			$(window).bind("resize", function() {
				self._showHideHotSpots();
				self._trigger("windowResized");
			});

			/*****************************************
			FETCHING AJAX CONTENT ON INITIALIZATION
			*****************************************/
			// If there's an ajaxContentURL in the options, 
			// fetch the content
			if (o.ajaxContentURL.length > 0) {
				self.replaceContent(o.ajaxContentURL);
			}
			else {
				self.recalculateScrollableArea();
			}

			// Should it be hidden on start?
			if (o.hiddenOnStart) {
				self.hide();
			}

			/*****************************************
			AUTOSCROLLING
			*****************************************/
			// If the user has set the option autoScroll, the scollable area will
			// start scrolling automatically. If the content is fetched using AJAX
			// the autoscroll is not started here but in recalculateScrollableArea.
			// Otherwise recalculateScrollableArea won't have the time to calculate
			// the width of the scrollable area before the autoscrolling starts.
			if ((o.autoScroll.length > 0) && !(o.hiddenOnStart) && (o.ajaxContentURL.length <= 0)) {
				self.startAutoScroll();
			}

		},
		/**********************************************************
		Hotspot functions
		**********************************************************/
		showHotSpotBackgrounds: function(fadeSpeed) {
			// Alter the CSS (SmoothDivScroll.css) if you want to customize
			// the look'n'feel of the visible hotspots
			var self = this, el = this.element;

			// Fade in the hotspot backgrounds
			if (fadeSpeed !== undefined) {
				// Before the fade-in starts, we need to make sure the opacity
				// is zero
				el.data("scrollingHotSpotLeft").css("opacity", "0.0");
				el.data("scrollingHotSpotRight").css("opacity", "0.0");

				el.data("scrollingHotSpotLeft").addClass("scrollingHotSpotLeftVisible");
				el.data("scrollingHotSpotRight").addClass("scrollingHotSpotRightVisible");

				// Fade in the left hotspot
				el.data("scrollingHotSpotLeft").fadeTo(fadeSpeed, 0.35);

				// Fade in the right hotspot
				el.data("scrollingHotSpotRight").fadeTo(fadeSpeed, 0.35);
			}
			// Don't fade, just show them
			else {
				// The left hotspot
				el.data("scrollingHotSpotLeft").addClass("scrollingHotSpotLeftVisible");
				el.data("scrollingHotSpotLeft").removeAttr("style");

				// The right hotspot
				el.data("scrollingHotSpotRight").addClass("scrollingHotSpotRightVisible");
				el.data("scrollingHotSpotRight").removeAttr("style");
			}
			self._showHideHotSpots();
		},
		hideHotSpotBackgrounds: function(fadeSpeed) {
			var el = this.element;

			// Fade out the hotspot backgrounds
			if (fadeSpeed !== undefined) {
				// Fade out the left hotspot
				el.data("scrollingHotSpotLeft").fadeTo(fadeSpeed, 0.0, function() {
					el.data("scrollingHotSpotLeft").removeClass("scrollingHotSpotLeftVisible");
				});

				// Fade out the right hotspot
				el.data("scrollingHotSpotRight").fadeTo(fadeSpeed, 0.0, function() {
					el.data("scrollingHotSpotRight").removeClass("scrollingHotSpotRightVisible");
				});
			}
			// Don't fade, just hide them
			else {
				el.data("scrollingHotSpotLeft").removeClass("scrollingHotSpotLeftVisible");
				el.data("scrollingHotSpotLeft").removeAttr("style");

				el.data("scrollingHotSpotRight").removeClass("scrollingHotSpotRightVisible");
				el.data("scrollingHotSpotRight").removeAttr("style");
			}

		},
		// Function for showing and hiding hotspots depending on the
		// offset of the scrolling
		_showHideHotSpots: function() {
			var self = this, el = this.element, o = this.options;

			// If autoscrolling is set to always, there should be no hotspots
			if (o.autoScroll !== "always") {
				// If the scrollable area is shorter than the scroll wrapper, both hotspots
				// should be hidden
				if (el.data("scrollableAreaWidth") <= (el.data("scrollWrapper").innerWidth())) {
					el.data("scrollingHotSpotLeft").hide();
					el.data("scrollingHotSpotRight").hide();
				}
				// When you can't scroll further left the left scroll hotspot should be hidden
				// and the right hotspot visible.
				else if (el.data("scrollWrapper").scrollLeft() === 0) {
					el.data("scrollingHotSpotLeft").hide();
					el.data("scrollingHotSpotRight").show();
					// Callback
					self._trigger("scrollLeftLimitReached");
					// Clear interval
					clearInterval(el.data("leftScrollInterval"));
					el.data("leftScrollInterval", null);
				}
				// When you can't scroll further right
				// the right scroll hotspot should be hidden
				// and the left hotspot visible
				else if (el.data("scrollableAreaWidth") <= (el.data("scrollWrapper").innerWidth() + el.data("scrollWrapper").scrollLeft())) {
					el.data("scrollingHotSpotLeft").show();
					el.data("scrollingHotSpotRight").hide();
					// Callback
					self._trigger("scrollRightLimitReached");
					// Clear interval
					clearInterval(el.data("rightScrollInterval"));
					el.data("rightScrollInterval", null);
				}
				// If you are somewhere in the middle of your
				// scrolling, both hotspots should be visible
				else {
					el.data("scrollingHotSpotLeft").show();
					el.data("scrollingHotSpotRight").show();
				}
			}
			else {
				el.data("scrollingHotSpotLeft").hide();
				el.data("scrollingHotSpotRight").hide();
			}
		},
		/**********************************************************
		Moving to a certain element
		**********************************************************/
		moveToElement: function(moveTo, elementNumber) {
			var self = this, el = this.element, o = this.options, tempScrollableAreaWidth = 0, foundStartAtElement = false;

			switch (moveTo) {
				case "first":
					el.data("scrollXPos", 0);
					self._trigger("movedToFirstElement");
					break;
				case "start":
					// Check to see where the start-at element is at the moment.
					// This can vary if endlessloop is used for autoscroll since it
					// swaps elements around.

					el.data("scrollableArea").children(o.countOnlyClass).each(function() {

						if ((o.startAtElementId.length > 0) && (($(this).attr("id")) === o.startAtElementId)) {
							el.data("startingPosition", tempScrollableAreaWidth);
							foundStartAtElement = true;
						}
						tempScrollableAreaWidth = tempScrollableAreaWidth + $(this).outerWidth(true);
					});

					el.data("scrollXPos", el.data("startingPosition"));
					self._trigger("movedToStartElement");
					break;
				case "last":
					el.data("scrollXPos", el.data("scrollableAreaWidth"));
					self._trigger("movedToLastElement");
					break;
				case "number":
					if (!(isNaN(elementNumber))) {
						// Get the total width of all preceding elements					
						el.data("scrollableArea").children(o.countOnlyClass).each(function(index) {
							if (index === (elementNumber - 1)) {
								el.data("scrollXPos", tempScrollableAreaWidth);
							}
							tempScrollableAreaWidth = tempScrollableAreaWidth + $(this).outerWidth(true);
						});
					}
					self._trigger("movedToElementNumber", null, { "elementNumber": elementNumber });
					break;
				default:
					break;
			}

			el.data("scrollWrapper").scrollLeft(el.data("scrollXPos"));
			self._showHideHotSpots();
		},
		/**********************************************************
		Adding or replacing content
		**********************************************************/
		addContent: function(ajaxContentURL, addWhere) {
			var self = this, el = this.element;

			$.get(ajaxContentURL, function(data) {
				// Add the loaded content first or last in the scrollable area
				if (addWhere === "first") {
					el.data("scrollableArea").children(":first").before(data);
				}
				else {
					el.data("scrollableArea").children(":last").after(data);
				}

				// Recalculate the total width of the elements inside the scrollable area
				self.recalculateScrollableArea();

				// Determine which hotspots to show
				self._showHideHotSpots();
			});
		},
		replaceContent: function(ajaxContentURL) {
			var self = this, el = this.element;

			el.data("scrollableArea").load(ajaxContentURL, function() {
				// Recalculate the total width of the elements inside the scrollable area
				self.recalculateScrollableArea();
				self.moveToElement("first");
				self._showHideHotSpots();
				el.data("startingPosition", 0);
			});
		},
		/**********************************************************
		Recalculate the scrollable area
		**********************************************************/
		recalculateScrollableArea: function() {

			var tempScrollableAreaWidth = 0, foundStartAtElement = false, o = this.options, el = this.element, self = this;

			// Add up the total width of all the items inside the scrollable area
			// and check to see if there's a specific element to start at
			el.data("scrollableArea").children(o.countOnlyClass).each(function() {
				// Check to see if the current element in the loop is the one where the scrolling should start
				if ((o.startAtElementId.length > 0) && (($(this).attr("id")) === o.startAtElementId)) {
					el.data("startingPosition", tempScrollableAreaWidth);
					foundStartAtElement = true;
				}
				tempScrollableAreaWidth = tempScrollableAreaWidth + $(this).outerWidth(true);
			});
		
			
			// If the element with the ID specified by startAtElementId
			// is not found, reset it
			if (!(foundStartAtElement)) {
				el.data("startAtElementId", "");
			}

			// Set the width of the scrollable area
			el.data("scrollableAreaWidth", tempScrollableAreaWidth);
			el.data("scrollableArea").width(el.data("scrollableAreaWidth"));

			// Move to the starting position
			el.data("scrollWrapper").scrollLeft(el.data("startingPosition"));
			el.data("scrollXPos", el.data("startingPosition"));

			// If the content of the scrollable area is fetched using AJAX
			// during initialization, it needs to be done here. After it has
			// been loaded a flag variable is set to indicate that the content
			// has been loaded already and shouldn
			if (!(el.data("initialAjaxContentLoaded"))) {
				if ((o.autoScroll.length > 0) && !(o.hiddenOnStart) && (o.ajaxContentURL.length > 0)) {
					self.startAutoScroll();
					el.data("initialAjaxContentLoaded", true);
				}
			}

		},
		/**********************************************************
		Stopping, starting and doing the autoscrolling
		**********************************************************/
		stopAutoScroll: function() {
			var self = this, el = this.element;

			clearInterval(el.data("autoScrollInterval"));
			el.data("autoScrollInterval", null);

			// Check to see which hotspots should be active
			// in the position where the scroller has stopped
			self._showHideHotSpots();

			self._trigger("autoScrollStopped");

		},
		startAutoScroll: function() {
			var self = this, el = this.element, o = this.options;

			self._showHideHotSpots();

			// Stop any running interval
			clearInterval(el.data("autoScrollInterval"));
			el.data("autoScrollInterval", null);

			// Callback
			self._trigger("autoScrollStarted");

			// Start interval
			el.data("autoScrollInterval", setInterval(function() {

				// If the scroller is not visible or
				// if the scrollable area is shorter than the scroll wrapper
				// any running autoscroll interval should stop.
				if (!(el.data("visible")) || (el.data("scrollableAreaWidth") <= (el.data("scrollWrapper").innerWidth()))) {
					// Stop any running interval
					clearInterval(el.data("autoScrollInterval"));
					el.data("autoScrollInterval", null);
				}
				else {
					// Store the old scrollLeft value to see if the scrolling has reached the end
					el.data("previousScrollLeft", el.data("scrollWrapper").scrollLeft());


					switch (o.autoScrollDirection) {
						case "right":
							el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + o.autoScrollStep);
							if (el.data("previousScrollLeft") === el.data("scrollWrapper").scrollLeft()) {
								self._trigger("autoScrollRightLimitReached");
								clearInterval(el.data("autoScrollInterval"));
								el.data("autoScrollInterval", null);
								self._trigger("autoScrollIntervalStopped");
							}
							break;

						case "left":
							el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - o.autoScrollStep);
							if (el.data("previousScrollLeft") === el.data("scrollWrapper").scrollLeft()) {
								self._trigger("autoScrollLeftLimitReached");
								clearInterval(el.data("autoScrollInterval"));
								el.data("autoScrollInterval", null);
								self._trigger("autoScrollIntervalStopped");
							}
							break;

						case "backandforth":
							if (el.data("pingPongDirection") === "right") {
								el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + (o.autoScrollStep));
							}
							else {
								el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - (o.autoScrollStep));
							}

							// If the scrollLeft hasnt't changed it means that the scrolling has reached
							// the end and the direction should be switched
							if (el.data("previousScrollLeft") === el.data("scrollWrapper").scrollLeft()) {
								if (el.data("pingPongDirection") === "right") {
									el.data("pingPongDirection", "left");
									self._trigger("autoScrollRightLimitReached");
								}
								else {
									el.data("pingPongDirection", "right");
									self._trigger("autoScrollLeftLimitReached");
								}
							}
							break;

						case "endlessloopright":
							// Get the width of the first element. When it has scrolled out of view,
							// the element swapping should be executed. A true/false variable is used
							// as a flag variable so the swapAt value doesn't have to be recalculated
							// in each loop.

							if (el.data("getNextElementWidth")) {
								if ((o.startAtElementId.length > 0) && (el.data("startAtElementHasNotPassed"))) {
									el.data("swapAt", $("#" + o.startAtElementId).outerWidth(true));
									el.data("startAtElementHasNotPassed", false);
								}
								else {
									el.data("swapAt", el.data("scrollableArea").children(":first").outerWidth(true));
								}

								el.data("getNextElementWidth", false);
							}

							// Do the autoscrolling
							el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + o.autoScrollingStep);

							// Check to see if the swap should be done
							if (el.data("swapAt") <= el.data("scrollWrapper").scrollLeft()) {
								el.data("swappedElement", el.data("scrollableArea").children(":first").detach());
								el.data("scrollableArea").append(el.data("swappedElement"));
								el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - el.data("swappedElement").outerWidth(true));
								el.data("getNextElementWidth", true);
							}
							break;
						case "endlessloopleft":
							// Get the width of the first element. When it has scrolled out of view,
							// the element swapping should be executed. A true/false variable is used
							// as a flag variable so the swapAt value doesn't have to be recalculated
							// in each loop.

							if (el.data("getNextElementWidth")) {
								if ((o.startAtElementId.length > 0) && (el.data("startAtElementHasNotPassed"))) {
									el.data("swapAt", $("#" + o.startAtElementId).outerWidth(true));
									el.data("startAtElementHasNotPassed", false);
								}
								else {
									el.data("swapAt", el.data("scrollableArea").children(":first").outerWidth(true));
								}

								el.data("getNextElementWidth", false);
							}

							// Do the autoscrolling
							el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - o.autoScrollingStep);

							// Check to see if the swap should be done
							if (el.data("scrollWrapper").scrollLeft() === 0) {
								el.data("swappedElement", el.data("scrollableArea").children(":last").detach());
								el.data("scrollableArea").prepend(el.data("swappedElement"));
								el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + el.data("swappedElement").outerWidth(true));
								el.data("getNextElementWidth", true);
							}
							break;
						default:
							break;

					}
				}
			}, o.autoScrollInterval));

		},
		restoreOriginalElements: function() {
			var self = this, el = this.element;

			// Restore the original content of the scrollable area
			el.data("scrollableArea").html(el.data("originalElements"));
			self.recalculateScrollableArea();
			self.moveToElement("first");
		},
		show: function() {
			var el = this.element;
			el.data("visible", true);
			el.show();
		},
		hide: function() {
			var el = this.element;
			el.data("visible", false);
			el.hide();
		},
		enable: function() {
			var el = this.element;

			// Set enabled to true
			el.data("enabled", true);
		},
		disable: function() {
			var el = this.element;

			// Clear all running intervals
			clearInterval(el.data("autoScrollInterval"));
			clearInterval(el.data("rightScrollInterval"));
			clearInterval(el.data("leftScrollInterval"));
			clearInterval(el.data("hideHotSpotBackgroundsInterval"));

			// Set enabled to false
			el.data("enabled", false);
		},
		destroy: function() {
			var el = this.element;

			// Clear all running intervals
			clearInterval(el.data("autoScrollInterval"));
			clearInterval(el.data("rightScrollInterval"));
			clearInterval(el.data("leftScrollInterval"));
			clearInterval(el.data("hideHotSpotBackgroundsInterval"));

			// Remove all element specific events
			el.data("scrollingHotSpotRight").unbind("mouseover");
			el.data("scrollingHotSpotRight").unbind("mouseout");
			el.data("scrollingHotSpotRight").unbind("mousedown");

			el.data("scrollingHotSpotLeft").unbind("mouseover");
			el.data("scrollingHotSpotLeft").unbind("mouseout");
			el.data("scrollingHotSpotLeft").unbind("mousedown");

			// Restore the original content of the scrollable area
			el.data("scrollableArea").html(el.data("originalElements"));

			// Remove the width of the scrollable area
			el.data("scrollableArea").removeAttr("style");
			el.data("scrollingHotSpotRight").removeAttr("style");
			el.data("scrollingHotSpotLeft").removeAttr("style");

			el.data("scrollWrapper").scrollLeft(0);
			el.data("scrollingHotSpotLeft").removeClass("scrollingHotSpotLeftVisible");
			el.data("scrollingHotSpotRight").removeClass("scrollingHotSpotRightVisible");
			el.data("scrollingHotSpotRight").hide();
			el.data("scrollingHotSpotLeft").hide();

			// Call the base destroy function
			$.Widget.prototype.destroy.apply(this, arguments);

		}
	});
})(jQuery);