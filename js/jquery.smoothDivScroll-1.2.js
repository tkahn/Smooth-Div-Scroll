/*
 * jQuery SmoothDivScroll 1.2
 *
 * Copyright (c) 2012 Thomas Kahn
 * Licensed under the GPL license.
 *
 * http://www.smoothdivscroll.com/
 *
 * Depends:
 * jquery-1.7.x.min.js
   Please use //ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js

 * jquery.ui.widget.js
 * jquery.ui.effects.min.js
   Make your own custom download at http://jqueryui.com/download.
   First deslect all components. Then check just "Widget" and "Effects Core".
   Download the file and put it in your javascript folder.

 * jquery.mousewheel.min.js
   Download the latest version at http://brandonaaron.net/code/mousewheel/demos
 *
 */
(function ($) {

	$.widget("thomaskahn.smoothDivScroll", {
		// Default options
		options: {
			// Classes for elements added by Smooth Div Scroll
			scrollingHotSpotLeftClass: "scrollingHotSpotLeft", // String
			scrollingHotSpotRightClass: "scrollingHotSpotRight", // String
			scrollableAreaClass: "scrollableArea", // String
			scrollWrapperClass: "scrollWrapper", // String

			// Misc settings
			hiddenOnStart: false, // Boolean
			ajaxContentURL: "", // String
			countOnlyClass: "", // String
			startAtElementId: "", // String

			// Hotspot scrolling
			hotSpotScrolling: true, // Boolean
			hotSpotScrollingStep: 15, // Pixels
			hotSpotScrollingInterval: 10, // Milliseconds
			hotSpotMouseDownSpeedBooster: 3, // Integer
			visibleHotSpotBackgrounds: "onstart", // always, onstart or empty (no visible hotspots)
			hotSpotsVisibleTime: 5000, // Milliseconds
			easingAfterHotSpotScrolling: true, // Boolean
			easingAfterHotSpotScrollingDistance: 10, // Pixels
			easingAfterHotSpotScrollingDuration: 300, // Milliseconds
			easingAfterHotSpotScrollingFunction: "easeOutQuart", // String

			// Mousewheel scrolling
			mousewheelScrolling: false, // Boolean
			mousewheelScrollingStep: 70, // Pixels
			easingAfterMouseWheelScrolling: true, // Boolean
			easingAfterMouseWheelScrollingDuration: 300, // Milliseconds
			easingAfterMouseWheelScrollingFunction: "easeOutQuart", // String

			// Manual scrolling (hotspot and/or mousewheel scrolling)
			manualContinuousScrolling: false, // Boolean

			// Autoscrolling
			autoScrollingMode: "", // String
			autoScrollingDirection: "endlessloopright", // String
			autoScrollingStep: 1, // Pixels
			autoScrollingInterval: 10, // Milliseconds

			// Easing for when the scrollToElement method is used
			scrollToAnimationDuration: 1000, // Milliseconds
			scrollToEasingFunction: "easeOutQuart" // String
		},
		_create: function () {
			var self = this, o = this.options, el = this.element;

			// Create additional elements needed by the plugin
			// First the wrappers
			el.wrapInner("<div class='" + o.scrollableAreaClass + "'>").wrapInner("<div class='" + o.scrollWrapperClass + "'>");
			// Then the hot spots
			el.prepend("<div class='" + o.scrollingHotSpotLeftClass + "'></div><div class='" + o.scrollingHotSpotRightClass + "'></div>");

			// Create variables in the element data storage
			el.data("scrollWrapper", el.find("." + o.scrollWrapperClass));
			el.data("scrollingHotSpotRight", el.find("." + o.scrollingHotSpotRightClass));
			el.data("scrollingHotSpotLeft", el.find("." + o.scrollingHotSpotLeftClass));
			el.data("scrollableArea", el.find("." + o.scrollableAreaClass));
			el.data("speedBooster", 1);
			el.data("scrollXPos", 0);
			el.data("hotSpotWidth", el.data("scrollingHotSpotLeft").innerWidth());
			el.data("scrollableAreaWidth", 0);
			el.data("startingPosition", 0);
			el.data("rightScrollingInterval", null);
			el.data("leftScrollingInterval", null);
			el.data("autoScrollingInterval", null);
			el.data("hideHotSpotBackgroundsInterval", null);
			el.data("previousScrollLeft", 0);
			el.data("pingPongDirection", "right");
			el.data("getNextElementWidth", true);
			el.data("swapAt", null);
			el.data("startAtElementHasNotPassed", true);
			el.data("swappedElement", null);
			el.data("originalElements", el.data("scrollableArea").children(o.countOnlyClass));
			el.data("visible", true);
			el.data("enabled", true);
			el.data("scrollableAreaHeight", el.data("scrollableArea").height());
			el.data("scrollerOffset", el.offset());
			el.data("initialAjaxContentLoaded", false);


			/*****************************************
			SET UP EVENTS FOR SCROLLING RIGHT
			*****************************************/
			// Check the mouse X position and calculate 
			// the relative X position inside the right hotspot
			el.data("scrollingHotSpotRight").bind("mousemove", function (e) {
				var x = e.pageX - (this.offsetLeft + el.data("scrollerOffset").left);
				el.data("scrollXPos", Math.round((x / el.data("hotSpotWidth")) * o.hotSpotScrollingStep));
				if (el.data("scrollXPos") === Infinity) {
					el.data("scrollXPos", 0);
				}
			});

			// Mouseover right hotspot - scrolling
			el.data("scrollingHotSpotRight").bind("mouseover", function () {

				// Stop any ongoing animations
				el.data("scrollWrapper").stop(true, false);

				// Stop any ongoing autoscrolling
				self.stopAutoScrolling();

				// Start the scrolling interval
				el.data("rightScrollingInterval", setInterval(function () {
					if (el.data("scrollXPos") > 0 && el.data("enabled")) {
						el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + (el.data("scrollXPos") * el.data("speedBooster")));

						if (o.manualContinuousScrolling) {
							self._checkContinuousSwapRight();
						}

						self._showHideHotSpots();
					}
				}, o.hotSpotScrollingInterval));

				// Callback
				self._trigger("mouseOverRightHotSpot");

			});

			// Mouseout right hotspot - stop scrolling
			el.data("scrollingHotSpotRight").bind("mouseout", function () {
				clearInterval(el.data("rightScrollingInterval"));
				el.data("scrollXPos", 0);

				// Easing out after scrolling
				if (o.easingAfterHotSpotScrolling && el.data("enabled")) {
					el.data("scrollWrapper").animate({ scrollLeft: el.data("scrollWrapper").scrollLeft() + o.easingAfterHotSpotScrollingDistance }, { duration: o.easingAfterHotSpotScrollingDuration, easing: o.easingAfterHotSpotScrollingFunction });
				}
			});


			// mousedown right hotspot (add scrolling speed booster)
			el.data("scrollingHotSpotRight").bind("mousedown", function () {
				el.data("speedBooster", o.hotSpotMouseDownSpeedBooster);
			});

			// mouseup anywhere (stop boosting the scrolling speed)
			$("body").bind("mouseup", function () {
				el.data("speedBooster", 1);
			});

			/*****************************************
			SET UP EVENTS FOR SCROLLING LEFT
			*****************************************/
			// Check the mouse X position and calculate
			// the relative X position inside the left hotspot
			el.data("scrollingHotSpotLeft").bind("mousemove", function (e) {
				//var x = el.data("hotSpotWidth") - (e.pageX - el.data("scrollerOffset").left);
				var x = ((this.offsetLeft + el.data("scrollerOffset").left + el.data("hotSpotWidth")) - e.pageX);
				el.data("scrollXPos", Math.round((x / el.data("hotSpotWidth")) * o.hotSpotScrollingStep));

				if (el.data("scrollXPos") === Infinity) {
					el.data("scrollXPos", 0);
				}

			});

			// Mouseover left hotspot
			el.data("scrollingHotSpotLeft").bind("mouseover", function () {
				// Stop any ongoing animations
				el.data("scrollWrapper").stop(true, false);

				// Stop any ongoing autoscrolling
				self.stopAutoScrolling();

				el.data("leftScrollingInterval", setInterval(function () {
					if (el.data("scrollXPos") > 0 && el.data("enabled")) {
						el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - (el.data("scrollXPos") * el.data("speedBooster")));

						if (o.manualContinuousScrolling) {
							self._checkContinuousSwapLeft();
						}

						self._showHideHotSpots();
					}
				}, o.hotSpotScrollingInterval));

				// Callback
				self._trigger("mouseOverLeftHotSpot");
			});

			// mouseout left hotspot
			el.data("scrollingHotSpotLeft").bind("mouseout", function () {
				clearInterval(el.data("leftScrollingInterval"));
				el.data("scrollXPos", 0);

				// Easing out after scrolling
				if (o.easingAfterHotSpotScrolling && el.data("enabled")) {
					el.data("scrollWrapper").animate({ scrollLeft: el.data("scrollWrapper").scrollLeft() - o.easingAfterHotSpotScrollingDistance }, { duration: o.easingAfterHotSpotScrollingDuration, easing: o.easingAfterHotSpotScrollingFunction });
				}

			});

			// mousedown left hotspot (add scrolling speed booster)
			el.data("scrollingHotSpotLeft").bind("mousedown", function () {
				el.data("speedBooster", o.hotSpotMouseDownSpeedBooster);
			});

			/*****************************************
			SET UP EVENT FOR MOUSEWHEEL SCROLLING
			*****************************************/
			el.data("scrollableArea").mousewheel(function (event, delta) {
				if (el.data("enabled") && o.mousewheelScrolling) {
					event.preventDefault();

					// Stop any ongoing autoscrolling if it's running
					self.stopAutoScrolling();


					// Can be either positive or negative
					var pixels = Math.round(o.mousewheelScrollingStep * delta);
					self.move(pixels);

				}
			});

			// Capture and disable mousewheel events when the pointer
			// is over any of the hotspots
			if (o.mousewheelScrolling) {
				el.data("scrollingHotSpotLeft").add(el.data("scrollingHotSpotRight")).mousewheel(function (event, delta) {
					event.preventDefault();
				});
			}

			/*****************************************
			SET UP EVENT FOR RESIZING THE BROWSER WINDOW
			*****************************************/
			$(window).bind("resize", function () {
				self._showHideHotSpots();
				self._trigger("windowResized");
			});

			/*****************************************
			FETCHING AJAX CONTENT ON INITIALIZATION
			*****************************************/
			// If there's an ajaxContentURL in the options, 
			// fetch the content
			if (o.ajaxContentURL.length > 0) {
				self.changeContent(o.ajaxContentURL, "", "html", "replace");
			}

			// Should it be hidden on start?
			if (o.hiddenOnStart) {
				self.hide();
			}

			/*****************************************
			AUTOSCROLLING
			*****************************************/
			// The $(window).load event handler is used the width of the elements are not calculated
			// properly until then, at least not in Google Chrome. The start of the autoscrolling and the
			// setting of the hotspot backgrounds is started here as well for the same reason. 
			// If the autoscrolling is not started in $(window).load, it won't start because it 
			// will interpret the scrollable areas as too short.
			$(window).load(function () {

				// If scroller is not hidden, recalculate the scrollable area
				if (!(o.hiddenOnStart)) {
					self.recalculateScrollableArea();
				}

				// Autoscrolling is active
				if ((o.autoScrollingMode.length > 0) && !(o.hiddenOnStart)) {
					self.startAutoScrolling();
				}

				// If the user wants to have visible hotspot backgrounds, 
				// here is where it's taken care of

				if (o.autoScrollingMode !== "always") {

					switch (o.visibleHotSpotBackgrounds) {
						case "always":
							self.showHotSpotBackgrounds();
							break;
						case "onstart":
							self.showHotSpotBackgrounds();
							el.data("hideHotSpotBackgroundsInterval", setTimeout(function () {
								self.hideHotSpotBackgrounds("slow");
							}, o.hotSpotsVisibleTime));
							break;
						default:
							break;
					}
				}

			});

		},
		/**********************************************************
		Override _setOption and handle altered options
		**********************************************************/
		_setOption: function (key, value) {
			var self = this, o = this.options, el = this.element;

			// Update option
			o[key] = value;

			if (key === "hotSpotScrolling") {
				// Handler if the option hotSpotScrolling is altered
				if (value === true) {
					self._showHideHotSpots();
				} else {
					el.data("scrollingHotSpotLeft").hide();
					el.data("scrollingHotSpotRight").hide();
				}
			} else if (key === "autoScrollingStep" ||
			// Make sure that certain values are integers, otherwise
			// they will summon bad spirits in the plugin
				key === "easingAfterHotSpotScrollingDistance" ||
				key === "easingAfterHotSpotScrollingDuration" ||
				key === "easingAfterMouseWheelScrollingDuration") {
				o[key] = parseInt(value, 10);
			} else if (key === "autoScrollingInterval") {
				// Handler if the autoScrollingInterval is altered
				o[key] = parseInt(value, 10);
				self.startAutoScrolling();
			}

		},
		/**********************************************************
		Hotspot functions
		**********************************************************/
		showHotSpotBackgrounds: function (fadeSpeed) {

			// Alter the CSS (SmoothDivScroll.css) if you want to customize
			// the look'n'feel of the visible hotspots
			var self = this, el = this.element;

			// Fade in the hotspot backgrounds
			if (fadeSpeed !== undefined) {
				// Before the fade-in starts, we need to make sure the opacity is zero
				el.data("scrollingHotSpotLeft").add(el.data("scrollingHotSpotRight")).css("opacity", "0.0");

				el.data("scrollingHotSpotLeft").addClass("scrollingHotSpotLeftVisible");
				el.data("scrollingHotSpotRight").addClass("scrollingHotSpotRightVisible");

				// Fade in the hotspots
				el.data("scrollingHotSpotLeft").add(el.data("scrollingHotSpotRight")).fadeTo(fadeSpeed, 0.35);
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
		hideHotSpotBackgrounds: function (fadeSpeed) {
			var el = this.element;

			// Fade out the hotspot backgrounds
			if (fadeSpeed !== undefined) {
				// Fade out the left hotspot
				el.data("scrollingHotSpotLeft").fadeTo(fadeSpeed, 0.0, function () {
					el.data("scrollingHotSpotLeft").removeClass("scrollingHotSpotLeftVisible");
				});

				// Fade out the right hotspot
				el.data("scrollingHotSpotRight").fadeTo(fadeSpeed, 0.0, function () {
					el.data("scrollingHotSpotRight").removeClass("scrollingHotSpotRightVisible");
				});
			}
			// Don't fade, just hide them
			else {
				el.data("scrollingHotSpotLeft").removeClass("scrollingHotSpotLeftVisible").removeAttr("style");
				el.data("scrollingHotSpotRight").removeClass("scrollingHotSpotRightVisible").removeAttr("style");
			}

		},
		// Function for showing and hiding hotspots depending on the
		// offset of the scrolling
		_showHideHotSpots: function () {
			var self = this, el = this.element, o = this.options;

			// If the manual scrolling is set
			if (o.manualContinuousScrolling && o.hotSpotScrolling) {
				el.data("scrollingHotSpotLeft").show();
				el.data("scrollingHotSpotRight").show();
			}
			// Autoscrolling not set to always and hotspot scrolling enabled
			else if (o.autoScrollingMode !== "always" && o.hotSpotScrolling) {
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
					self._trigger("scrollerLeftLimitReached");
					// Clear interval
					clearInterval(el.data("leftScrollingInterval"));
					el.data("leftScrollingInterval", null);
				}
				// When you can't scroll further right
				// the right scroll hotspot should be hidden
				// and the left hotspot visible
				else if (el.data("scrollableAreaWidth") <= (el.data("scrollWrapper").innerWidth() + el.data("scrollWrapper").scrollLeft())) {
					el.data("scrollingHotSpotLeft").show();
					el.data("scrollingHotSpotRight").hide();
					// Callback
					self._trigger("scrollerRightLimitReached");
					// Clear interval
					clearInterval(el.data("rightScrollingInterval"));
					el.data("rightScrollingInterval", null);
				}
				// If you are somewhere in the middle of your
				// scrolling, both hotspots should be visible
				else {
					el.data("scrollingHotSpotLeft").show();
					el.data("scrollingHotSpotRight").show();
				}
			}
			// If autoscrolling is set to always, there should be no hotspots
			else {
				el.data("scrollingHotSpotLeft").hide();
				el.data("scrollingHotSpotRight").hide();
			}
		},
		// Function for calculating the scroll position of a certain element
		_setElementScrollPosition: function (method, element) {
			var self = this, el = this.element, o = this.options, tempScrollPosition = 0;

			switch (method) {
				case "first":
					el.data("scrollXPos", 0);
					return true;
				case "start":
					// Check to see if there is a specified start element in the options 
					// and that the element exists in the DOM
					if (o.startAtElementId !== "") {
						if (el.data("scrollableArea").has("#" + o.startAtElementId)) {
							tempScrollPosition = $("#" + o.startAtElementId).position().left;
							el.data("scrollXPos", tempScrollPosition);
							return true;
						}
					}
					return false;
				case "last":
					el.data("scrollXPos", (el.data("scrollableAreaWidth") - el.data("scrollWrapper").innerWidth()));
					return true;
				case "number":
					// Check to see that an element number is passed
					if (!(isNaN(element))) {
						tempScrollPosition = el.data("scrollableArea").children(o.countOnlyClass).eq(element - 1).position().left;
						el.data("scrollXPos", tempScrollPosition);
						return true;
					}
					return false;
				case "id":
					// Check that an element id is passed and that the element exists in the DOM
					if (element.length > 0) {
						if (el.data("scrollableArea").has("#" + element)) {
							tempScrollPosition = $("#" + element).position().left;
							el.data("scrollXPos", tempScrollPosition);
							return true;
						}
					}
					return false;
				default:
					return false;
			}


		},
		/**********************************************************
		Jumping to a certain element
		**********************************************************/
		jumpToElement: function (jumpTo, element) {
			var self = this, el = this.element;

			// Check to see that the scroller is enabled
			if (el.data("enabled")) {
				// Get the position of the element to scroll to
				if (self._setElementScrollPosition(jumpTo, element)) {
					// Jump to the element
					el.data("scrollWrapper").scrollLeft(el.data("scrollXPos"));
					// Check the hotspots
					self._showHideHotSpots();
					// Trigger the right callback
					switch (jumpTo) {
						case "first":
							self._trigger("jumpedToFirstElement");
							break;
						case "start":
							self._trigger("jumpedToStartElement");
							break;
						case "last":
							self._trigger("jumpedToLastElement");
							break;
						case "number":
							self._trigger("jumpedToElementNumber", null, { "elementNumber": element });
							break;
						case "id":
							self._trigger("jumpedToElementId", null, { "elementId": element });
							break;
						default:
							break;
					}

				}
			}
		},
		/**********************************************************
		Scrolling to a certain element
		**********************************************************/
		scrollToElement: function (scrollTo, element) {
			var self = this, el = this.element, o = this.options, autoscrollingWasRunning = false;

			if (el.data("enabled")) {
				// Get the position of the element to scroll to
				if (self._setElementScrollPosition(scrollTo, element)) {
					// Stop any ongoing autoscrolling
					if (el.data("autoScrollingInterval") !== null) {
						self.stopAutoScrolling();
						autoscrollingWasRunning = true;
					}

					// Stop any other running animations
					// (clear queue but don't jump to the end)
					el.data("scrollWrapper").stop(true, false);

					// Do the scolling animation
					el.data("scrollWrapper").animate({
						scrollLeft: el.data("scrollXPos")
					}, { duration: o.scrollToAnimationDuration, easing: o.scrollToEasingFunction, complete: function () {
						// If autoscrolling was running before, start it again
						if (autoscrollingWasRunning) {
							self.startAutoScrolling();
						}

						self._showHideHotSpots();

						// Trigger the right callback
						switch (scrollTo) {
							case "first":
								self._trigger("scrolledToFirstElement");
								break;
							case "start":
								self._trigger("scrolledToStartElement");
								break;
							case "last":
								self._trigger("scrolledToLastElement");
								break;
							case "number":
								self._trigger("scrolledToElementNumber", null, { "elementNumber": element });
								break;
							case "id":
								self._trigger("scrolledToElementId", null, { "elementId": element });
								break;
							default:
								break;
						}
					}
					});
				}
			}

		},
		move: function (pixels) {
			var self = this, el = this.element, o = this.options;
			// clear queue, move to end
			el.data("scrollWrapper").stop(true, true);

			// Only run this code if it's possible to scroll left or right,
			if ((pixels < 0 && el.data("scrollWrapper").scrollLeft() > 0) || (pixels > 0 && el.data("scrollableAreaWidth") > (el.data("scrollWrapper").innerWidth() + el.data("scrollWrapper").scrollLeft()))) {
				if (o.easingAfterMouseWheelScrolling) {
					el.data("scrollWrapper").animate({ scrollLeft: el.data("scrollWrapper").scrollLeft() + pixels }, { duration: o.easingAfterMouseWheelScrollingDuration, easing: o.easingAfterMouseWheelFunction, complete: function () {
						self._showHideHotSpots();
						if (o.manualContinuousScrolling) {
							if (pixels > 0) {
								self._checkContinuousSwapRight();
							} else {
								self._checkContinuousSwapLeft();
							}
						}
					}
					});
				} else {
					el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + pixels);
					self._showHideHotSpots();

					if (o.manualContinuousScrolling) {
						if (pixels > 0) {
							self._checkContinuousSwapRight();
						} else {
							self._checkContinuousSwapLeft();
						}
					}
				}
			}


		},
		/**********************************************************
		Adding or replacing content
		**********************************************************/

		changeContent: function (ajaxContentURL, contentType, manipulationMethod, addWhere) {
			var self = this, el = this.element;

			switch (contentType) {
				case "flickrFeed":
					$.getJSON(ajaxContentURL, function (data) {
						// small square - size is 75x75
						// thumbnail -> large - size is the longest side
						var flickrImageSizes = [{ size: "small square", pixels: 75, letter: "_s" },
												{ size: "thumbnail", pixels: 100, letter: "_t" },
												{ size: "small", pixels: 240, letter: "_m" },
												{ size: "medium", pixels: 500, letter: "" },
												{ size: "medium 640", pixels: 640, letter: "_z" },
												{ size: "large", pixels: 1024, letter: "_b"}];
						var loadedFlickrImages = [];
						var imageIdStringBuffer = [];
						var tempIdArr = [];
						var startingIndex;
						var numberOfFlickrItems = data.items.length;
						var loadedFlickrImagesCounter = 0;

						// Determine a plausible starting value for the
						// image height
						if (el.data("scrollableAreaHeight") <= 75) {
							startingIndex = 0;
						} else if (el.data("scrollableAreaHeight") <= 100) {
							startingIndex = 1;
						} else if (el.data("scrollableAreaHeight") <= 240) {
							startingIndex = 2;
						} else if (el.data("scrollableAreaHeight") <= 500) {
							startingIndex = 3;
						} else if (el.data("scrollableAreaHeight") <= 640) {
							startingIndex = 4;
						} else {
							startingIndex = 5;
						}

						// Put all items from the feed in an array.
						// This is necessary
						$.each(data.items, function (index, item) {
							loadFlickrImage(item, startingIndex);
						});

						function loadFlickrImage(item, sizeIndex) {
							var path = item.media.m;
							var imgSrc = path.replace("_m", flickrImageSizes[sizeIndex].letter);
							var tempImg = $("<img />").attr("src", imgSrc);

							tempImg.load(function () {
								// Is it still smaller? Load next size
								if (this.height < el.data("scrollableAreaHeight")) {
									// Load a bigger image, if possible
									if ((sizeIndex + 1) < flickrImageSizes.length) {
										loadFlickrImage(item, sizeIndex + 1);
									} else {
										addImageToLoadedImages(this);
									}
								}
								else {
									addImageToLoadedImages(this);
								}

								// Finishing stuff to do when all images have been loaded
								if (loadedFlickrImagesCounter === numberOfFlickrItems) {


									switch (manipulationMethod) {
										case "add":
											// Add the images to the scrollable area
											if (addWhere === "first") {
												el.data("scrollableArea").children(":first").before(loadedFlickrImages);
											}
											else {
												el.data("scrollableArea").children(":last").after(loadedFlickrImages);
											}
											break;
										default:
											// Replace the content in the scrollable area
											el.data("scrollableArea").html(loadedFlickrImages);
											break;
									}


									// Recalculate the total width of the elements inside the scrollable area
									// if it's not the initial AJAX content load. If so, it's taken care of
									// in the $(window).load eventhandler
									if (el.data("initialAjaxContentLoaded")) {
										self.recalculateScrollableArea();
									} else {
										el.data("initialAjaxContentLoaded", true);
									}

									// Determine which hotspots to show
									self._showHideHotSpots();

									// Trigger callback
									self._trigger("addedFlickrContent", null, { "addedElementIds": imageIdStringBuffer });
								}

							});

						}

						// Add the loaded content first or last in the scrollable area
						function addImageToLoadedImages(imageObj) {
							// Calculate the scaled width
							var widthScalingFactor = el.data("scrollableAreaHeight") / imageObj.height;
							var tempWidth = Math.round(imageObj.width * widthScalingFactor);
							// Set an id for the image - the filename is used as an id
							var tempIdArr = $(imageObj).attr("src").split("/");
							var lastElemIndex = (tempIdArr.length - 1);
							tempIdArr = tempIdArr[lastElemIndex].split(".");
							$(imageObj).attr("id", tempIdArr[0]);
							// Set the height of the image to the height of the scrollable area and add the width
							$(imageObj).css({ "height": el.data("scrollableAreaHeight"), "width": tempWidth });
							// Add the id of the image to the array of id's - this
							// is used as a parameter when the callback is triggered
							imageIdStringBuffer.push(tempIdArr[0]);
							// Add the image to the array of loaded images
							loadedFlickrImages.push(imageObj);

							// Increment counter for loaded images
							loadedFlickrImagesCounter++;
						}

					});
					break;
				default: // just add plain HTML or whatever is at the URL
					$.get(ajaxContentURL, function (data) {

						switch (manipulationMethod) {
							case "add":
								// Add the loaded content first or last in the scrollable area
								if (addWhere === "first") {
									el.data("scrollableArea").children(":first").before(data);
								}
								else {
									el.data("scrollableArea").children(":last").after(data);
								}
								break;
							default:
								// Replace the content in the scrollable area
								el.data("scrollableArea").html(data);
								break;
						}

						// Recalculate the total width of the elements inside the scrollable area
						// if it's not the initial AJAX content load. If so, it's taken care of
						// in the $(window).load eventhandler
						if (el.data("initialAjaxContentLoaded")) {
							self.recalculateScrollableArea();
						} else {
							el.data("initialAjaxContentLoaded", true);
						}

						// Determine which hotspots to show
						self._showHideHotSpots();

						// Trigger callback
						self._trigger("addedHtmlContent");

					});
			}
		},
		/**********************************************************
		Recalculate the scrollable area
		**********************************************************/
		recalculateScrollableArea: function () {

			var tempScrollableAreaWidth = 0, foundStartAtElement = false, o = this.options, el = this.element, self = this;

			// Add up the total width of all the items inside the scrollable area

			el.data("scrollableArea").children(o.countOnlyClass).each(function () {
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
		},
		/**********************************************************
		Stopping, starting and doing the autoscrolling
		**********************************************************/
		stopAutoScrolling: function () {
			var self = this, el = this.element;

			if (el.data("autoScrollingInterval") !== null) {
				clearInterval(el.data("autoScrollingInterval"));
				el.data("autoScrollingInterval", null);

				// Check to see which hotspots should be active
				// in the position where the scroller has stopped
				self._showHideHotSpots();

				self._trigger("autoScrollingStopped");
			}
		},
		startAutoScrolling: function () {
			var self = this, el = this.element, o = this.options;

			if (el.data("enabled")) {
				self._showHideHotSpots();

				// Stop any running interval
				clearInterval(el.data("autoScrollingInterval"));
				el.data("autoScrollingInterval", null);

				// Callback
				self._trigger("autoScrollingStarted");

				// Start interval
				el.data("autoScrollingInterval", setInterval(function () {

					// If the scroller is not visible or
					// if the scrollable area is shorter than the scroll wrapper
					// any running autoscroll interval should stop.
					if (!(el.data("visible")) || (el.data("scrollableAreaWidth") <= (el.data("scrollWrapper").innerWidth()))) {
						// Stop any running interval
						clearInterval(el.data("autoScrollingInterval"));
						el.data("autoScrollingInterval", null);
					}
					else {
						// Store the old scrollLeft value to see if the scrolling has reached the end
						el.data("previousScrollLeft", el.data("scrollWrapper").scrollLeft());

						switch (o.autoScrollingDirection) {
							case "right":

								el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + o.autoScrollingStep);
								if (el.data("previousScrollLeft") === el.data("scrollWrapper").scrollLeft()) {
									self._trigger("autoScrollingRightLimitReached");
									clearInterval(el.data("autoScrollingInterval"));
									el.data("autoScrollingInterval", null);
									self._trigger("autoScrollingIntervalStopped");
								}
								break;

							case "left":
								el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - o.autoScrollingStep);
								if (el.data("previousScrollLeft") === el.data("scrollWrapper").scrollLeft()) {
									self._trigger("autoScrollingLeftLimitReached");
									clearInterval(el.data("autoScrollingInterval"));
									el.data("autoScrollingInterval", null);
									self._trigger("autoScrollingIntervalStopped");
								}
								break;

							case "backandforth":
								if (el.data("pingPongDirection") === "right") {
									el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + (o.autoScrollingStep));
								}
								else {
									el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - (o.autoScrollingStep));
								}

								// If the scrollLeft hasnt't changed it means that the scrolling has reached
								// the end and the direction should be switched
								if (el.data("previousScrollLeft") === el.data("scrollWrapper").scrollLeft()) {
									if (el.data("pingPongDirection") === "right") {
										el.data("pingPongDirection", "left");
										self._trigger("autoScrollingRightLimitReached");
									}
									else {
										el.data("pingPongDirection", "right");
										self._trigger("autoScrollingLeftLimitReached");
									}
								}
								break;

							case "endlessloopright":
								// Do the autoscrolling
								el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + o.autoScrollingStep);

								self._checkContinuousSwapRight();
								break;
							case "endlessloopleft":
								// Do the autoscrolling
								el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() - o.autoScrollingStep);

								self._checkContinuousSwapLeft();
								break;
							default:
								break;

						}
					}
				}, o.autoScrollingInterval));
			}
		},
		_checkContinuousSwapRight: function () {
			var self = this, el = this.element, o = this.options;

			// Get the width of the first element. When it has scrolled out of view,
			// the element swapping should be executed. A true/false variable is used
			// as a flag variable so the swapAt value doesn't have to be recalculated
			// in each loop.
			if (el.data("getNextElementWidth")) {

				if ((o.startAtElementId.length > 0) && (el.data("startAtElementHasNotPassed"))) {
					// If the user has set a certain element to start at, set swapAt 
					// to that element width. This happens once.
					el.data("swapAt", $("#" + o.startAtElementId).outerWidth(true));
					el.data("startAtElementHasNotPassed", false);
				}
				else {
					// Set swapAt to the first element in the scroller
					el.data("swapAt", el.data("scrollableArea").children(":first").outerWidth(true));
				}
				el.data("getNextElementWidth", false);
			}


			// Check to see if the swap should be done
			if (el.data("swapAt") <= el.data("scrollWrapper").scrollLeft()) {
				el.data("swappedElement", el.data("scrollableArea").children(":first").detach());
				el.data("scrollableArea").append(el.data("swappedElement"));
				var wrapperLeft = el.data("scrollWrapper").scrollLeft();
				el.data("scrollWrapper").scrollLeft(wrapperLeft - el.data("swappedElement").outerWidth(true));
				el.data("getNextElementWidth", true);

			}
		},
		_checkContinuousSwapLeft: function () {
			var self = this, el = this.element, o = this.options;

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

			// Check to see if the swap should be done
			if (el.data("scrollWrapper").scrollLeft() === 0) {
				el.data("swappedElement", el.data("scrollableArea").children(":last").detach());
				el.data("scrollableArea").prepend(el.data("swappedElement"));
				el.data("scrollWrapper").scrollLeft(el.data("scrollWrapper").scrollLeft() + el.data("swappedElement").outerWidth(true));
				el.data("getNextElementWidth", true);
			}

		},
		restoreOriginalElements: function () {
			var self = this, el = this.element;

			// Restore the original content of the scrollable area
			el.data("scrollableArea").html(el.data("originalElements"));
			self.recalculateScrollableArea();
			self.jumpToElement("first");
		},
		show: function () {
			var el = this.element;
			el.data("visible", true);
			el.show();
		},
		hide: function () {
			var el = this.element;
			el.data("visible", false);
			el.hide();
		},
		enable: function () {
			var el = this.element;

			// Set enabled to true
			el.data("enabled", true);
		},
		disable: function () {
			var self = this, el = this.element;

			// Clear all running intervals
			self.stopAutoScrolling();
			clearInterval(el.data("rightScrollingInterval"));
			clearInterval(el.data("leftScrollingInterval"));
			clearInterval(el.data("hideHotSpotBackgroundsInterval"));

			// Set enabled to false
			el.data("enabled", false);
		},
		destroy: function () {
			var self = this, el = this.element;

			// Clear all running intervals
			self.stopAutoScrolling();
			clearInterval(el.data("rightScrollingInterval"));
			clearInterval(el.data("leftScrollingInterval"));
			clearInterval(el.data("hideHotSpotBackgroundsInterval"));

			// Remove all element specific events
			el.data("scrollingHotSpotRight").unbind("mouseover");
			el.data("scrollingHotSpotRight").unbind("mouseout");
			el.data("scrollingHotSpotRight").unbind("mousedown");

			el.data("scrollingHotSpotLeft").unbind("mouseover");
			el.data("scrollingHotSpotLeft").unbind("mouseout");
			el.data("scrollingHotSpotLeft").unbind("mousedown");

			// Remove all elements created by the plugin
			el.data("scrollingHotSpotRight").remove();
			el.data("scrollingHotSpotLeft").remove();
			el.data("scrollableArea").remove();
			el.data("scrollWrapper").remove();

			// Restore the original content of the scrollable area
			el.html(el.data("originalElements"));

			// Call the base destroy function
			$.Widget.prototype.destroy.apply(this, arguments);

		}


	});
})(jQuery);