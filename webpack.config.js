/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WorkerPlugin = require('worker-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = () => {
    return {
        entry: './src/index.ts',
        mode: 'production',
        target: 'es6',
        plugins: [
            new ESLintPlugin({ extensions: ['ts', 'js', 'tsx', 'jsx'] }),
            new MiniCssExtractPlugin(),
            new HtmlWebpackPlugin({ template: './src/index.html', filename: 'index.html' }),
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
                }
            ]
        },
        devServer: {
            port: 3000,
            contentBase: path.join(__dirname, 'dist')
        },
        resolve: {
            fallback: { stream: false },
            extensions: ['.tsx', '.ts', '.js', '.scss'],
            alias: {
                '@': path.resolve(__dirname, 'src/')
            }
        },
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
            libraryTarget: 'umd'
        }
    };
};
