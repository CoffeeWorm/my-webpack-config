const path = require('path');

module.exports = {
  contentBase: path.resolve(__dirname, './dist/'),
  port: 8070,
  watchContentBase: true,
  hot: true,
  quiet: false,
  stats: {
    modules: false,
    children: false,
    // 去掉 mini-css-extract-plugin 因为引入顺序而提示的 warnings
    warningsFilter: warning => /Conflicting order between/gm.test(warning) 
  },
  open: true,
  proxy: {},
  compress: true
};
