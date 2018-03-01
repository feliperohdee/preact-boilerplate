Lightweight preact boilerplate with support for inline CSS, automatic code splitting and async scripts.

		yarn add preact --dev preact-boilerplate
		
		## to build
		./node_modules/preact-boilerplate/run build 
			--env.title="Your%20Title" (required)
			--env.analyze true (optional, default: false) // launch webpack module analyzer
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
		
		## src/Main.js
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

		## src/AsyncComponent.js
		import {
			h,
			render
		} from 'preact';

		import image from './files/someImage.png';

		export default () => {
			return (
				<section>
					<h2>{PRODUCTION && 'production'} is production!</h2>
					<img src={image} class={style.image}/>
				</section>
			);
		};

		## output minified html w/ (google style) inline css, bundles and scripts to preload ASAP

		<!DOCTYPE html><html><head><meta charset="UTF-8"><title></title><link rel="preload" as="script" href="0.b952a.js"><style>._1P_ln{background-color:#d7006c;color:#fff}._1P_ln ._3bxXE{color:red;-webkit-box-shadow:none;box-shadow:none;border-radius:0}</style></head><body><script defer="defer" src="main.b952a.js"></script></body></html>

