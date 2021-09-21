const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        port: 7701,
        historyApiFallback: true,
        open: true,
        devMiddleware: {
            index: 'index.html',
        },
        client: {
            overlay: true,
        },
        static: {
            directory: './example',
            watch: true,
        }
    },
});
