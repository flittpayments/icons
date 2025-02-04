const { task, src, dest, series, parallel } = require('gulp')
const svgo = require('./gulp-svgo.js')
const addViewBox = require('./svgo-add-viewbox.js')
const fsp = require('fs').promises
const argv = require('minimist')(process.argv.slice(2))

const svgPath = 'src/**/*.svg'
const allPath = [
  'src/banks/*.svg',
  'src/card/*.svg',
  'src/crypto/*.svg',
  'src/emoney/*.svg',
  'src/installments/*.svg',
  'src/wallets/*.svg',
]

const svgoConfig = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          inlineStyles: false,
        },
      },
    },
    'convertStyleToAttrs',
    addViewBox,
    {
      name: 'removeAttrs',
      params: {
        attrs: [
          'svg_(version|x|y|id|fill|xml:space)',
          'data-name',
          'path_fill-rule_nonzero',
        ],
        elemSeparator: '_',
      },
    },
    {
      name: 'cleanupIds',
      params: {
        minify: false,
        force: true,
      },
    },
    {
      name: 'inlineStyles',
      params: {
        onlyMatchedOnce: false,
      },
    },
    {
      name: 'mergePaths',
      params: {
        force: true,
      },
    },
  ],
}

const compressSvg = (path, out) =>
  src(path).pipe(svgo(svgoConfig)).pipe(dest(out))

task('svg', () => compressSvg(svgPath, 'dist/svg'))

task('svg:src', () =>
  src(allPath)
    .pipe(svgo(svgoConfig))
    .pipe(
      dest(function (file) {
        return file.base
      })
    )
)

task('favicon', () =>
  src('src/favicon/**/*', { encoding: false }).pipe(dest('dist/favicon'))
)

task('fonts', () =>
  src('src/fonts/**/*', { encoding: false }).pipe(dest('dist/fonts'))
)

task('flags', () =>
  compressSvg('node_modules/flag-icons/flags/4x3/*.svg', 'dist/svg/flags')
)

task('version', () =>
  Promise.all([
    fsp.writeFile('dist/version.txt', argv?.version || ''),
    fsp.writeFile('dist/build-date.txt', new Date().toUTCString()),
  ])
)

task('clean', () =>
  fsp
    .rm('dist/', { recursive: true, force: true })
    .then(() => fsp.mkdir('dist/'))
)

task('all', () => compressSvg(allPath, 'dist/all/svg'))

task(
  'default',
  series(
    'clean',
    parallel('version', 'svg', 'favicon', 'fonts', 'flags', 'all')
  )
)
