const _ = require('lodash');
const autoprefixer = require('autoprefixer');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');
const fs = require('fs');
const HTMLPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const I18nPlugin = require('i18n-webpack-plugin');
const MakeDirWebpackPlugin = require('make-dir-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const path = require('path');
const ReplacePlugin = require('webpack-plugin-replace');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const {
    BundleAnalyzerPlugin
} = require('webpack-bundle-analyzer');

const babelPreact = require('./babel/preact');
const babelReact = require('./babel/react');

module.exports = (env = {}) => {
    env = _.defaults(env, {
        analyze: false,
        inlineCss: true,
        inlineJs: false,
        i18n: '',
        port: 8000,
        publicPath: '/',
        react: false,
        title: ''
    });

    env = _.reduce(env, (reduction, value, key) => {
        if (
            key === 'analyze' ||
            key === 'inlineCss' ||
            key === 'inlineJs' ||
            key === 'react'
        ) {
            value = value === true || value === 'true';
        }

        return {
            ...reduction,
            [key]: value
        };
    }, {});

    const PRODUCTION = process.env.NODE_ENV === 'production';
    const polyfillsExists = fs.existsSync(path.join(env.dir, 'polyfills'));
    const cssLoader = {
        loader: 'css-loader',
        options: {
            importLoaders: 5,
            modules: {
                mode: 'local',
                localIdentName: PRODUCTION ? '[hash:base64:5]' : '[local]__[hash:base64:5]'
            },
            sourceMap: !PRODUCTION
        }
    };

    const postCssLoader = {
        loader: 'postcss-loader',
        options: {
            ident: 'postcss',
            sourceMap: true,
            plugins: [
                autoprefixer({
                    overrideBrowserslist: ['> 1%', 'IE >= 9', 'last 2 versions']
                })
            ]
        }
    };

    const sassLoader = {
        loader: 'sass-loader',
        options: {
            sassOptions: {
                includePaths: [
                    path.resolve(env.dir, 'node_modules')
                ]
            }
        }
    };

    const excludeAssets = [];

    if (env.inlineJs) {
        excludeAssets.push(/(polyfills).*\.js$/);
    } else {
        excludeAssets.push(/(main|polyfills).*\.js$/);
    }

    if (!env.inlineCss) {
        excludeAssets.push(/.*\.css$/);
    }

    const babel = env.react ? babelReact() : babelPreact();
    const config = lang => {
        const config = {
            devServer: {
                port: env.port,
                host: '0.0.0.0',
                compress: false,
                contentBase: path.join(env.dir, 'src'),
                disableHostCheck: true,
                historyApiFallback: true
            },
            devtool: PRODUCTION ? false : 'source-map',
            entry: polyfillsExists ? {
                main: path.join(env.dir, 'src'),
                polyfills: path.join(env.dir, 'polyfills')
            } : {
                main: path.join(env.dir, 'src')
            },
            output: {
                path: path.join(env.dir, 'build'),
                filename: lang ? `[name].[hash].${lang}.js` : '[name].[hash].js',
                publicPath: env.publicPath
            },
            resolve: {
                alias: {
                    asyncComponent: env.react ? path.resolve(__dirname, './lib/reactAsyncComponent') : path.resolve(__dirname, './lib/preactAsyncComponent'),
                    ...env.react ? {
                        'react$': path.resolve(env.dir, 'node_modules/react')
                    } : {
                        'preact$': path.resolve(env.dir, PRODUCTION ? 'node_modules/preact/dist/preact.min.js' : 'node_modules/preact'),
                        'h$': path.resolve(env.dir, PRODUCTION ? 'node_modules/preact/dist/preact.min.js' : 'node_modules/preact/h'),
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
            mode: PRODUCTION ? 'production' : 'development',
            module: {
                rules: [{
                    test: /^((?!\.?local).)*(scss|css)$/,
                    use: PRODUCTION ? [
                        MiniCssExtractPlugin.loader, {
                            ...cssLoader,
                            options: {
                                ...cssLoader.options,
                                modules: false
                            }
                        },
                        'resolve-url-loader',
                        postCssLoader,
                        sassLoader
                    ] : [
                        'style-loader', {
                            ...cssLoader,
                            options: {
                                ...cssLoader.options,
                                modules: false
                            }
                        },
                        'resolve-url-loader',
                        postCssLoader,
                        sassLoader
                    ]
                }, {
                    test: /\.local\.(scss|css)$/,
                    use: PRODUCTION ? [
                        MiniCssExtractPlugin.loader,
                        cssLoader,
                        'resolve-url-loader',
                        postCssLoader,
                        sassLoader
                    ] : [
                        'style-loader',
                        cssLoader,
                        'resolve-url-loader',
                        postCssLoader,
                        sassLoader
                    ]
                }, {
                    test: /\.js$/,
                    enforce: 'pre',
                    exclude: /node_modules/,
                    use: [{
                        loader: 'eslint-loader',
                        options: {
                            baseConfig: {
                                settings: {
                                    react: {
                                        version: env.react ? 'detect' : 'preact'
                                    }
                                }
                            },
                            root: true,
                            parser: 'babel-eslint',
                            plugins: [
                                'import',
                                'jsx-a11y',
                                'react'
                            ],
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
                                '__',
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
                        presets: babel.presets,
                        plugins: babel.plugins.concat(PRODUCTION ? [
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
                    test: /\.(svg|woff2?|ttf|eot|jpe?g|png|gif|mp4|mov|ogg|webm|cur|mp3|mp4)(\?.*)?$/i,
                    loader: 'file-loader',
                    options: PRODUCTION ? {
                        outputPath: 'assets',
                        publicPath: `${env.publicPath}assets`
                    } : {}
                }]
            },
            optimization: {
                minimizer: PRODUCTION ? [
                    new TerserPlugin({
                        cache: true,
                        parallel: true,
                        terserOptions: {
                            output: {
                                comments: false
                            },
                            mangle: true,
                            compress: {
                                keep_fargs: false,
                                pure_getters: true,
                                hoist_funs: true,
                                pure_funcs: [
                                    'classCallCheck',
                                    '_classCallCheck',
                                    '_possibleConstructorReturn',
                                    'Object.freeze',
                                    'invariant',
                                    'warning'
                                ],
                            },
                        },
                        sourceMap: true
                    }),
                    new OptimizeCssAssetsPlugin({
                        cssProcessorOptions: {
                            discardComments: {
                                removeAll: true
                            },
                            // Fix keyframes in different CSS chunks minifying to colliding names:
                            reduceIdents: false
                        }
                    })
                ] : [],
                splitChunks: {
                    minChunks: 3
                }
            },
            plugins: [
                new webpack.NoEmitOnErrorsPlugin(),
                // Fix for https://github.com/webpack-contrib/mini-css-extract-plugin/issues/151
                new FixStyleOnlyEntriesPlugin(),
                new MiniCssExtractPlugin({
                    filename: 'style.[hash].css',
                    chunkFilename: 'style.[hash].chunk.css'
                }),
                new webpack.ProvidePlugin(env.react ? {
                    createElement: ['react', 'createElement']
                } : {
                    h: ['preact', 'h'],
                    Fragment: ['preact', 'Fragment']
                }),
                new HTMLPlugin({
                    filename: PRODUCTION && lang ? `index.${lang}.html` : 'index.html',
                    title: decodeURIComponent(env.title),
                    excludeAssets,
                    minify: {
                        collapseWhitespace: true,
                        removeScriptTypeAttributes: true,
                        removeRedundantAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        removeComments: true
                    },
                    template: env.template ? path.resolve(env.dir, env.template) : path.resolve(__dirname, './template.ejs'),
                    inlineSource: '.(js|css)$',
                    env: {
                        ...env,
                        lang: lang || ''
                    }
                }),
                new HtmlWebpackExcludeAssetsPlugin(),
                new webpack.DefinePlugin({
                    'PRODUCTION': PRODUCTION,
                    ..._.reduce(process.env, (reduction, value, key) => {
                        if (_.startsWith(key, 'NODE_')) {
                            reduction[`process.env.${key}`] = JSON.stringify(value);
                        }

                        return reduction;
                    }, {})
                })
            ]
        };

        if (lang) {
            config.plugins.push(
                new I18nPlugin(require(path.join(env.dir, `i18n/${lang}.json`)))
            );
        }

        if (!PRODUCTION) {
            config.plugins.push(
                new webpack.optimize.ModuleConcatenationPlugin(),
                new webpack.NamedModulesPlugin(),
                // strip out babel-helper invariant checks
                new ReplacePlugin({
                    include: /babel-helper$/,
                    patterns: [{
                        regex: /throw\s+(new\s+)?(Type|Reference)?Error\s*\(/g,
                        value: s => `return;${ Array(s.length-7).join(' ') }(`
                    }]
                })
            );
        } else {
            if (env.analyze) {
                config.plugins.push(new BundleAnalyzerPlugin());
            }

            if (env.inlineCss || env.inlineJs) {
                config.plugins.push(new HtmlWebpackInlineSourcePlugin());
            }

            const assetsDir = path.join(env.dir, 'src/assets');

            if (fs.existsSync(assetsDir)) {
                config.plugins.push(
                    new CopyWebpackPlugin([{
                        from: assetsDir,
                        to: path.join(env.dir, 'build/assets')
                    }])
                );
            } else {
                config.plugins.push(
                    new MakeDirWebpackPlugin({
                        dirs: [{
                            path: path.resolve(env.dir, 'build/assets')
                        }]
                    })
                );
            }
        }

        return config;
    };

    if (env.i18n) {
        return _.map(env.i18n.split(','), config);
    }

    return config();
};