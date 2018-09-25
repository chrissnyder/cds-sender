/* @flow */

import qs from 'query-string';
import toString from 'lodash/toString';

import { Sender } from './sender';

export default class CdsSender {
  _sender: Sender;

  constructor(url: string) {
    this._sender = new Sender(url);
  }

  init() {
    return this._sender.onConnect();
  }

  recordAttribution(location: Location) {
    const search = qs.parse(location.search);
    const attribution = readAttribution(search);
    if (attribution) {
      const setters = [];
      for (const [tag, value] of Object.entries(attribution)) {
        if (value) {
          setters.push(this._sender.set(tag, value));
        }
      }
      return Promise.all(setters);
    }
    return Promise.resolve(null);
  }

  get(): Promise<string> {
    return this._sender.get(...arguments);
  }
  set(): Promise<string> {
    return this._sender.set(...arguments);
  }
  del(): Promise<string> {
    return this._sender.del(...arguments);
  }
  clear(): Promise<string> {
    return this._sender.clear(...arguments);
  }
  getKeys(): Promise<string> {
    return this._sender.getKeys(...arguments);
  }
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
