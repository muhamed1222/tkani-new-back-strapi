'use strict';

export default {
	config: {
		locales: ['ru', 'en'],
		tutorials: false,
		notifications: { releases: false },
	},
	bootstrap(app) {},
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


