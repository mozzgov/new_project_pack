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

gulp.task('html:build', function(done){
    return gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(livereload());
    done();
});
gulp.task('fonts:build', function(done) {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
    done();
});
gulp.task('css:build', function(done){
    return gulp.src(path.src.css)
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions' , 'ie >= 11'],
            cascade: false
        }))
        .pipe(mediaqueries())
        .pipe(cssbeautify({
            indent: '  ',
            openbrace: 'end-of-line',
            autosemicolon: true
        }))
        .pipe(gulp.dest(path.build.css))
        .pipe(livereload());
    done();
});
gulp.task('sass:build', function(done){
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
        .pipe(livereload());
    done();
});
gulp.task('js:build', function (done) {
    gulp.src(path.src.js)
        .pipe(gulp.dest(path.build.js))
        .pipe(livereload());
    done();
});
gulp.task('images:build', function(done) {
    return gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(livereload());
    done();
});

// gulp build
gulp.task('build', gulp.series(
    'html:build',
    'sass:build',
    'css:build',
    'js:build',
    'fonts:build',
    'images:build'
));

// gulp watch
gulp.task('watch', function(done){
    //build html if change
    gulp.watch([path.src.html], gulp.series('html:build'));
    //build css and scss if change
    gulp.watch([path.src.scss], gulp.series('sass:build'));
    gulp.watch([path.src.css], gulp.series('css:build'));
    //build js if change
    gulp.watch([path.src.js], gulp.series('js:build'));
    //build images if change
    gulp.watch([path.src.img], gulp.series('images:build'));
    //build fonts if change
    gulp.watch([path.src.fonts], gulp.series('fonts:build'));

    done();
});

// gulp
gulp.task('default', gulp.series('build', 'watch'), function () {
    livereload.listen();
});
