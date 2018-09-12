/* @flow */

type SenderOptions = {
  frameId: string,
  timeout?: number
};

export class Sender {
  static sentinel: string = 'm1-cols';

  _origin: string;
  _timeout: number;

  _connected: boolean = false;
  _closed: boolean = false;

  _id: string = makeUuid();
  _count: number = 0;
  _requests: Object = {};

  _receiver: HTMLIFrameElement;

  constructor(url: string, options: SenderOptions) {
    this._origin = readOrigin(url);
    this._timeout = options.timeout || 5000;

    window.addEventListener('message', this._listener, false);

    const frame = document.getElementById(options.frameId);
    this._receiver = frame.contentWindow;

    this._poll();
  }

  onConnect(): Promise<*> {
    if (this._connected) {
      return Promise.resolve();
    } else if (this._closed) {
      return Promise.reject(new Error('Sender has closed.'));
    }

    if (!this._requests.connect) {
      this._requests.connect = [];
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Sender could not connect to Receiver')),
        this._timeout
      );

      this._requests.connect.push(
        (err) => {
          clearTimeout(tmeout);
          if (err) {
            reject(err)
          } else {
            resolve();
          }
        }
      )
    });
  }

  get(...keys: Array<string>): Promise<string> {
    return this._request('get', { keys });
  }

  set(key: string, value: *): Promise<*> {
    return this._request('set', { key, value });
  }

  del(...keys: Array<string>): Promise<*> {
    return this._request('del', { keys });
  }

  clear(): Promise<*> {
    return this._request('clear');
  }

  getKeys(): Promise<*> {
    return this._request('getKeys');
  }

  close() {
    if (!this.closed) {
      window.removeEventListener('message', this._listener, false);
      this._connected = false;
      this.closed = true;
    }
  }

  _request(method: string, params: *) {
    if (this.closed) {
      return Promise.reject(new Error('Sender has closed.'));
    }

    const req = {
      id: this._makeRequestId(),
      method: `${Sender.sentinel}:${method}`,
      params
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          if (this._requests[req.id]) {
            delete this._requests[req.id];
            reject(new Error('Sender could not complete request '));
          }
        },
        this._timeout
      );

      this._requests[req.id] = (err, result) => {
        clearTimeout(timeout);
        delete this._requests[req.id];
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }

      const targetOrigin = this._origin === 'file://' ? '*' : this._origin;
      this._receiver.postMessage(JSON.stringify(req), targetOrigin);
    });
  }

  _poll() {
    const targetOrigin = this._origin === 'file://' ? '*' : this._origin;
    const interval = setInterval(
      () => {
        if (this._connected) {
          clearInterval(interval);
        } else if (this._receiver) {
          this._receiver.postMessage(this._makeMessage('poll'), targetOrigin);
        }
      },
      1000
    );
  }

  _makeMessage(action: string): string {
    return `${Sender.sentinel}:${action}`;
  }

  _makeRequestId(): string {
    return `${this._id}:${this._count++}`;
  }

  _listener = (message): void => {
    if (
      this._closed ||
      !message.data ||
      typeof message.data !== 'string'
    ) {
      return;
    }

    const origin = message.origin === 'null' ? 'file://' : message.origin;
    if (origin !== this._origin) {
      return;
    }

    if (message.data === this._makeMessage('unavailable')) {
      this.close();
      if (!this._requests.connect) {
        return;
      }
      const error = new Error('Unable to connect to receiver.');
      for (const connect of this._requests.connect) {
        connect(error);
      }
      return;
    }

    if (message.data.includes('ready') && !this._connected) {
      this._connected = true;
    } else if (message.data === this._makeMessage('ready')) {
      return;
    }

    let response;
    try {
      response = JSON.parse(message.data);
    } catch (e) {
      return;
    }

    if (!response.id) {
      return;
    } else if (this._requests[response.id]) {
      this._requests[response.id](response.error, response.result);
    }
  }
}

function readOrigin(url: string): string {
  let uri = document.createElement('a');
  uri.href = url;
  if (!uri.host) {
    uri = window.location;
  }

  let protocol;
  if (!uri.protocol || uri.protocol === ':') {
    protocol = window.location.protocol;
  } else {
    protocol = uri.protocol;
  }

  let origin = protocol + '//' + uri.host;
  return origin.replace(/:80$|:443$/, '');
}

function makeUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
