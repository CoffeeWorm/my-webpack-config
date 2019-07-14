const path = require('path');
const os = require('os');
const {
  NamedModulesPlugin,
  HotModuleReplacementPlugin,
  IgnorePlugin
} = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const copyWebpackPlugin = require('copy-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const HappyPack = require('happypack');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const devServer = require('./devserver');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const { devMode } = process.env;

const insertHash = (url, hash = '[hash:8]') => {
  if (devMode) {
    return url;
  }
  const regArr = [/\[name\]/, /\./];

  for (let reg of regArr) {
    if (reg.test(url)) {
      url = url.replace(reg, $1 => `${$1}.${hash}`);
      break;
    }
  }
  return url;
};

module.exports = {
  devtool: devMode ? 'cheap-module-eval-source-map' : 'source-map',
  mode: devMode ? 'development' : 'production',
  entry: { index: path.resolve(__dirname, './src/index.js') },
  output: {
    filename: insertHash('static/js/[name].js'),
    chunkFilename: insertHash('static/js/[name].chunk.js'),
    path: path.resolve(__dirname, './build'),
    publicPath: '/'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.json', '.jsx'],
    alias: {}
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: path.resolve(__dirname, './src/'),
        exclude: /node_modules/,
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          eslintPath: 'eslint'
        }
      },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: 'url-loader',
            options: {
              limit: 10 * 1024,
              name: insertHash('static/media/[name].[ext]')
            }
          },
          {
            test: /\.jsx?$/,
            include: path.resolve(__dirname, './src/'),
            exclude: /node_modules/,
            loader: 'happypack/loader?id=js'
          },
          {
            test: /\.(le)|(c)ss?$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: { hmr: devMode }
              },
              'happypack/loader?id=style'
            ]
          },
          {
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: 'file-loader',
            options: {
              name: insertHash('static/media/[name].[ext]')
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
      minify: devMode && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    // 忽略 moment 的本地化内容
    // https://www.webpackjs.com/plugins/ignore-plugin/
    new IgnorePlugin(/^\.\/locale$/, /moment$/),
    new MiniCssExtractPlugin({
      filename: insertHash('static/css/[name].css'),
      chunkFilename: insertHash('static/css/[name].css')
    }),
    new HappyPack({
      id: 'js',
      loaders: [
        {
          loader: 'babel-loader',
          options: { cacheDirectory: true }
        }
      ],
      threadPool: happyThreadPool,
      verbose: false
    }),
    new HappyPack({
      id: 'style',
      loaders: [
        'css-loader',
        'postcss-loader',
        {
          loader: 'less-loader',
          options: {
            javascriptEnabled: true
          }
        }
      ],
      threadPool: happyThreadPool,
      verbose: false
    }),
    new copyWebpackPlugin([
      {
        from: path.resolve(__dirname, './public'),
        to: path.resolve(__dirname, './build'),
        ignore: 'index.html'
      }
    ])
  ].concat(
    devMode
      ? [
          // 当开启 HMR 的时候使用该插件会显示模块的相对路径，建议用于开发环境。
          new NamedModulesPlugin(),
          // HMR
          new HotModuleReplacementPlugin(),
          // 提示由于路径大小写问题的错误路径
          new CaseSensitivePathsPlugin()
        ]
      : [new LodashModuleReplacementPlugin(), new CleanWebpackPlugin()],
    // Analyze the package size .
    process.analysis ? [new BundleAnalyzerPlugin()] : []
  ),
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },
  devServer: devMode ? devServer : {},
  optimization: !devMode
    ? {
        splitChunks: {
          chunks: 'all',
          minSize: 30000,
          minChunks: 2,
          maxAsyncRequests: 5,
          maxInitialRequests: 3,
          automaticNameDelimiter: '-',
          name: true,
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10
            },
            default: {
              priority: -20,
              reuseExistingChunk: true
            }
          }
        },
        minimizer: [
          new OptimizeCSSAssetsPlugin({}),
          new UglifyJsPlugin({
            test: /\.jsx?$/,
            cache: true,
            sourceMap: true,
            parallel: true
          })
        ]
      }
    : {}
};
