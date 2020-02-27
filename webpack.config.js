const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry:'./src/public/index.js',
    module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: ['babel-loader']
          }
        ]
      },
    mode: 'development',
    watch:true
}