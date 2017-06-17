'use strict';
const path = require('path');
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const gulpChanged = require('gulp-changed');
// TypeScript
const gulpTS = require('gulp-typescript');
const gulpTSlint = require('gulp-tslint');
const typescript = require('typescript');
// Rollup
const rollup = require('rollup');
const rollupStream = require('rollup-stream');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge2 = require('merge2');
const del = require('del');

const uglify = require('gulp-uglify');

const LIB_DIR = "lib/";
const TS_DIST_LIB = "dist-es2015/";
const DIST_DECLARATION = "";
const DIST_LIB = "dist/";
const BUNDLE_MODULE_NAME = "Gosencho";
const BUNDLE_NAME = "bundle.js";
const BUNDLE_NAME2 = "page.js";

const PRODUCTION = process.env.NODE_ENV === 'production';

{
  const tsProj = gulpTS.createProject('tsconfig.json', {
    typescript,
  });
  gulp.task('tsc', ()=>{
    const rs = gulp.src(path.join(LIB_DIR, '**', '*.ts{,x}'))
    .pipe(sourcemaps.init())
    .pipe(tsProj());

    if (DIST_DECLARATION){
      return merge2(
        rs.js.pipe(sourcemaps.write()).pipe(gulp.dest(TS_DIST_LIB)),
        rs.dts.pipe(gulp.dest(DIST_DECLARATION))
      );
    }else{
      return rs.js.pipe(sourcemaps.write()).pipe(gulp.dest(TS_DIST_LIB));
    }
  });
  gulp.task('watch-tsc', ['tsc'], ()=>{
    gulp.watch(path.join(LIB_DIR, '**', '*.ts{,x}'), ['tsc']);
  });
  gulp.task('tslint', ()=>{
    return gulp.src(path.join(LIB_DIR, '**', '*.ts{,x}'))
    .pipe(gulpTSlint({
      formatter: 'verbose',
    }))
    .pipe(gulpTSlint.report());
  });
  gulp.task('watch-tslint', ['tslint'], ()=>{
    gulp.watch(path.join(LIB_DIR, '**', '*.ts{,x}'), ['tslint']);
  });
}
{
  let rollupCacheMain, rollupCachePage;
  function runRollup(){
    let main = rollupStream({
      entry: path.join(TS_DIST_LIB, 'index.js'),
      format: 'umd',
      moduleName: BUNDLE_MODULE_NAME,
      sourceMap: 'inline',
      rollup,
      cache: rollupCacheMain,
    })
    .on('bundle', bundle=> rollupCacheMain = bundle)
    .pipe(source(BUNDLE_NAME));

    if (PRODUCTION){
      main = main.pipe(buffer()).pipe(uglify());
    }
    main = main.pipe(gulp.dest(DIST_LIB));

    let page = rollupStream({
      entry: path.join(TS_DIST_LIB, 'page.js'),
      sourceMap: 'inline',
      format: 'es',
      rollup,
      cache: rollupCachePage,
    })
    .on('bundle', bundle=> rollupCachePage = bundle)
    .pipe(source(BUNDLE_NAME2));

    if (PRODUCTION){
      page = page.pipe(buffer()).pipe(uglify());
    }
    page = page.pipe(gulp.dest(DIST_LIB));

    return merge2(main, page);
  }
  gulp.task('bundle-main', ()=>{
    return runRollup();
  });
  gulp.task('bundle', ['tsc'], ()=>{
    return runRollup();
  });
  gulp.task('watch-bundle', ['bundle'], ()=>{
    gulp.watch(path.join(TS_DIST_LIB, '**', '*.js'), ['bundle-main']);
  });
}
{
  gulp.task('clean', ()=>{
    const del_target = [DIST_LIB, TS_DIST_LIB];
    if (DIST_DECLARATION){
      del_target.push(DIST_DECLARATION);
    }
    return del(del_target);
  });
}
gulp.task('default', ['tsc', 'tslint', 'bundle']);
gulp.task('watch', ['watch-tsc', 'watch-tslint', 'watch-bundle']);
