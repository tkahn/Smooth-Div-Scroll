all: uglify

uglify: js/jquery.smoothDivScroll-1.3.js
	uglifyjs -nc -o js/jquery.smoothdivscroll-1.3-min.js js/jquery.smoothDivScroll-1.3.js
