/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WorkerPlugin = require('worker-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');

const TITLE = 'PAA Converter - Gruppe Adler';
const DESCRIPTION = 'Online converter for Arma 3\'s PAA format. Can be used to convert a single or multiple files in bulk and supports paa to png, png to paa, jpg to paa and more.';

module.exports = () => {
    return {
        entry: './src/index.ts',
        mode: 'production',
        target: 'es6',
        plugins: [
            new ESLintPlugin({ extensions: ['ts', 'js', 'tsx', 'jsx'] }),
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash:8].css',
                chunkFilename: '[id].[contenthash:8].css'
            }),
            new HtmlWebpackPlugin({
                template: './src/index.html',
                filename: 'index.html',
                title: TITLE,
                description: DESCRIPTION
            }),
            new WebpackPwaManifest({
                name: TITLE,
                short_name: 'GRAD PAA',
                description: DESCRIPTION,
                theme_color: '#000000',
                display: 'standalone',
                start_url: '.',
                background_color: '#000000',
                ios: true,
                filename: 'manifest.[hash:8].webmanifest',
                icons: [
                    {
                        src: path.resolve('src/assets/img/icons/android-chrome.png'),
                        destination: path.join('assets'),
                        sizes: [192, 512]
                    },
                    {
                        src: path.resolve('src/assets/img/icons/android-chrome-maskable.png'),
                        destination: path.join('assets'),
                        sizes: [192, 512],
                        purpose: 'maskable'
                    }
                ]
            }),
            new CopyWebpackPlugin({ patterns: [
                { from: 'public', to: '' }
            ] }),
            new WorkerPlugin(),
            new InjectManifest({
                swSrc: './src/service-worker.ts',
                exclude: [
                    /\.map$/
                ]
            })
        ],
        module: {
            rules: [
                {
                    test: /\.tsx?$/i,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.(scss|css)$/i,
                    use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
                    exclude: /node_modules/
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif|ico|woff2)$/i,
                    type: 'asset/resource'
                }
            ]
        },
        devServer: {
            port: 3000,
            contentBase: path.join(__dirname, 'dist'),
            host: '0.0.0.0'
        },
        resolve: {
            fallback: {
                stream: false,
                util: false,
                buffer: false
            },
            extensions: ['.tsx', '.ts', '.js', '.scss'],
            alias: {
                '@': path.resolve(__dirname, 'src/')
            }
        },
        output: {
            chunkFormat: 'commonjs',
            filename: '[name].[contenthash:8].js',
            path: path.resolve(__dirname, 'dist'),
            libraryTarget: 'umd',
            assetModuleFilename: 'assets/[name].[contenthash:8][ext][query]'
        }
    };
};
