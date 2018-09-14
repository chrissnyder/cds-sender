/* @flow */

import qs from 'query-string';
import toString from 'lodash/toString';

import { Sender } from './sender';

function boot(url: string, location: Location) {
  const sender = new Sender(url);
  sender.onConnect()
    .then(() => {
      const search = qs.parse(location.search);
      const attribution = readAttribution(search);
      if (attribution) {
        for (const [tag, value] of Object.entries(attribution)) {
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

// RECEIVER_URL is injected via webpack
boot(RECEIVER_URL, window.location);
