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

// To make middleware easier to import
var fs = require("fs");

function generateIndex(directory) {
	var cwd = process.cwd();
	process.chdir(directory);
	var files = recurseDirectories();
	// Our index file has a generic structure:
	var indexFile = "";
	for( var i = 0; i < files.length; i++ ) {
		if( files[i] !== "./index.js" && /\.js$/.test(files[i]) ) {
			indexFile += "module.exports." + files[i].slice(2, -3) + "Middleware = require(\"" + files[i].slice(0, -3) + "\");\n";
		}
	}
	fs.writeFileSync("index.js", indexFile);
	process.chdir(cwd);
}

function recurseDirectories() {
	var allFiles = [];
	function doRecurse(dir) {
		var newFiles = fs.readdirSync(dir);
		for( var i = 0; i < newFiles.length; i++ ) {
			var fullPath = dir + '/' + newFiles[i];
			if( fs.lstatSync(fullPath).isDirectory() ) {
				doRecurse(fullPath);
			} else {
				allFiles.push(fullPath);
			}
		}
	}
	doRecurse(".");
	return allFiles;
}

gulp.task("lint", function() {
	return gulp.src("src/**/*.js")
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

gulp.task("compile-middleware", ["generate-npm-module"], function() {
	return gulp.src("src/middleware/*.js")
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ["es2015"]
		}))
		.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("middleware"))
		.pipe(ignore(/\.map$/))
		.pipe(uglify())
		.pipe(size({
			showFiles: true,
			showTotal: false,
			gzip: true
		}));
});

gulp.task("generate-browser-module", ["compile-middleware"], function() {
	// Now that middleware is compiled we can generate the index
	generateIndex("middleware");

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
