import { render } from 'preact';
import './style.css';
import './screens.css';
import { App } from './app.jsx';
import { probe } from './lib/net.js';

const el = document.getElementById('app');
el.textContent = '';
render(<App />, el);
probe();
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol.startsWith('http')) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
