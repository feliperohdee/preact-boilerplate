const path = require('path');
const HTMLPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const {
	BundleAnalyzerPlugin
} = require('webpack-bundle-analyzer');

module.exports = env => {
	const prod = env === 'production';
	const cssLoader = {
		loader: 'css-loader',
		options: {
			modules: true,
			localIdentName: '[local]__[hash:base64:5]',
			importLoaders: 1,
			sourceMap: !prod
		}
	};

	return {
		entry: './src',
		output: {
			path: path.join(__dirname, 'build'),
			filename: 'bundle.js'
		},
		module: {
			rules: [{
				test: /\.css$/,
				use: prod ? ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: cssLoader
				}) : [
					'style-loader',
					cssLoader
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
						['@babel/plugin-proposal-optional-chaining'],
						['@babel/plugin-transform-react-jsx', {
							pragma: 'h'
						}]
					]
				}
			}]
		},
		devtool: prod ? false : 'source-map',
		devServer: {
			contentBase: path.join(__dirname, 'src'),
			compress: true,
			historyApiFallback: true
		},
		plugins: [
			new ExtractTextPlugin('styles.css'),
			new HTMLPlugin({
				title: 'Caipira Food',
				minify: {},
				inlineSource: '.css$'
			})
		].concat(prod ? [
			// new BundleAnalyzerPlugin(),
			new HtmlWebpackInlineSourcePlugin(),
			new UglifyJsPlugin({
				exclude: [
					'./node_modules'
				]
			})
		] : [])
	};
};
