Lightweight preact boilerplate with support for inline CSS, automatic code splitting and async scripts.

		yarn add preact --dev preact-boilerplate
		
		## to build
		./node_modules/preact-boilerplate/run build 
			--env.title="Your%20Title" (required)
			--env.analyze true (optional, default: false) // lauch webpack module analyzer
			--env.preload true (optional, default: true) // preload async scripts
			--env.uglify true (optional, default: true)
			--env.template {string} (optional)
		
		## to dev
		./node_modules/preact-boilerplate/run dev 
			--env.title="Your%20Title"

		## sample
		
		import style from './index.scss';
		import {
			h,
			render
		} from 'preact';

		import AsyncComponent from 'async!./AsyncComponent';

		const a = {
			b: {
				c: {
					d: value => value
				}
			}
		};

		const App = () => {
			return (
				<h1 class={style.a}>
					{a.b?.c?.d?.('hi') || 'not defined'}
				</h1>
			);
		}

		render(<AsyncComponent />, document.body);
