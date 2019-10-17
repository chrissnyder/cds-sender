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

  init(location: ?Location) {
    return this._sender.onConnect()
      .then(() => location ? this.recordAttribution(location) : null);
  }

  recordAttribution(location: Location): Promise<?Attribution> {
    const attribution = this.readAttributionFromLocation(location);
    if (!attribution) return Promise.resolve(null);

    const setters = [];
    // A "utm_medium" in IGNORED_MEDIUMS means for whatever reason we
    // do not want to store these past the current user session. Return
    // the read value so consumers can do whatever they'd like, but don't
    // save the values to the receiver.
    if (!CdsSender.IGNORED_MEDIUMS.includes(attribution[MEDIUM])) {
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

  // This is present on the class so consumers can use it.
  readAttributionFromLocation(location: Location): ?Attribution {
    const search = qs.parse(location.search);

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

  readOrganicSearchReferrer(referrer: string): ?string {
    switch (referrer) {
      case 'https://www.google.com/':
        return 'google';
      case 'https://www.bing.com/':
        return 'bing';
      case 'https://search.yahoo.com/':
        return 'yahoo';
      default:
        return null;
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
