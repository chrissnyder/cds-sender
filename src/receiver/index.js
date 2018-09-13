/* @flow */

import { Receiver } from './receiver';

type Environment = 'develop' | 'staging' | 'production' | 'local';

function boot(environment: Environment): void {
  const permissions = {
    'develop': [{
      origin: /.*develop-www.m1finance.com$/,
      allow: ['get', 'set']
    }, {
      origin: /.*develop-dashboard.m1finance.com$/,
      allow: ['get', 'set', 'del', 'clear', 'getKeys']
    }],
    'staging': [{
      origin: /.*staging-www.m1finance.com$/,
      allow: ['get', 'set']
    }, {
      origin: /.*staging-dashboard.m1finance.com$/,
      allow: ['get', 'set', 'del', 'clear', 'getKeys']
    }],
    'production': [{
      origin: /.*www.m1finance.com$/,
      allow: ['get', 'set']
    }, {
      origin: /.*dashboard.m1finance.com$/,
      allow: ['get', 'set', 'del', 'clear', 'getKeys']
    }],
    'local': [{
      origin: /.*localhost:300\d$/,
      allow: ['get', 'set']
    }]
  };

  const byEnv = permissions[environment];
  console.log(`Configuring receiver for ${environment} environment...`);

  const receiver = new Receiver({ permissions: byEnv });
  console.log('Receiver created.', receiver);
}

boot(__ENVIRONMENT__);
