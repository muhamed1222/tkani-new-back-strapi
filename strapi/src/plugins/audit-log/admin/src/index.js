import { Initializer } from './Initializer';
import { PLUGIN_ID } from './constants';

export default {
  register(app) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: 'Audit Logs',
    });
  },
  bootstrap(app) {},
};
