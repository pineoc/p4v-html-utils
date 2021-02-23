/// <binding AfterBuild="build" />
var gulp = require("gulp");

var src = {
    css: [ "src/**/*.css" ],
    html: [ "src/**/*.html" ],
    js: [ "src/**/*.js" ],
};

var dst = {
    css: "docs/",
    html: "docs/",
    js: "docs/",
};

gulp.task("build:html", function () {
    return gulp.src(src.html).pipe(gulp.dest(dst.html));
});
gulp.task("build:js", function () {
    return gulp.src(src.js).pipe(gulp.dest(dst.js));
});
gulp.task("build:css", function () {
  return gulp.src(src.css).pipe(gulp.dest(dst.css));
});
gulp.task("build", gulp.series("build:css", "build:js", "build:html"));

// default
gulp.task("default",  gulp.series("build"));
