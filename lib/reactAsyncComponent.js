import { 
	createElement, 
	Component 
} from 'react';

export default function(load) {
	function Async() {
		Component.call(this);
		let done = child => {
			this.setState({
				child: (child && child.default) || child
			});
		};
		let r = load(done);
		if (r && r.then) r.then(done);
	}
	Async.prototype = new Component();
	Async.prototype.constructor = Async;
	Async.prototype.render = function() {
		if(!(this.state && this.state.child)) {
			return null;
		}
		
		return createElement(this.state.child, this.props);
	}
	return Async;
}
