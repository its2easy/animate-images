const webpack = require("webpack");
const { merge } = require('webpack-merge');
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const common = require('./webpack.common.js');
const banner = require("./banner");
const { TERSER_OPTIONS } = require( './shared');

module.exports = [
    merge(common, { // Minified
        mode: 'production',
        //devtool: 'source-map',
        optimization: {
            minimizer: [ // fix license.txt from bannerPlugin
                new TerserPlugin({
                    extractComments: false,
                    terserOptions: TERSER_OPTIONS
                }),
            ]
        },
        plugins: [
            new webpack.BannerPlugin(banner),
            new CleanWebpackPlugin(),
        ],
    }),
];
