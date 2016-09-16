var gulp = require("gulp");
var babel = require("gulp-babel");
var ignore = require("gulp-ignore");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var sourcemaps = require("gulp-sourcemaps");

gulp.task("default", function() {
	gulp.src("src/index.js")
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ["es2015"]
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("dist"))
		.pipe(ignore(/\.map$/))
		.pipe(uglify())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("dist"));
});
