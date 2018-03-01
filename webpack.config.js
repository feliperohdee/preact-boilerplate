const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const {
	BundleAnalyzerPlugin
} = require('webpack-bundle-analyzer');

module.exports = (env = {}) => {
	const {
		dir,
		prod = false,
		title = '',
		analyze = false
	} = env;

	const cssLoader = {
		loader: 'css-loader',
		options: {
			modules: true,
			localIdentName: prod ? '[hash:base64:5]' : '[local]__[hash:base64:5]',
			importLoaders: 1,
			sourceMap: !prod
		}
	};

	const postCssLoader = {
		loader: 'postcss-loader',
		options: {
			ident: 'postcss',
			sourceMap: true,
			plugins: [autoprefixer({
				browsers: [
					'> 1%',
					'IE >= 9',
					'last 2 versions'
				]
			})]
		}
	};

	const config = {
		entry: path.join(dir, 'src'),
		output: {
			path: path.join(dir, 'build'),
			filename: '[name].[hash:5].js'
		},
		resolve: {
			alias: {
				'asyncComponent': path.resolve(__dirname, './lib/asyncComponent'),
				'preact$': path.resolve(__dirname, prod ? 'node_modules/preact/dist/preact.min.js' : 'node_modules/preact'),
			}
		},
		resolveLoader: {
			alias: {
				async: path.resolve(__dirname, './lib/asyncComponentLoader')
			}
		},
		module: {
			rules: [{
				test: /\.css|\.scss$/,
				use: prod ? ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						cssLoader,
						postCssLoader,
						'sass-loader'
					]
				}) : [
					'style-loader',
					cssLoader,
					postCssLoader,
					'sass-loader'
				]
			}, {
				test: /\.js?/i,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: {
					babelrc: false,
					presets: [
						['@babel/preset-env', {
							'targets': {
								'browsers': [
									'> 1%',
									'IE >= 9',
									'last 2 versions'
								]
							}
						}]
					],
					plugins: [
						['@babel/plugin-proposal-optional-chaining', {
							loose: true
						}],
						['@babel/plugin-transform-react-jsx', {
							pragma: 'h'
						}]
					]
				}
			}, {
				test: /\.json$/,
				loader: 'json-loader'
			}, {
				test: /\.(xml|html|txt|md)$/,
				loader: 'raw-loader'
			}, {
				test: /\.(svg|woff2?|ttf|eot|jpe?g|png|gif|mp4|mov|ogg|webm)(\?.*)?$/i,
				loader: prod ? 'file-loader' : 'url-loader',
				options: prod ? {
					outputPath: 'assets'
				} : {}
			}]
		},
		devtool: prod ? false : 'source-map',
		devServer: {
			contentBase: path.join(dir, 'src'),
			compress: true,
			historyApiFallback: true
		},
		plugins: [
			new ExtractTextPlugin('style.[hash:5].css'),
			new HTMLPlugin({
				title,
				minify: {
					collapseWhitespace: true,
					removeScriptTypeAttributes: true,
					removeRedundantAttributes: true,
					removeStyleLinkTypeAttributes: true,
					removeComments: true
				},
				inlineSource: '.css$'
			}),
			new webpack.DefinePlugin({
				PRODUCTION: prod
			})
		].concat(prod ? [
			new HtmlWebpackInlineSourcePlugin(),
			new UglifyJsPlugin()
		] : [])
	};

	if(analyze) {
		config.plugins.push(new BundleAnalyzerPlugin());
	}

	return config;
};
