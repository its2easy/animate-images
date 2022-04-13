import { defineConfig } from 'rollup';
import { terser } from "rollup-plugin-terser";
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import bundleSize from 'rollup-plugin-bundle-size';
import dts from "rollup-plugin-dts";

const banner = require("./banner");
const bannerWithComments = "/*!\n" + banner + "\n*/";
const { LIB_FILE_NAME } = require( './shared');

const terserOptions = {
    // mangle: {
    //     properties: {
    //          regex: /^_/,
    //     }
    // },
}

export default defineConfig([
    { // Transpiled bundle
        input: `./src/index.js`,
        plugins: [
            nodeResolve(),
            commonjs(),
            babel({
                babelHelpers: 'bundled',
                exclude: "node_modules/**"
            }),
            bundleSize()
        ],
        output: [
            {
                file: `./build/${LIB_FILE_NAME}.esm.js`,
                format: 'es',
                banner: bannerWithComments,
                sourcemap: true,
            },
            {
                file: `./build/${LIB_FILE_NAME}.esm.min.js`,
                format: 'es',
                banner: bannerWithComments,
                sourcemap: true,
                plugins: [ terser(terserOptions) ]
            }
        ],
    },
    { // Untranspiled bundle
        input: `./src/index.js`,
        plugins: [
            bundleSize()
        ],
        output: [
            {
                file: `./build/untranspiled/${LIB_FILE_NAME}.esm.js`,
                format: 'es',
                banner: bannerWithComments,
                sourcemap: true,
            },
            {
                file: `./build/untranspiled/${LIB_FILE_NAME}.esm.min.js`,
                format: 'es',
                banner: bannerWithComments,
                sourcemap: true,
                plugins: [ terser(terserOptions) ]
            }
        ],
    },
    { // bundle types to hide internal modules, because @internal is not recommended in ts docs
        input: "./types/index.d.ts",
        output: [{ file: `types/${LIB_FILE_NAME}.d.ts`, format: "es" }],
        plugins: [dts()],
    },
]);
