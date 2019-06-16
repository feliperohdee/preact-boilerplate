const _ = require('lodash');
const loaderUtils = require('loader-utils');

module.exports.pitch = function(remainingRequest) {
	this.cacheable && this.cacheable();

	const query = loaderUtils.getOptions(this) || {};
	const routeName = typeof query.name === 'function' ? query.name(this.resourcePath) : null;
	const componentName = _.dropRight(_.last(this.resourcePath.split('/')), 3).join('');
	let name;
	if (routeName !== null) {
		name = routeName;
	} else if ('name' in query) {
		name = query.name;
	} else if ('formatName' in query) {
		name = query.formatName(this.resourcePath);
	}

	return `
		import Async from 'asyncComponent';

		function load(cb) {
			require.ensure([], function (require) {
				cb( require(${loaderUtils.stringifyRequest(this, '!!' + remainingRequest)}) );
			}${name ? ', ' + JSON.stringify(name) : ''});
		}

		export default Async(load, '${componentName}');
	`;
};
