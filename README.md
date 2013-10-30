# jQuery Smooth Div Scroll
Smooth Div Scroll is a jQuery plugin that scrolls content horizontally left or right. You'll find all the documentation you need at [smoothdivscroll.com](http://www.smoothdivscroll.com).

## Version 1.3 - Release Notes
The documentation at [smoothdivscroll.com](http://www.smoothdivscroll.com) has now been updated and is valid for Smooth Div Scroll version 1.3. Let me know if there's something that I've missed. If you want to know what has changed between version 1.2 and 1.3 I suggest that you read these release notes though.

### All external libraries have been updated
* jQuery (1.10.2)
* jQuery UI custom (1.10.3)
* jquery.mousewheel (3.1.4)

And a new library has been added to support touch:

* jquery.kinetic.js (1.8.2)

So you need to add kinetic to your page for Smooth Div Scroll 1.3 to work:
```
<script src="js/jquery.kinetic.min.js" type="text/javascript"></script>
```


### Touch support added (yippey!)
Finally Smooth Div Scroll has support for touch devices! I have used [jquery.kinetic.js](https://github.com/davetayls/jquery.kinetic) to handle the touch events. Here's a simple example showing how to use it:

```javascript
$(document).ready(function () {
	$("div#makeMeScrollable").smoothDivScroll({
		touchScrolling: true,
		hotSpotScrolling: false
	});
```
In order for this to work you also need to include jquery.kinetic.js on your page. As you can see I have disabled hotSpotScrolling since it's not working very well on touch devices, but you don't *need* to do that.


### All names/options/parmeters are now camel-case
Previously there was a mix of lowercase and camel-case names. For example one of the values for the option ```visibleHotSpotBackgrounds``` was ```onstart``` eventhough the option name itself was camel-case. It's now ```onStart```. So now I've standardized on camel-case everywhere. At least it should be that way. Let me know if you find something strange.


### Rebuilt methods for external content loading
In [Issue #10](https://github.com/tkahn/Smooth-Div-Scroll/issues/10) stanislaw presented two great ideas for improvement. One of them was a new method for loading non-AJAX content into the scroller (raw HTML). Looking into this I realized that the old method, ```changeContent```, would become bloated and hard to understand. So I split the old functionality into two separate methods and added a third, new method. So if you want to add external content to the scroller use one of these three methods:

* **getFlickrContent(content, manipulationMethod)**

  flickrFeedURL - a valid URL to a Flickr feed - string

  manipulationMethod - addFirst, addLast or replace (default) - string

* **getAjaxContent(content, manipulationMethod, filterTag)**

  content - a valid URL to an AJAX content source - string

  manipulationMethod - addFirst, addLast or replace (default) - string

  filterTag - a jQuery selector that matches the elements from the AJAX content source that you want, for example ".myClass" or "#thisDiv" or "div" - string

* **getHtmlContent: function (content, manipulationMethod, filterTag)**

  content - any raw HTML that you want - string

  manipulationMethod - addFirst, addLast or replace (default) - string

  filterTag - a jQuery selector that matches the elements from the raw HTML that you want, for example ".myClass" or "#thisDiv" or "div" - string

The parameters to the methods have been changed as well. The parameter ```addWhere``` is not used anymore instead the paramter ```manipulationMethod``` has been used. There's a new parameter as well - ```filterTag```. Use this parameter to match only certain elements in the content that you want. This is useful to filter out just the stuff you want.

Here's an example of how you would use it for loading raw HTML:

```javascript
$("div#makeMeScrollable").smoothDivScroll("getHtmlContent", "<div style='width: 300px; float: left;'><p>Hi ho I'm a little paragraph</p></div>", "addLast");
```
And AJAX:
```javascript
$("div#makeMeScrollable").smoothDivScroll("getAjaxContent", "ajaxContentMixed.html", "replace");
```
If you want to test loading some AJAX content, I've added a file that you can use to test it. I don't think you can test it on a local folder on your desktop though - you need to run it on a web server due to security restrictions in the browsers.

### Rebuild the way you load external content on initialization
Since I had rebuilt the external content loading methods I also had to rebuild the way content is loaded when you initialize the plugin. I decided the most flexible way to do this is to make use of the three methods that already exist. So now you can load any type of content when the plugin initializes, not just content using AJAX.

Here's an example of how to use this feature:

```javascript
$("div#makeMeScrollable").smoothDivScroll({
	getContentOnLoad: {
		method: "getAjaxContent",
		content: "ajaxContentMixed.html",
		manipulationMethod: "addFirst"
	}
});
```
As you can see it looks a lot like using the public methods, but with object notation.


### Show hot spots on hover
In [Issue #25](https://github.com/tkahn/Smooth-Div-Scroll/issues/25) andrewminton suggested I'd add an option that makes the hot spots visible only when you hover over the scroller. Great idea! Now it's implemented in Smooth Div Scroll:

```javascript
$("div#makeMeScrollable").smoothDivScroll({
	visibleHotSpotBackgrounds: "hover"
});
```
The hot spots can still disappear if you reach the end of the scroller, but that's as it should be since it would be strange to show a hot spot that does nothing.


### Checks for any classes already present on the page
In [Issue #14](https://github.com/tkahn/Smooth-Div-Scroll/issues/14) giovannipds suggested I'd make the plugin check the page to see if the extra elements needed by the scroller (```scrollingHotSpotLeft, scrollingHotSpotRight, scrollableArea and scrollWrapper```) where present. If they are, Smooth Div Scroll will use them. Otherwise it will add the elements needed. It even handles cases where only one or some of the elements are present.


### Better control over mousewheel events
In [Issue #11](https://github.com/tkahn/Smooth-Div-Scroll/pull/11) Avinash-Bhat reported problems with the mousewheel scrolling, specifically that it was annoying that the vertical mousewheel scrolling on the page was interrupted when the pointer is over the scroller. At the same time, you sometimes want to hijack the vertical scrolling event to control the scroller instead of the page. The solution was to alter the option ```mousewheelScrolling``` from a boolean (true/false) to being able to set the desired behavior. Now you can provide it with any of three different values: ```vertical```, ```horizontal``` or ```allDirections```. The mousewheel scrolling is then restricted to the direction you specify.

Here's an example of how to use the option:
```javascript
$("div#makeMeScrollable").smoothDivScroll({
	mousewheelScrolling: "horizontal"
});
```


### New public method to get the scroller offset
In [Issue #10](https://github.com/tkahn/Smooth-Div-Scroll/issues/10) stanislaw requested a method that would return the current scroller offset. So I implemented one that can be used like this:

```javascript
var offset = $("div#makeMeScrollable").smoothDivScroll("getScrollerOffset");
alert(offset);
});
```
The only thing to watch out for with this method is that if the scroller is set to scroll continuously, the offset is not that relevant anymore since the plugin will swap the elements inside the scroller around and manipulate the offset in this process. In other words: it's not trustworthy when used together with continuous scrolling.


### Other smaller fixes
* I have reversed the mousewheel scrolling direction since it's more natural that the scroller moves right when you scroll down and left when you scroll up. 

* If you had ```manualContinuousScrolling``` set to ```true``` and ```autoScrollingMode``` set to ```always```, the hot spots where visible. They should always be hidden when you have ```autoScrollingMode``` set to ```always```.

* In the example page I added "https:" to the URL that loads jQuery from Google API's. Not that the prevoius protocol-less URL was wrong, but it seemed to work bad when you ran the code from file locally.
