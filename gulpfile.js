var gulp = require("gulp");
var ghpages = require("gh-pages");
var del = require("del");

var src = {
  css: ["src/**/*.css"],
  html: ["src/**/*.html"],
  js: ["src/**/*.js"],
};

var dst = {
  css: "docs/",
  html: "docs/",
  js: "docs/",
};

gulp.task("clean", function () {
  return del(["docs"]);
});

gulp.task("build:html", function () {
  return gulp.src(src.html).pipe(gulp.dest(dst.html));
});
gulp.task("build:js", function () {
  return gulp.src(src.js).pipe(gulp.dest(dst.js));
});
gulp.task("build:css", function () {
  return gulp.src(src.css).pipe(gulp.dest(dst.css));
});

gulp.task("build", gulp.series("clean", "build:css", "build:js", "build:html"));

gulp.task("deploy", function (cb) {
  ghpages.publish(
    "docs",
    {
      branch: "publish",      // 원래 쓰시던 대상 브랜치
      dotfiles: true,         // 필요시
      message: "deploy: " + new Date().toISOString(),
      // repo: "https://github.com/<user>/<repo>.git", // 필요시 명시
      // remote: "origin",      // 기본 origin이면 생략
    },
    cb
  );
});

// default
gulp.task("default", gulp.series("build"));
