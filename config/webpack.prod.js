const webpack = require("webpack");
const { merge } = require('webpack-merge');
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const common = require('./webpack.common.js');
const banner = require("./banner");

module.exports = [
    merge(common, { // Minified
        mode: 'production',
        //devtool: 'source-map',
        optimization: {
            minimizer: [ // fix license.txt from bannerPlugin
                new TerserPlugin({
                    extractComments: false,
                }),
            ]
        },
        plugins: [
            new webpack.BannerPlugin(banner),
            new CleanWebpackPlugin(),
        ],
    }),
];
