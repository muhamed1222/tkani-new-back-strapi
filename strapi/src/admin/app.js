'use strict';

import customTheme from './customTheme';

export default {
	config: {
		locales: ['ru', 'en'],
		tutorials: false,
		notifications: { releases: false },
	},
	bootstrap(app) {
		// Применяем кастомную тему при загрузке админ-панели
		if (typeof window !== 'undefined') {
			// Ждем загрузки DOM
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', () => {
					customTheme.injectTheme();
				});
			} else {
				customTheme.injectTheme();
			}
			
			// Применяем тему после полной загрузки страницы
			window.addEventListener('load', () => {
				setTimeout(() => {
					customTheme.injectTheme();
				}, 100);
			});
		}
	},
	async registerTrads({ locales }) {
		const importedTrads = await Promise.all(
			locales.map((locale) => {
				if (locale !== 'ru') {
					return Promise.resolve({ data: {}, locale });
				}
				return import(/* webpackChunkName: "ru-translation" */ './translations/ru.json')
					.then(({ default: data }) => ({ data, locale }))
					.catch(() => ({ data: {}, locale }));
			})
		);
		return importedTrads;
	},
};


