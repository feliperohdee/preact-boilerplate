const babel = require('./');

module.exports = () => ({
    ...babel,
    plugins: babel.plugins.concat([
        [require.resolve('@babel/plugin-transform-react-jsx', {
            pragma: 'createElement'
        })],
        [require.resolve('babel-plugin-jsx-pragmatic'), {
            module: 'react',
            export: 'createElement',
            import: 'createElement'
        }]
    ])
});