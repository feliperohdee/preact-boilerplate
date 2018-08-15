const _ = require('lodash');
const acorn = require('acorn');
const escodegen = require('escodegen');

function traverse(input) {
    if (_.isArray(input)) {
        input.forEach(traverse);
    } else if (_.isObject(input)) {
        for (let key in input) {
            if (typeof input[key] === 'string') {
                input[key] = input[key].replace(/(\n\s+)/g, ' ');
            } else {
                traverse(input[key]);
            }
        }
    }
}

module.exports = function(source) {
    this && this.cacheable && this.cacheable();
    const tree = acorn.parse(source, {
        sourceType: 'module'
    });
    traverse(tree);
    return escodegen.generate(tree);
};