const _ = require('lodash');
const autoprefixer = require('autoprefixer');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');
const fs = require('fs');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const I18nWebpackPlugin = require('i18n-webpack-plugin');
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
const {
    StatsWriterPlugin
} = require('webpack-stats-plugin');

const babelPreact = require('./babel/preact');
const babelReact = require('./babel/react');
const browsers = require('./browsers');

module.exports = (env = {}) => {
    const PRODUCTION = process.env.NODE_ENV === 'production';

    env = _.defaults(env, {
        analyze: false,
        build: 'build',
        config: 'webpack.config.js',
        hashed: true,
        i18n: '',
        inlineCss: false,
        minimize: PRODUCTION,
        port: 8000,
        postCssConfig: false,
        publicPath: PRODUCTION ? '' : '/',
        src: 'src',
        react: false,
        title: '',
        vendors: true
    });

    env = _.reduce(env, (reduction, value, key) => {
        if (
            key === 'analyze' ||
            key === 'hashed' ||
            key === 'inlineCss' ||
            key === 'minimize' ||
            key === 'react' ||
            key === 'vendors'
        ) {
            value = value === true || value === 'true';
        }

        return {
            ...reduction,
            [key]: value
        };
    }, {});

    if (fs.existsSync(path.join(env.dir, 'postcss.config.js'))) {
        env.postCssConfig = 'postcss.config.js';
    }

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
            postcssOptions: {
                config: _.isString(env.postCssConfig) ? path.join(env.dir, env.postCssConfig) : env.postCssConfig,
                plugins: [
                    autoprefixer({
                        overrideBrowserslist: browsers
                    })
                ]
            },
            sourceMap: true
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

    const excludeAssets = [
        /(vendors|main|polyfills).*\.js/
    ];

    if (!env.inlineCss) {
        excludeAssets.push(/.*\.css/);
    }

    const babel = env.react ? babelReact() : babelPreact();
    const srcPath = fs.existsSync(path.join(env.dir, env.src)) ? env.src : '';
    const config = lang => {
        const config = {
            devServer: {
                port: env.port,
                host: 'localhost',
                compress: false,
                contentBase: path.join(env.dir, srcPath),
                disableHostCheck: true,
                historyApiFallback: true
            },
            devtool: PRODUCTION ? false : 'eval-cheap-source-map',
            entry: {
                main: path.join(env.dir, srcPath),
                ...polyfillsExists ? {
                    polyfills: path.join(env.dir, 'polyfills')
                } : {}
            },
            output: {
                path: path.join(env.dir, env.build),
                filename: env.hashed ? (lang ? `[name].[hash].${lang}.js` : '[name].[hash].js') : (lang ? `[name].${lang}.js?v=[hash]` : '[name].js?v=[hash]'),
                publicPath: env.publicPath
            },
            resolve: {
                alias: {
                    asyncComponent: env.react ? path.resolve(__dirname, './lib/reactAsyncComponent') : path.resolve(__dirname, './lib/preactAsyncComponent'),
                    ...env.react ? {
                        'react$': path.resolve(env.dir, 'node_modules/react')
                    } : {
                        'preact$': path.resolve(env.dir, 'node_modules/preact'),
                        'react': path.resolve(env.dir, 'node_modules/preact/compat'),
                        'react-dom': path.resolve(env.dir, 'node_modules/preact/compat')
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
                    use: [
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
                    ]
                }, {
                    test: /\.local\.(scss|css)$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        cssLoader,
                        'resolve-url-loader',
                        postCssLoader,
                        sassLoader
                    ]
                }, {
                    test: /\.jsx?$/,
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
                                'react',
                                'react-hooks',
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
                                'BROWSER',
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
                                // https://github.com/facebook/react/tree/master/packages/eslint-plugin-react-hooks
                                'react-hooks/rules-of-hooks': 'error',
                                'react-hooks/exhaustive-deps': 'warn',
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
                    test: /\.jsx?$/,
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        presets: babel.presets,
                        plugins: babel.plugins.concat(PRODUCTION ? [
                            'transform-react-remove-prop-types'
                        ] : [])
                    }
                }, {
                    test: /\.(xml|html|txt|md)$/,
                    loader: 'raw-loader'
                }, {
                    test: /\.(svg|woff2?|ttf|eot|jpe?g|png|gif|mp4|mov|ogg|webm|cur|mp3|mp4)(\?.*)?$/i,
                    loader: 'file-loader',
                    options: {
                        outputPath: 'assets',
                        publicPath: `${env.publicPath}assets`
                    }
                }]
            },
            optimization: {
                minimize: env.minimize,
                minimizer: env.minimize ? [
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
                splitChunks: env.vendors ? {
                    chunks: 'initial',
                    minSize: 30000,
                    maxSize: 0,
                    minChunks: 1,
                    maxAsyncRequests: 5,
                    maxInitialRequests: 3,
                    automaticNameDelimiter: '.',
                    automaticNameMaxLength: 30,
                    name: true,
                    cacheGroups: {
                        vendors: {
                            test: /[\\/]node_modules[\\/]/,
                            priority: -10
                        },
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true
                        }
                    }
                } : {}
            },
            plugins: [
                new webpack.NoEmitOnErrorsPlugin(),
                // Fix for https://github.com/webpack-contrib/mini-css-extract-plugin/issues/151
                new FixStyleOnlyEntriesPlugin(),
                new MiniCssExtractPlugin({
                    filename: env.hashed ? 'style.[hash].css' : 'style.css?v=[hash]',
                    chunkFilename: env.hashed ? '[id].[hash].chunk.css' : '[id].chunk.css?v=[hash]'
                }),
                new webpack.ProvidePlugin(env.react ? {
                    createElement: ['react', 'createElement']
                } : {
                    h: ['preact', 'h'],
                    Fragment: ['preact', 'Fragment']
                }),
                new HtmlWebpackPlugin({
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
                    'BROWSER': true,
                    'PRODUCTION': PRODUCTION,
                    ..._.reduce(process.env, (reduction, value, key) => {
                        if (
                            _.startsWith(key, 'APP_') ||
                            _.startsWith(key, 'NODE_')
                        ) {
                            reduction[`process.env.${key}`] = JSON.stringify(value);
                        }

                        return reduction;
                    }, {})
                }),
                new StatsWriterPlugin({
                    stats: {
                        all: true
                    },
                    transform: stats => {
                        const group = files => {
                            return _.groupBy(files, file => {
                                return path.extname(file)
                                    .replace(/\?.*/, '')
                                    .slice(1);
                            });
                        };

                        const async = new Set(_(stats.chunks)
                            .filter(chunk => {
                                return !chunk.initial;
                            })
                            .flatMap(chunk => {
                                return _.filter(chunk.files, file => {
                                    file = file.replace(/\?.*/, '');

                                    return (
                                        _.endsWith(file, '.css') ||
                                        _.endsWith(file, '.js') ||
                                        _.endsWith(file, '.json')
                                    );
                                });
                            }));

                        const assets = _.map(stats.assets, 'name')
                            .filter(asset => {
                                const _asset = asset.replace(/\?.*/, '');

                                return !async.has(asset) && (
                                    _.endsWith(_asset, '.css') ||
                                    _.endsWith(_asset, '.js') ||
                                    _.endsWith(_asset, '.json')
                                );
                            });

                        return JSON.stringify({
                            async: group(Array.from(async)),
                            assets: group(assets)
                        }, null, 2);
                    }
                })
            ]
        };

        config.plugins.push(
            new I18nWebpackPlugin(require(path.join(env.dir, lang ? `i18n/${lang}.json` : `i18n/en-us.json`)))
        );

        if (!PRODUCTION) {
            config.plugins.push(
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

            if (env.inlineCss) {
                config.plugins.push(new HtmlWebpackInlineSourcePlugin());
            }

            const assetsDir = path.join(env.dir, srcPath, 'assets');

            if (fs.existsSync(assetsDir)) {
                config.plugins.push(
                    new CopyWebpackPlugin({
                        patterns: [{
                            from: assetsDir,
                            to: path.join(env.dir, env.build, 'assets')
                        }]
                    })
                );
            } else {
                config.plugins.push(
                    new MakeDirWebpackPlugin({
                        dirs: [{
                            path: path.resolve(env.dir, env.build, 'assets')
                        }]
                    })
                );
            }
        }

        const webpackConfigExists = fs.existsSync(path.join(env.dir, env.config));

        if (webpackConfigExists) {
            return require(path.join(env.dir, env.config))(config, {
                env,
                lang: lang || ''
            });
        }

        return config;
    };

    if (env.i18n) {
        const configs = _.flatMap(env.i18n.split(','), lang => {
            return config(_.trim(lang));
        });

        if (_.size(configs) === 1) {
            return configs[0];
        }

        return configs;
    }

    return config();
};