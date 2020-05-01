module.exports = {
    presets: [
        [require.resolve('@babel/preset-env'), {
            targets: {
                browsers: [
                    'last 2 chrome version',
                    'last 2 chromeandroid version',
                    'last 2 firefox version',
                    'last 2 firefoxandroid version',
                    'last 2 ios version',
                    'last 2 opera version',
                    'last 2 safari version',
                    'last 2 samsung version',
                    'last 2 ucandroid version'
                ]
            },
            exclude: [
                '@babel/plugin-transform-regenerator'
            ]
        }]
    ],
    plugins: [
        [require.resolve('@babel/plugin-proposal-class-properties')],
        [require.resolve('@babel/plugin-proposal-object-rest-spread')],
        [require.resolve('@babel/plugin-proposal-optional-chaining', {
            loose: true
        })],
        [require.resolve('@babel/plugin-transform-react-constant-elements')],
        [require.resolve('@babel/plugin-proposal-export-default-from')],
        [require.resolve('@babel/plugin-proposal-export-namespace-from')],
        [require.resolve('@babel/plugin-proposal-function-bind')],
        [require.resolve('@babel/plugin-syntax-dynamic-import')]
    ]
};