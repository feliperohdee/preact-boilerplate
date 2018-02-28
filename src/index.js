import {
	h,
	render
} from 'preact';

import style from './index.css';

const a = {
	b: {
		c: 1
	}
};

const App = () => {
	return (
		<h1 class={style.a}>
			{a?.b?.c || 'not defidned'}
		</h1>
	);
}

render(<App />, document.body);
