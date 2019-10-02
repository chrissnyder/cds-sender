/* @flow */

import qs from 'query-string';
import toString from 'lodash/toString';

import { Sender } from './sender';

const UTM_SOURCE = ('utm_source': 'utm_source');
const UTM_MEDIUM = ('utm_medium': 'utm_medium');
const UTM_CAMPAIGN = ('utm_campaign': 'utm_campaign');
const UTM_TERM = ('utm_term': 'utm_term');
const UTM_CONTENT = ('utm_content': 'utm_content');

const SOURCE = ('source': 'source');
const MEDIUM = ('medium': 'medium');
const CAMPAIGN = ('campaign': 'campaign');
const TERM = ('term': 'term');
const CONTENT = ('content': 'content');

const MEDIUM_ORGANIC_SEARCH = ('organic-search': 'organic-search');
const MEDIUM_DIRECT = ('direct': 'direct');

export type Attribution = {|
  source: string,
  medium: string,
  campaign: string,
  term: ?string,
  content: ?string
|};

export default class CdsSender {
  static REQUIRED_TAGS = [SOURCE, MEDIUM, CAMPAIGN];
  static ALL_TAGS = [...CdsSender.REQUIRED_TAGS, TERM, CONTENT];
  static IGNORED_MEDIUMS = [MEDIUM_ORGANIC_SEARCH, MEDIUM_DIRECT];

  _sender: Sender;

  constructor(url: string) {
    this._sender = new Sender(url);
  }

  init() {
    return this._sender.onConnect();
  }

  recordAttribution(location: Location): Promise<?Attribution> {
    const search = qs.parse(location.search);
    const attribution = readAttributionFromSearch(search);
    if (!attribution) return Promise.resolve(null);

    const setters = [];
    // A "utm_medium" in IGNORED_MEDIUMS means for whatever reason we
    // do not want to store these past the current user session. Return
    // the read value so consumers can do whatever they'd like, but don't
    // save the values to the receiver.
    if (!CdsSender.IGNORED_MEDIUMS.includes(search[UTM_MEDIUM])) {
      for (const [tag, value] of Object.entries(attribution)) {
        setters.push(this._sender.set(tag, value));
      }
    }

    return Promise.all(setters).then(() => attribution);
  }

  hasAttribution(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._sender.get(...CdsSender.REQUIRED_TAGS)
        .then(result => resolve(result.filter(Boolean).length === CdsSender.REQUIRED_TAGS.length))
        .catch((e) => reject(e));
    });
  }

  readAttribution(): Promise<?Attribution> {
    return new Promise((resolve, reject) => {
      this._sender.get(...CdsSender.ALL_TAGS)
        .then(values => {
          const obj = {};
          for (const [tag, index] of CdsSender.ALL_TAGS) {
            obj[tag] = values[index];
          }
          resolve(obj);
        })
        .catch((e) => reject(e))
    });
  }

  isReferredByOrganicSearch(referrer: string): boolean {
    switch (referrer) {
      case 'https://www.google.com/':
      case 'https://www.bing.com/':
      case 'https://www.yahoo.com/':
        return true;
      default:
        return false;
    }
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

function readAttributionFromSearch(search): Attribution {
  // Ignore attribution if all three required fields aren't present.
  if (
    !search[UTM_SOURCE] ||
    !search[UTM_MEDIUM] ||
    !search[UTM_CAMPAIGN]
  ) {
    return null;
  }

  return {
    [SOURCE]: toString(search[UTM_SOURCE]),
    [MEDIUM]: toString(search[UTM_MEDIUM]),
    [CAMPAIGN]: toString(search[UTM_CAMPAIGN]),
    [TERM]: toString(search[UTM_TERM]) || null,
    [CONTENT]: toString(search[UTM_CONTENT]) || null
  };
}
