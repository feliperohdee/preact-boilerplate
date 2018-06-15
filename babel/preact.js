const babel = require('./');

module.exports = () => ({
    ...babel,
    plugins: babel.plugins.concat([
        [require.resolve('@babel/plugin-transform-react-jsx', {
            pragma: 'h'
        })],
        [require.resolve('babel-plugin-jsx-pragmatic'), {
            module: 'preact',
            export: 'h',
            import: 'h'
        }]
    ])
});