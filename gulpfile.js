// For NPM build
var gulp = require("gulp");
var eslint = require("gulp-eslint");
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");

// For browser build
var browserify = require("browserify");
var envify = require("envify/custom");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");

// For bragging
var ignore = require("gulp-ignore");
var replace = require("gulp-replace");
var size = require("gulp-size");

gulp.task("lint", function() {
	return gulp.src("src/index.js")
		.pipe(eslint({
			rulePaths: ["eslint-rules"]
		}))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task("generate-npm-module", ["lint"], function() {
	return gulp.src("src/index.js")
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ["es2015"]
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("dist"))
		// Compute the minified size (for bragging rights)
		.pipe(ignore(/\.map$/))
		.pipe(size({
			showFiles: true,
			showTotal: false
		}))
		// Good bragging rights should assume production-level compression
		.pipe(replace("process.env.NODE_ENV", "\"production\""))
		.pipe(uglify())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(size({
			showFiles: true,
			showTotal: false,
			gzip: true
		}));
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
		.pipe(size({
			showFiles: true,
			showTotal: false
		}))
		.pipe(uglify())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("./"))
		.pipe(ignore(/\.map$/))
		.pipe(size({
			showFiles: true,
			showTotal: false,
			gzip: true
		}));
});

gulp.task("default", ["generate-browser-module"]);
