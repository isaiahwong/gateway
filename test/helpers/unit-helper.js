import { defaultsDeep } from 'lodash';

import i18n from '../../src/libs/i18n';

export function generateRes(options = {}) {
  const defaultRes = {
    json: global.global.sandbox.stub(),
    redirect: global.sandbox.stub(),
    render: global.sandbox.stub(),
    send: global.sandbox.stub(),
    sendStatus: global.sandbox.stub().returnsThis(),
    set: global.sandbox.stub(),
    status: global.sandbox.stub().returnsThis(),
    t(string) {
      return i18n.t(string);
    },
  };

  return defaultsDeep(options, defaultRes);
}