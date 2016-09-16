var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");

var browserify = require("browserify");
var envify = require("envify/custom");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");

gulp.task("generate-npm-module", function() {
	return gulp.src("src/index.js")
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ["es2015"]
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("dist"));
});

gulp.task("generate-browser-module", ["generate-npm-module"], function() {
	return browserify("dist/index.js")
		.transform(envify({
			NODE_ENV: "development"
		}))
		.bundle()
		.pipe(source("minimux.js"))
		.pipe(buffer())
		.pipe(sourcemaps.init())
		.pipe(gulp.dest("./"))
		.pipe(uglify())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("./"));
});

gulp.task("default", ["generate-browser-module"]);
