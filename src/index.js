import {createApp} from './mimiact';
import {App} from './app'

createApp({ component: App, element: document.body, state: { count: 0 }, isDebug: true })
