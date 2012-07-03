all: uglify

uglify: js/jquery.smoothDivScroll-1.2.js
	uglifyjs -nc -o js/jquery.smoothdivscroll-1.2-min.js js/jquery.smoothDivScroll-1.2.js
