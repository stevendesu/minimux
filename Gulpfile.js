var gulp = require("gulp");
var babel = require("gulp-babel");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var sourcemaps = require("gulp-sourcemaps");

gulp.task("default", function() {
	gulp.src("index.js")
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ["es2015"]
		}))
		.pipe(uglify())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("./"));
});