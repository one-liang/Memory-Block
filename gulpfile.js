var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence').use(gulp);

// production || development
// # gulp --env production
const envOptions = {
  string: 'env',
  default: { env: 'development' }
};
const options = minimist(process.argv.slice(2), envOptions);
console.log(options);

gulp.task('clean', () => {
  return gulp.src(['./public', './.tmp'], { read: false }) // 選項讀取：false阻止gulp讀取文件的內容，使此任務更快。
    .pipe($.clean());
});

gulp.task('copyHTML', function(){
  return gulp.src('./source/**/*.html')
    .pipe(gulp.dest('./public/'))
})

gulp.task('pug', function(){
  gulp.src('./source/**/*.pug')
    .pipe($.plumber())
    .pipe($.pug({
      pretty: true
    }))
    .pipe(gulp.dest('./public/'))
    // 編譯完伺服器自動存檔
    .pipe(browserSync.stream());
})

gulp.task('sass', function(){
  // 加前綴詞
  var plugins = [
    autoprefixer({browsers: ['last 3 version']})
  ];
  return gulp.src('./source/sass/**/*.sass')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass({ 
      outputStyle: 'nested'
    })
      .on('error', $.sass.logError))
    // 編譯完成css
    .pipe($.postcss(plugins))
    // production開發完，壓縮版本
    .pipe($.if(options.env === 'production', $.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    // 編譯完伺服器自動存檔
    .pipe(browserSync.stream());
})

gulp.task('babel', () =>
  gulp.src('./source/js/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel({
        presets: ['env']
    }))
    // 編譯完成js
    .pipe($.concat('main.js'))
    // 移除console
    // production開發完，壓縮版本
    .pipe(
      $.if(options.env === 'production', $.uglify({
        compress: {
          drop_console: true
        }
      }))
    )
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    // 編譯完伺服器自動存檔
    .pipe(browserSync.stream())
);

gulp.task('bower', function() {
  return gulp.src(mainBowerFiles())
      .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorJs', ['bower'], function () {
  return gulp.src([
    './.tmp/vendors/**/**.js'
  ])
  .pipe($.order([
    'jquery.js'
  ]))
  // 輸出完js
  .pipe($.concat('vendor.js'))
  // production開發完，壓縮版本
  .pipe($.if(options.env === 'production', $.uglify()))
  .pipe(gulp.dest('./public/js'))
})

// 建立伺服器
gulp.task('browser-sync', function () {
  browserSync.init({
    server: { baseDir: './public' },
    reloadDebounce: 2000
  })
});

// production版本才會壓縮，開發模式減少壓縮時間
gulp.task('imageMin', function () {
  gulp.src('./source/images/*')
    .pipe($.if(options.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./public/images'));
});

gulp.task('watch', function(){
  gulp.watch('./source/**/*.pug', ['pug']);
  gulp.watch('./source/sass/**/*.sass', ['sass']);
  gulp.watch('./source/js/**/*.js', ['babel']);
})

// gulp deploy 上傳public資料夾內容到github
gulp.task('deploy', function () {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});

// gulp build --env production 重新建立專案，交付版本
gulp.task('sequence', gulpSequence('clean', 'pug', 'sass', 'babel', 'vendorJs', 'imageMin'));

// 在gulp後不需再指定任務名稱
gulp.task('default', ['pug', 'sass', 'babel', 'vendorJs', 'browser-sync', 'imageMin', 'watch']);

gulp.task('build', ['sequence'])