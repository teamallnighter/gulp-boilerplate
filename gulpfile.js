/*  Comments Start

1. Gulp APIs:

    gulp.task("task_name", function_or_api) - Allows to set up a task with the name and the function/API that would return something
    -------------------------
    gulp.src("glob_pattern") - Allows to set the path to the source files with the help of a glob pattern
    -------------------------
    gulp.pipe() - Adds additional step to the task. Inside you can execute a plugin.
    -------------------------
    gulp.dest("glob_pattern") - Allows to set the ouptup path with the help of a glob pattern
    -------------------------
    gulp.watch(["glob_pattern"], tasks_to_be_executed) - Watches for the globs changes and runs the tasks after a change has occured
    -------------------------
    gulp.series(["name_of_the_task"]) - Allows to execute tasks in a sequential, strict order. Use it when the order is important
    -------------------------
    gulp.parallel(["name_of_the_task"]) - Allows to execute tasks simultaneously. Use it when the order is not important

2. Globs:

    Glob - a string of literal and/or wildcard characters used to match filepaths.

*/

//  *.file_name_extension (e.g. "scripts/*.js") - matches all the files within one directory. Children files and folders are not included
//--------------------------------------

//  **/*.file_name_extension (e.g. "scripts/**/*.js") - matches all the files within one directory, INCLUDING all the children folders and files

//--------------------------------------
// !full_file_or_folder_name (e.g. "!main.scss" or "!node_modules/**") - negative glob. Excludes file/files and folders. Use it only after the positive globs
/*

3. Gulp workflow:

  1) Find a plugin with the help of the browser: gulp feature_name

  2) Install the plugin’s package: npm install gulp-uglify --save-dev
  
  3) Import the plugin’s package to the gulpfile.js: 
  
      const variable_name = require("gulp_plugin-name");

  4) Create a basic task:

      gulp.task("task_name", function(callback) {
        return(

        )
        callback();
      })

  5) Use the "gulp.src" method to specify a glob for the source files in the task:

      gulp.src("glob_pattern")

  6) Add additional steps to the task with the ".pipe" method:

      .pipe()

  7) Execute the plugin and provide additional options if they are required or needed:

      .pipe(rename("./styles.min.css"))

  8) Use the "gulp.dest" method to specify the output directory for the files in the task:

      gulp.dest("/dist/")

  9) Set the "gulp.watch" task in order to track the globes and execute tasks upon any changes

  10) Use the "gulp.series" method when you want to execute tasks in the sequential, strict order:

      gulp.series(["sass", "js", "less"])

  11) Use the "gulp.parallel" method when you want to execute tasks simultaneously:

      gulp.parallel(["sass", "less", "imagemin", "html"])

-----------------------------------------------------------

Comments End */




const gulp = require("gulp");
const sass = require("gulp-sass");
const sourcemaps = require("gulp-sourcemaps");
const browserSync = require("browser-sync").create();
const less = require("gulp-less");
const cssnano = require("gulp-cssnano");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const concat = require("gulp-concat");
const imagemin = require("gulp-imagemin");
const cache = require("gulp-cache");
const kit = require("gulp-kit");
const htmlmin = require("gulp-htmlmin");
const autoprefixer = require("gulp-autoprefixer");
const babel = require("gulp-babel");
const zip = require("gulp-zip");
const del = require("del");
const plumber = require("gulp-plumber");
const notifier = require("gulp-notifier");

notifier.defaults({
  messages: {
    sass: "CSS was successfully compiled!",
    js: "Javascript is ready!",
    kit: "HTML was delivered!"
  },
  prefix: "=====",
  suffix: "=====",
  exclusions: ".map"
});

filesPath = {
  sass: "./src/sass/**/*.scss",
  less: "./src/less/styles.less",
  js: "./src/js/**/*.js",
  images: "./src/img/**/*.+(png|jpg|gif|svg)",
  html: "./html/**/*.kit"
}

// Sass

gulp.task("sass", function(done) {
  return (
    gulp
      .src([filesPath.sass, "!./src/sass/widget.scss"])
      .pipe(plumber({errorHandler: notifier.error}))
      .pipe(sourcemaps.init())
      .pipe(autoprefixer())
      .pipe(sass())
      .pipe(cssnano())
      .pipe(sourcemaps.write("."))
      .pipe(
        rename(function(path) {
          if (!path.extname.endsWith(".map")) {
            path.basename += ".min";
          }
        })
      )
      .pipe(gulp.dest("./dist/css"))
      .pipe(notifier.success("sass"))
  );
  done();
});

// Less

gulp.task("less", function(done) {
  return gulp
    .src(filesPath.less)
    .pipe(plumber({errorHandler: notifier.error}))
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(cssnano())
    .pipe(sourcemaps.write("."))
    .pipe(rename("./styles.min.css"))
    .pipe(gulp.dest("./dist/css"));
  done();
});

// Javascript

gulp.task("javascript", function(done) {
  return gulp
    .src(["./src/js/alert.js", "./src/js/project.js"])
    .pipe(plumber({errorHandler: notifier.error}))
    .pipe(babel({
      presets: ["@babel/env"]
    }))
    .pipe(concat("project.js"))
    .pipe(uglify())
    .pipe(
      rename({
        suffix: ".min"
      })
    )
    .pipe(gulp.dest("./dist/js"));
    .pipe(notifier.success("js"))
  done();
});

// Images optimization

gulp.task("imagemin", function(done) {
  return (
    gulp.src(filesPath.images)
    .pipe(cache(imagemin()))
    .pipe(gulp.dest("./dist/img/"))
  )
  done();
})

//  HTML kit templating

gulp.task("kit", function(done) {
  return (
    gulp.src(filesPath.html)
      .pipe(plumber({errorHandler: notifier.error}))
      .pipe(kit())
      .pipe(htmlmin({
        collapseWhitespace: true
      }))
      .pipe(gulp.dest("./"))
      .pipe(notifier.success("kit"))
  )
  done();
})

// Watch task with BrowserSync

gulp.task("watch", function() {
  browserSync.init({
    server: {
      baseDir: "./"
    },
    browser: "firefox developer edition"
  });

  gulp
    .watch(
      [
        filesPath.sass,
        filesPath.html,
        filesPath.less,
        filesPath.js,
        filesPath.images
      ],
      gulp.parallel(["sass", "less", "javascript", "imagemin", "kit"])
    )
    .on("change", browserSync.reload);
});

// Clear images cache

gulp.task("clear-cache", function(done) {
  return cache.clearAll(done);
});

// Serve

gulp.task("serve", gulp.parallel(["sass", "less", "javascript", "imagemin", "kit"]));

// Gulp default command

gulp.task("default", gulp.series(["serve", "watch"]));

// Zip project

gulp.task("zip", function(done) {
  return(
    gulp.src(["./**/*", "!./node_modules/**/*"])
    .pipe(zip("project.zip"))
    .pipe(gulp.dest("./"))
  )
  done();
})

// Clean "dist" folder

gulp.task("clean-dist", function(done) {
  return del(["./dist/**/*"]);
    done();
});




