/* @flow */

type Permissions = Array<{ origin: Regexp, allow: Array<string> }>
type ReceiverOptions = {
  permissions: Permissions
};
type Message = {
  data: any,
  origin: string,
  source: Window
};

class Receiver {
  static allowedMethods: Array<string> = ['get', 'set', 'del', 'clear', 'getKeys'];
  static sentinel: string = 'm1-cols';

  _enabled: boolean = false;
  _permissions: Permissions;

  constructor(options: ReceiverOptions) {
    try {
      if (window.localStorage) {
        this._enabled = true;
      }
    } catch (e) {
      // Do nothing.
    }

    if (!this._enabled) {
      try {
        return window.parent.postMessage(this._makeMessage('unavailable'), '*');
      } catch (e) {
        return;
      }
    }

    this._permissions = options.permissions;

    window.addEventListener('message', this._listener, false);
    window.parent.postMessage(this._makeMessage('ready'), '*');
  }

  _listener = (message: Message): void => {
    const origin = message.origin === 'null' ? 'file://' : message.origin;

    if (message.data === this._makeMessage('poll')) {
      return window.parent.postMessage(this._makeMessage('ready'), message.origin);
    } else if (message.data === this._makeMessage('ready')) {
      return;
    }

    let request;
    try {
      request = JSON.parse(message.data);
    } catch (e) {
      return;
    }

    if (!request || typeof request !== 'string') {
      return;
    }

    const method = request.method.split(':')[1];
    if (!method || !this._permitted(origin, method)) {
      return;
    }

    let result;
    let error;
    try {
      result = this[`_${method}`](request.params);
    } catch (e) {
      error = e.message;
    }

    const response = JSON.stringify({
      id: request.id,
      error: error,
      result: result
    });

    const targetOrigin = origin === 'file://' ? '*' : origin;

    window.parent.postMessage(response, targetOrigin);
  }

  _permitted(origin: string, method: string): boolean {
    if (!Receiver.allowedMethods.includes(method)) {
      return false;
    }

    for (const entry of this._permissions) {
      const match = entry.origin.test(origin);
      if (match && entry.allow.includes(method)) {
        return true;
      }
    }

    return false;
  }

  _set(params: { key: string, value: * }): void {
    window.localStorage.setItem(params.key, params.value);
  }

  _get(params): string | Array<string> {
    const results = [];
    for (const key of params.keys) {
      let value;
      try {
        value = window.localStorage.getItem(key);
      } catch (e) {
        value = null;
      }

      results.push(value);
    }

    return results.length > 1 ? results : results[0];
  }

  _del(params): void {
    for (const key of params.keys) {
      window.localStorage.removeItem(key);
    }
  }

  _clear(): void {
    window.localStorage.clear();
  }

  _getKeys() {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      keys.push(window.localStorage.key(i));
    }
    return keys;
  }

  _makeMessage(action: string): string {
    return `${Receiver.sentinel}:${action}`;
  }
}
