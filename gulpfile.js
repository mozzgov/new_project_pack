'use strict';

const gulp          =  require('gulp'),
      sass          =  require('gulp-sass'),
      autoprefixer  =  require('gulp-autoprefixer'),
      sourcemaps    =  require('gulp-sourcemaps'),
      livereload    =  require('gulp-livereload'), // need google ext.LiveReload, link:https://goo.gl/DZmxBw
      cssbeautify   =  require('gulp-cssbeautify'),
      mediaqueries  =  require('gulp-group-css-media-queries'),
      imagemin      =  require('gulp-imagemin'),
      rigger        =  require('gulp-rigger'),
      watch         =  require('gulp-watch'),
      rimraf        =  require('rimraf'),

      path = {
        build: {
            html  : './dist/',
            js    : './dist/js/',
            css   : './dist/css/',
            img   : './dist/img/',
            fonts : './dist/fonts/'
        },
        src: {
            html  : './src/**/*.html',
            js    : './src/js/**/*.js',
            scss  : './src/css/scss/**/*.scss',
            css   : './src/css/**/*.css',
            img   : './src/img/**/*.*',
            fonts : './src/fonts/**/*.*'
        },
        clean: './dist/*'
     };

//gulp clean
gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('html:build', function(){
    return gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(livereload())
});
gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});
gulp.task('css:build', function(){
    return gulp.src(path.src.css)
        .pipe(autoprefixer({
            browsers: ['last 10 versions' , 'ie >= 11'],
            cascade: false
        }))
        .pipe(mediaqueries())
        .pipe(cssbeautify({
            indent: '  ',
            openbrace: 'end-of-line',
            autosemicolon: true
        }))
        .pipe(gulp.dest(path.build.css))
        .pipe(livereload())

});
gulp.task('sass:build', function(){
    return gulp.src(path.src.scss)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 10 versions' , 'ie >= 11'],
            cascade: false
        }))
        .pipe(mediaqueries())
        .pipe(cssbeautify({
            indent: '  ',
            openbrace: 'end-of-line',
            autosemicolon: true
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(livereload())

});
gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(gulp.dest(path.build.js))
        .pipe(livereload())
});
gulp.task('images:build', function() {
    return gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(livereload())
});

// gulp build
gulp.task('build', [
    'html:build',
    'sass:build',
    'css:build',
    'js:build',
    'fonts:build',
    'images:build'
]);

// gulp watch
gulp.task('watch', function(){
    //build html if change
    watch([path.src.html], function(event, cb) {
        gulp.start('html:build');
    });
    //build css if change
    watch([path.src.scss], function(event, cb) {
        gulp.start('sass:build');
    });
    watch([path.src.css], function(event, cb) {
        gulp.start('css:build');
    });
    //build js if change
    watch([path.src.js], function(event, cb) {
        gulp.start('js:build');
    });
    //build images if change
    watch([path.src.img], function(event, cb) {
        gulp.start('images:build');
    });
    //build fonts if change
    watch([path.src.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
});

// gulp
gulp.task('default', ['build', 'watch'], function () {
    livereload.listen();
});
