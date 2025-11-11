'use strict';

const { src, dest, series, parallel, watch } = require('gulp');
const { rm } = require('fs/promises');
const path = require('path');
const log = require('fancy-log');
const browserSync = require('browser-sync').create();
const gulpIf = require('gulp-if');
const sass = require('gulp-sass')(require('sass'));
const mediaqueries = require('gulp-group-css-media-queries');
const cssbeautify = require('gulp-cssbeautify');
const sourcemaps = require('gulp-sourcemaps');
const rigger = require('gulp-rigger');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const esbuild = require('esbuild');
const scssResets = require('scss-resets');
require('dotenv').config();

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null) {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
};

const toNumber = (value, fallback) => {
  if (value === undefined || value === null) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isProduction = process.env.NODE_ENV === 'production';
const isStrictLint = isProduction || process.argv.includes('--strict-lint');

const resetIncludePaths = Array.isArray(scssResets.includePaths)
  ? scssResets.includePaths.map((p) => path.resolve(p))
  : [];

const sassIncludePaths = [...resetIncludePaths, path.resolve(__dirname, 'node_modules')];

const cssbeautifyOptions = {
  indent: '  ',
  openbrace: 'end-of-line',
  autosemicolon: true
};

const sassBaseOptions = {
  includePaths: sassIncludePaths,
  quietDeps: true
};

const autoprefixerModule = require('gulp-autoprefixer');
const autoprefix = (options = {}) =>
  (typeof autoprefixerModule === 'function' ? autoprefixerModule : autoprefixerModule.default)(options);

const SRC_DIR = process.env.SRC_DIR || 'src';
const DIST_DIR = process.env.DIST_DIR || 'dist';

const srcRoot = SRC_DIR.replace(/\\/g, '/');
const distRoot = path.resolve(DIST_DIR);

const resolveDist = (...segments) => path.join(distRoot, ...segments);

const paths = {
  clean: distRoot,
  html: {
    src: `${srcRoot}/**/*.html`,
    dest: distRoot
  },
  fonts: {
    src: `${srcRoot}/fonts/**/*.*`,
    dest: resolveDist('fonts')
  },
  images: {
    src: `${srcRoot}/img/**/*.*`,
    dest: resolveDist('img')
  },
  styles: {
    scss: `${srcRoot}/css/scss/**/*.scss`,
    css: [`${srcRoot}/css/**/*.css`, `!${srcRoot}/css/vendor/**/*.css`],
    bootstrap: `${srcRoot}/css/vendor/bootstrap/bootstrap.scss`,
    bootstrapWatch: `${srcRoot}/css/vendor/bootstrap/**/*.scss`,
    dest: resolveDist('css'),
    bootstrapDest: resolveDist('css', 'vendor', 'bootstrap')
  },
  scripts: {
    dest: resolveDist('js'),
    js: {
      entry: `${srcRoot}/js/main.js`,
      all: [`${srcRoot}/js/**/*.js`, `!${srcRoot}/js/vendor/**/*`],
      vendor: `${srcRoot}/js/vendor/**/*`,
      vendorDest: resolveDist('js', 'vendor')
    },
    ts: {
      entry: `${srcRoot}/ts/main.ts`,
      all: `${srcRoot}/ts/**/*.ts`,
      vendor: `${srcRoot}/ts/vendor/**/*`,
      vendorDest: resolveDist('js', 'vendor')
    }
  },
  vendor: {
    jquery: {
      src: 'node_modules/jquery/dist/jquery.min.js',
      dest: resolveDist('js', 'vendor')
    },
    bootstrap: {
      files: [
        'node_modules/bootstrap/dist/js/bootstrap.js',
        'node_modules/bootstrap/dist/js/bootstrap.js.map'
      ],
      dest: resolveDist('js', 'vendor', 'bootstrap')
    }
  }
};

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

const plumberNotify = (title) =>
  plumber({
    errorHandler: notify.onError({
      title,
      message: '<%= error.message %>'
    })
  });

let imageminPlugin;
let eslintLib;

async function loadImagemin() {
  if (!imageminPlugin) {
    const module = await import('gulp-imagemin');
    imageminPlugin = module.default;
  }

  return imageminPlugin;
}

async function loadEslint() {
  if (!eslintLib) {
    try {
      const module = await import('eslint');
      eslintLib = module.ESLint ?? module;
    } catch (error) {
      log('[gulpfile] Optional dependency "eslint" is not installed. Skipping related tasks.');
      eslintLib = null;
    }
  }

  return eslintLib;
}

async function clean() {
  await rm(paths.clean, { recursive: true, force: true });
}

function html() {
  return src(paths.html.src)
    .pipe(plumberNotify('HTML'))
    .pipe(rigger())
    .pipe(dest(paths.html.dest))
    .pipe(browserSync.stream());
}

function fonts() {
  return src(paths.fonts.src, { allowEmpty: true })
    .pipe(dest(paths.fonts.dest))
    .pipe(browserSync.stream({ once: true }));
}

function css() {
  return src(paths.styles.css, { allowEmpty: true })
    .pipe(plumberNotify('CSS'))
    .pipe(
      autoprefix({
        cascade: false
      })
    )
    .pipe(mediaqueries())
    .pipe(gulpIf(!isProduction, cssbeautify(cssbeautifyOptions)))
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

function styles() {
  return src(paths.styles.scss, { allowEmpty: true })
    .pipe(plumberNotify('SCSS'))
    .pipe(gulpIf(!isProduction, sourcemaps.init()))
    .pipe(
      sass({
        ...sassBaseOptions,
        outputStyle: isProduction ? 'compressed' : 'expanded'
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefix({
        cascade: false
      })
    )
    .pipe(mediaqueries())
    .pipe(gulpIf(!isProduction, cssbeautify(cssbeautifyOptions)))
    .pipe(gulpIf(!isProduction, sourcemaps.write('.')))
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

function bootstrapStyles() {
  return src(paths.styles.bootstrap, { allowEmpty: true })
    .pipe(plumberNotify('Bootstrap SCSS'))
    .pipe(gulpIf(!isProduction, sourcemaps.init()))
    .pipe(
      sass({
        ...sassBaseOptions,
        outputStyle: 'compressed'
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefix({
        cascade: false
      })
    )
    .pipe(gulpIf(!isProduction, sourcemaps.write('.')))
    .pipe(dest(paths.styles.bootstrapDest))
    .pipe(browserSync.stream());
}

function vendorBootstrap() {
  return src(paths.vendor.bootstrap.files, { allowEmpty: true })
    .pipe(dest(paths.vendor.bootstrap.dest))
    .pipe(browserSync.stream({ once: true }));
}

function vendorJquery() {
  return src(paths.vendor.jquery.src)
    .pipe(dest(paths.vendor.jquery.dest))
    .pipe(browserSync.stream({ once: true }));
}

async function buildWithEsbuild(entryPoints, outfile) {
  try {
    await esbuild.build({
      entryPoints,
      bundle: true,
      outfile: path.join(paths.scripts.dest, outfile),
      platform: 'browser',
      target: 'es2018',
      format: 'iife',
      sourcemap: !isProduction,
      minify: isProduction,
      logLevel: 'silent'
    });
    browserSync.reload();
  } catch (error) {
    log.error('[esbuild]', error instanceof Error ? error.message : String(error));
    if (isStrictLint || isProduction) {
      throw error;
    }
  }
}

function scriptsJs() {
  return buildWithEsbuild([paths.scripts.js.entry], 'script.js');
}

function scriptsTs() {
  return buildWithEsbuild([paths.scripts.ts.entry], 'app.js');
}

function copyJsVendor() {
  return src(paths.scripts.js.vendor, { allowEmpty: true })
    .pipe(dest(paths.scripts.js.vendorDest))
    .pipe(browserSync.stream({ once: true }));
}

function copyTsVendor() {
  return src(paths.scripts.ts.vendor, { allowEmpty: true })
    .pipe(dest(paths.scripts.ts.vendorDest))
    .pipe(browserSync.stream({ once: true }));
}

async function images() {
  const imagemin = await loadImagemin();

  return src(paths.images.src, { allowEmpty: true })
    .pipe(plumberNotify('Images'))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true
      })
    )
    .pipe(dest(paths.images.dest))
    .pipe(browserSync.stream({ once: true }));
}

async function lintScripts() {
  const ESLint = await loadEslint();
  if (!ESLint) {
    return;
  }

  try {
    const eslint = new ESLint({
      fix: true
    });

    const lintTargets = [...paths.scripts.js.all, paths.scripts.ts.all];
    const results = await eslint.lintFiles(lintTargets);
    await ESLint.outputFixes(results);

    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    if (resultText) {
      log(resultText.trim());
    }

    const hasErrors = results.some((result) => result.errorCount > 0);

    if (hasErrors && isStrictLint) {
      throw new Error('ESLint errors detected.');
    }
  } catch (error) {
    if (isStrictLint) {
      throw error;
    }

    log.error('[eslint]', error instanceof Error ? error.message : String(error));
  }
}

const copyVendor = parallel(vendorJquery, vendorBootstrap);
const lint = parallel(lintScripts);

const build = series(
  clean,
  lint,
  parallel(
    html,
    styles,
    css,
    bootstrapStyles,
    scriptsJs,
    scriptsTs,
    copyJsVendor,
    copyTsVendor,
    fonts,
    images,
    copyVendor
  )
);

function serve(done) {
  const useProxy = toBool(process.env.BS_USE_PROXY, false);
  const host = process.env.BS_HOST || 'localhost';
  const port = toNumber(process.env.BS_PORT, 3000);
  const openMode = process.env.BS_OPEN || 'local';

  if (useProxy) {
    const proxy = process.env.BS_PROXY || 'http://localhost:3000';

    browserSync.init({
      proxy,
      host,
      port,
      open: openMode,
      notify: false
    });
  } else {
    const baseDir = process.env.BS_SERVER_BASE
      ? path.resolve(process.env.BS_SERVER_BASE)
      : distRoot;

    browserSync.init({
      server: {
        baseDir
      },
      host,
      port,
      open: openMode,
      notify: false
    });
  }

  done();
}

function watcher() {
  watch(paths.html.src, html);
  watch(paths.styles.scss, styles);
  watch(paths.styles.css, css);
  watch(paths.styles.bootstrapWatch, bootstrapStyles);
  watch(paths.scripts.js.all, scriptsJs);
  watch(paths.scripts.js.vendor, copyJsVendor);
  watch(paths.scripts.ts.all, scriptsTs);
  watch(paths.scripts.ts.vendor, copyTsVendor);
  watch(paths.fonts.src, fonts);
  watch(paths.images.src, images);
}

const dev = series(build, serve, watcher);

exports.clean = clean;
exports.lint = lint;
exports.lintScripts = lintScripts;
exports.serve = serve;
exports.scriptsJs = scriptsJs;
exports.scriptsTs = scriptsTs;
exports.copyJsVendor = copyJsVendor;
exports.copyTsVendor = copyTsVendor;
exports.build = build;
exports.dev = dev;
exports.default = dev;

