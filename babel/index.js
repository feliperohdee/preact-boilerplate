module.exports = {
    presets: [
        [require.resolve('@babel/preset-env'), {
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
        [require.resolve('@babel/plugin-proposal-class-properties')],
        [require.resolve('@babel/plugin-proposal-object-rest-spread')],
        [require.resolve('@babel/plugin-proposal-optional-chaining', {
            loose: true
        })],
        [require.resolve('@babel/plugin-transform-react-constant-elements')],
        [require.resolve('@babel/plugin-proposal-export-default-from')],
        [require.resolve('@babel/plugin-proposal-export-namespace-from')],
        [require.resolve('@babel/plugin-proposal-function-bind')]
    ]
};