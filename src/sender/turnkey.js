/* @flow */

import qs from 'query-string';
import toString from 'lodash/toString';

import { Sender } from './sender';

type Environment = 'develop' | 'staging' | 'production' | 'local';

function boot(
  environment: Environment,
  location: Location
) {
  const urls = {
    'develop': 'https://develop-cols.m1finance.com',
    'staging': 'https://staging-cols.m1finance.com',
    'production': 'https://cols.m1finance.com',
    'local': 'http://localhost:3003',
  };

  const url = urls[environment];
  const sender = new Sender(url);
  window.sender = sender;

  sender.onConnect()
    .then(() => {
      const search = qs.parse(location.search);
      const attribution = readAttribution(search);
      if (attribution) {
        console.log('detected attribution data, saving...');
        for (const [tag, value] of Object.entries(attribution)) {
          console.log(tag, value);
          sender.set(tag, value);
        }
      }
    })
    .catch(e => console.error(e));
}

function readAttribution(search) {
  if (
    !search['utm_source'] ||
    !search['utm_medium'] ||
    !search['utm_campaign']
  ) {
    return null;
  }

  return {
    source: toString(search['utm_source']),
    medium: toString(search['utm_medium']),
    campaign: toString(search['utm_campaign']),
    term: toString(search['utm_term']) || null,
    content: toString(search['utm_content']) || null
  };
}

boot(__ENVIRONMENT__, window.location);
