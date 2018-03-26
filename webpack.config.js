const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const MakeDirWebpackPlugin = require('make-dir-webpack-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const {
	BundleAnalyzerPlugin
} = require('webpack-bundle-analyzer');

module.exports = (env = {}) => {
	const {
		analyze = false,
		dir,
		inlineCss = true,
		moduleCss = true,
		react = false,
		preload = true,
		prod = false,
		template,
		title = '',
		uglify = true
	} = env;

	const polyfillsExists = fs.existsSync(path.join(dir, 'polyfills'));
	const cssLoader = {
		loader: 'css-loader',
		options: {
			minimize: prod ? {
				discardComments: {
					removeAll: true
				}
			} : false,
			modules: moduleCss === true || moduleCss === 'true',
			localIdentName: prod ? '[hash:base64:5]' : '[local]__[hash:base64:5]',
			importLoaders: 5,
			sourceMap: !prod,
		}
	};

	const postCssLoader = {
		loader: 'postcss-loader',
		options: {
			ident: 'postcss',
			sourceMap: true,
			plugins: [
				autoprefixer({
					browsers: ['> 1%', 'IE >= 9', 'last 2 versions']
				})
			]
		}
	};

	const config = {
		entry: polyfillsExists ? {
			main: path.join(dir, 'src'),
			polyfills: path.join(dir, 'polyfills')
		} : {
			main: path.join(dir, 'src')
		},
		output: {
			path: path.join(dir, 'build'),
			filename: '[name].[hash].js'
		},
		resolve: {
			alias: {
				asyncComponent: react ? path.resolve(__dirname, './lib/reactAsyncComponent') : path.resolve(__dirname, './lib/preactAsyncComponent'),
				...react ? {
					'react$': path.resolve(dir, 'node_modules/react')
				} : {
					'preact$': path.resolve(dir, prod ? 'node_modules/preact/dist/preact.min.js' : 'node_modules/preact'),
					'h$': path.resolve(dir, prod ? 'node_modules/preact/dist/preact.min.js' : 'node_modules/preact/h'),
					'react': 'preact-compat',
					'react-dom': 'preact-compat',
					'create-react-class': 'preact-compat/lib/create-react-class',
				}
			}
		},
		resolveLoader: {
			alias: {
				async: path.resolve(__dirname, './lib/asyncComponentLoader')
			}
		},
		module: {
			rules: [{
				test: /\.css$/,
				use: prod ? ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						'css-loader',
						'resolve-url-loader'
					]
				}) : [
					'style-loader',
					'css-loader',
					'resolve-url-loader'
				]
			}, {
				test: /\.scss$/,
				use: prod ? ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						cssLoader,
						'resolve-url-loader',
						postCssLoader,
						'sass-loader'
					]
				}) : [
					'style-loader',
					cssLoader,
					'resolve-url-loader',
					postCssLoader,
					'sass-loader'
				]
			}, {
				test: /\.js$/,
				enforce: 'pre',
				exclude: /node_modules/,
				use: [{
					loader: 'eslint-loader',
					options: {
						root: true,
						parser: 'babel-eslint',
						plugins: ['import', 'jsx-a11y', 'react'],
						envs: [
							'browser',
							'commonjs',
							'es6',
							'node'
						],
						parserOptions: {
							ecmaVersion: 6,
							sourceType: 'module',
							ecmaFeatures: {
								jsx: true,
								generators: true,
								experimentalObjectRestSpread: true
							}
						},
						globals: [
							'PRODUCTION',
							'process',
						],
						rules: {
							// http://eslint.org/docs/rules/
							'array-callback-return': 'warn',
							'comma-dangle': ['warn', 'never'],
							'dot-location': ['warn', 'property'],
							'eqeqeq': ['warn', 'allow-null'],
							'new-parens': 'warn',
							'no-array-constructor': 'warn',
							'no-caller': 'warn',
							'no-cond-assign': ['warn', 'except-parens'],
							'no-const-assign': 'warn',
							'no-control-regex': 'warn',
							'no-delete-var': 'warn',
							'no-dupe-args': 'warn',
							'no-dupe-class-members': 'warn',
							'no-dupe-keys': 'warn',
							'no-duplicate-case': 'warn',
							'no-empty-character-class': 'warn',
							'no-empty-pattern': 'warn',
							'no-eval': 'warn',
							'no-ex-assign': 'warn',
							'no-extend-native': 'warn',
							'no-extra-bind': 'warn',
							'no-extra-label': 'warn',
							'no-fallthrough': 'warn',
							'no-func-assign': 'warn',
							'no-implied-eval': 'warn',
							'no-invalid-regexp': 'warn',
							'no-iterator': 'warn',
							'no-label-var': 'warn',
							'no-labels': ['warn', {
								allowLoop: true,
								allowSwitch: false
							}],
							'no-lone-blocks': 'warn',
							'no-loop-func': 'warn',
							'no-mixed-operators': [
								'warn', {
									groups: [
										['&', '|', '^', '~', '<<', '>>', '>>>'],
										['==', '!=', '===', '!==', '>', '>=', '<', '<='],
										['&&', '||'],
										['in', 'instanceof']
									],
									allowSamePrecedence: false
								},
							],
							'no-multi-str': 'warn',
							'no-multiple-empty-lines': ['warn', {
								max: 1
							}],
							'no-native-reassign': 'warn',
							'no-negated-in-lhs': 'warn',
							'no-new-func': 'warn',
							'no-new-object': 'warn',
							'no-new-symbol': 'warn',
							'no-new-wrappers': 'warn',
							'no-obj-calls': 'warn',
							'no-octal': 'warn',
							'no-octal-escape': 'warn',
							'no-redeclare': 'warn',
							'no-regex-spaces': 'warn',
							'no-restricted-syntax': ['warn', 'WithStatement'],
							'no-script-url': 'warn',
							'no-self-assign': 'warn',
							'no-self-compare': 'warn',
							'no-sequences': 'warn',
							'no-shadow-restricted-names': 'warn',
							'no-sparse-arrays': 'warn',
							'no-this-before-super': 'warn',
							'no-throw-literal': 'warn',
							'no-undef': 'warn',
							'no-restricted-globals': 'error',
							'no-unexpected-multiline': 'warn',
							'no-unreachable': 'warn',
							'no-unused-expressions': [
								'error', {
									allowShortCircuit: true,
									allowTernary: true,
									allowTaggedTemplates: true,
								}
							],
							'no-unused-labels': 'warn',
							'no-unused-vars': [
								'warn', {
									args: 'none',
									ignoreRestSiblings: true
								}
							],
							'no-use-before-define': [
								'warn', {
									functions: false,
									classes: false,
									variables: false
								}
							],
							'no-useless-computed-key': 'warn',
							'no-useless-concat': 'warn',
							'no-useless-constructor': 'warn',
							'no-useless-escape': 'warn',
							'no-useless-rename': [
								'warn', {
									ignoreDestructuring: false,
									ignoreImport: false,
									ignoreExport: false
								}
							],
							'no-with': 'warn',
							'no-whitespace-before-property': 'warn',
							'require-yield': 'warn',
							'semi': 'warn',
							'rest-spread-spacing': ['warn', 'never'],
							'strict': ['warn', 'never'],
							'unicode-bom': ['warn', 'never'],
							'use-isnan': 'warn',
							'valid-typeof': 'warn',
							'no-restricted-properties': [
								'error', {
									object: 'require',
									property: 'ensure',
									message: 'Please use import() instead. More info: https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#code-splitting',
								}, {
									object: 'System',
									property: 'import',
									message: 'Please use import() instead. More info: https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#code-splitting',
								}
							],
							'getter-return': 'warn',
							'quotes': ['warn', 'single', {
								allowTemplateLiterals: true
							}],
							// https://github.com/benmosher/eslint-plugin-import/tree/master/docs/rules
							'import/first': 'error',
							'import/no-amd': 'error',
							// https://github.com/yannickcr/eslint-plugin-react/tree/master/docs/rules
							'react/jsx-no-comment-textnodes': 'warn',
							'react/jsx-no-duplicate-props': ['warn', {
								ignoreCase: true
							}],
							'react/jsx-no-target-blank': 'warn',
							'react/jsx-no-undef': 'error',
							'react/jsx-pascal-case': [
								'warn', {
									allowAllCaps: true,
									ignore: [],
								}
							],
							'react/jsx-uses-react': 'warn',
							'react/jsx-uses-vars': 'warn',
							'react/no-danger-with-children': 'warn',
							'react/no-deprecated': 'warn',
							'react/no-direct-mutation-state': 'warn',
							'react/no-is-mounted': 'warn',
							'react/require-render-return': 'error',
							'react/style-prop-object': 'warn',
							// https://github.com/evcohen/eslint-plugin-jsx-a11y/tree/master/docs/rules
							'jsx-a11y/accessible-emoji': 'warn',
							'jsx-a11y/alt-text': 'warn',
							'jsx-a11y/anchor-has-content': 'warn',
							'jsx-a11y/anchor-is-valid': [
								'warn', {
									aspects: ['noHref', 'invalidHref']
								}
							],
							'jsx-a11y/aria-activedescendant-has-tabindex': 'warn',
							'jsx-a11y/aria-props': 'warn',
							'jsx-a11y/aria-proptypes': 'warn',
							'jsx-a11y/aria-role': 'warn',
							'jsx-a11y/aria-unsupported-elements': 'warn',
							'jsx-a11y/heading-has-content': 'warn',
							'jsx-a11y/iframe-has-title': 'warn',
							'jsx-a11y/img-redundant-alt': 'warn',
							'jsx-a11y/no-access-key': 'warn',
							'jsx-a11y/no-distracting-elements': 'warn',
							'jsx-a11y/no-redundant-roles': 'warn',
							'jsx-a11y/role-has-required-aria-props': 'warn',
							'jsx-a11y/role-supports-aria-props': 'warn',
							'jsx-a11y/scope': 'warn'
						}
					}
				}]
			}, {
				test: /\.js?/i,
				loader: 'babel-loader',
				options: {
					babelrc: false,
					presets: [
						['@babel/preset-env', {
							targets: {
								browsers: [
									'> 1%',
									'IE >= 9',
									'last 2 versions'
								]
							}
						}]
					],
					plugins: [
						['@babel/plugin-proposal-class-properties'],
						['@babel/plugin-proposal-object-rest-spread'],
						['@babel/plugin-proposal-optional-chaining', {
							loose: true
						}],
						['@babel/plugin-transform-react-jsx', {
							pragma: react ? 'createElement' : 'h'
						}],
						['babel-plugin-jsx-pragmatic', react ? {
							module: 'react',
							export: 'createElement',
							import: 'createElement'
						} : {
							module: 'preact',
							export: 'h',
							import: 'h'
						}],
						['@babel/plugin-transform-react-constant-elements'],
						['@babel/plugin-proposal-export-default-from'],
						['@babel/plugin-proposal-export-namespace-from']
					].concat(prod ? [
						'transform-react-remove-prop-types'
					] : [])
				}
			}, {
				test: /\.json$/,
				loader: 'json-loader'
			}, {
				test: /\.(xml|html|txt|md)$/,
				loader: 'raw-loader'
			}, {
				test: /\.(svg|woff2?|ttf|eot|jpe?g|png|gif|mp4|mov|ogg|webm|cur)(\?.*)?$/i,
				loader: prod ? 'file-loader' : 'url-loader',
				options: prod ? {
					outputPath: 'assets'
				} : {}
			}]
		},
		devtool: prod ? false : 'source-map',
		devServer: {
			port: process.env.PORT || 8080,
			host: process.env.HOST || '0.0.0.0',
			compress: false,
			contentBase: path.join(dir, 'src'),
			disableHostCheck: true,
			historyApiFallback: true,
			hot: true
		},
		plugins: [
			new ExtractTextPlugin('style.[hash:5].css'),
			new HTMLPlugin({
				title: decodeURIComponent(title),
				excludeAssets: [/(main|polyfills).*\.js$/],
				minify: {
					collapseWhitespace: true,
					removeScriptTypeAttributes: true,
					removeRedundantAttributes: true,
					removeStyleLinkTypeAttributes: true,
					removeComments: true
				},
				inlineSource: '.css$',
				template: template ? path.resolve(dir, template) : path.resolve(__dirname, './template.ejs')
			}),
			new HtmlWebpackExcludeAssetsPlugin(),
			new webpack.DefinePlugin({
				'PRODUCTION': prod,
				'process.env': {
					NODE_ENV: JSON.stringify(prod ? 'production' : 'development'),
				}
			})
		]
	};

	if (!prod) {
		config.plugins.push(
			new webpack.NamedModulesPlugin()
		);
	} else {
		if (analyze === true || analyze === 'true') {
			config.plugins.push(new BundleAnalyzerPlugin());
		}

		if (inlineCss === true || inlineCss === 'true') {
			config.plugins.push(new HtmlWebpackInlineSourcePlugin());
		}

		if (preload === true || preload === 'true') {
			config.plugins.push(new PreloadWebpackPlugin());
		}

		if (uglify === true || uglify === 'true') {
			config.plugins.push(new UglifyJsPlugin());
		}

		const assetsDir = path.join(dir, 'src/assets');

		if (fs.existsSync(assetsDir)) {
			config.plugins.push(
				new CopyWebpackPlugin([{
					from: assetsDir,
					to: path.join(dir, 'build/assets')
				}])
			);
		} else {
			config.plugins.push(
				new MakeDirWebpackPlugin({
					dirs: [{
						path: path.resolve(dir, 'build/assets')
					}]
				})
			);
		}
	}

	return config;
};
