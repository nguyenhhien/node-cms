//event emitter interface
function EventEmitter() {}

EventEmitter.prototype.addListener = function (event, listener) {};
EventEmitter.prototype.on = function (event, listener) {};
EventEmitter.prototype.once = function (event, listener) {};
EventEmitter.prototype.removeListener = function (event, listener) {};
EventEmitter.prototype.removeAllListeners = function (event) {};
// EventEmitter.prototype.removeAllListeners = function([event])
EventEmitter.prototype.setMaxListeners = function (n) {};
EventEmitter.prototype.listeners = function (event) {};
EventEmitter.prototype.emit = function (event) {};

//writable stream interface
function WritableStream() {}

WritableStream.prototype.writable = function () {};
// WritableStream.prototype.write = function(string, [encoding], [fd]){}
// WritableStream.prototype.write = function(buffer){}
WritableStream.prototype.end = function () {};
// WritableStream.prototype.end = function(string, encoding){}
// WritableStream.prototype.end = function(buffer){}
WritableStream.prototype.destroy = function () {};
WritableStream.prototype.destroySoon = function () {};

exports = module.exports = response;

//TODO: make it streamable
function response(options) {
    if (!options) {
        options = {};
    }

    var _endCalled = false;
    var _data = '';
    var _headers = {};
    var _encoding = options.encoding;

    var _redirectUrl = '';
    var _renderView = '';
    var _renderData = {};

    var writableStream = options.writableStream ?
        new options.writableStream() :
        new WritableStream();

    var eventEmitter = options.eventEmitter ?
        new options.eventEmitter() :
        new EventEmitter();

    return {
        statusCode: -1,
        charset: 'utf-8',

        cookies: {},
        cookie: function (name, value, options) {
            this.cookies[name] = {
                value: value,
                options: options
            };
        },
        clearCookie: function (name) {
            delete this.cookies[name];
        },

        status: function (code) {
            this.statusCode = code;
            return this;
        },
        writeHead: function (statusCode, phrase, headers) {
            if (_endCalled) {
                throw 'The end() method has already been called.';
            }

            this.statusCode = statusCode;

            if (headers) {
                _headers = headers;
            } else {
                _headers = phrase;
            }
        },
        send: function (a, b, c) {
            var _self = this;
            var _formatData = function(a) {
                if (a && typeof a === 'object') {
                    if (a.statusCode) {
                        _self.statusCode = a.statusCode;
                    }
                    else if (a.httpCode) {
                        _self.statusCode = a.statusCode;
                    }
                    if (a.body) {
                        _data = a.body;
                    }
                    else {
                        _data = a;
                    }
                }
                else {
                    _data = a;
                }
            };

            switch (arguments.length) {
                case 1:
                    if (typeof a === 'number')
                    {
                        this.statusCode = a;
                    } else {
                        _formatData(a);
                    }
                    break;

                case 2:
                    if (typeof a === 'number')
                    {
                        _formatData(b);
                        this.statusCode = a;
                    }
                    else if (typeof b === 'number') {
                        _formatData(a);
                        this.statusCode = b;
                        console.warn('WARNING: Called send() with deprecated parameter order');
                    }
                    else {
                        _formatData(a);
                        _encoding = b;
                    }
                    break;

                case 3:
                    _formatData(a);
                    _headers = b;
                    this.statusCode = c;
                    console.warn('WARNING: Called send() with deprecated three parameters');
                    break;

                default:
                    break;
            }

            //TODO: callback notified results
            this.emit('send');
            this.emit('end');
        },
        json: function (code, body) {
            var self = this;
            this.setHeader('Content-Type', 'application/json');

            //don't stringify -- return object immediately
            switch (arguments.length) {
                case 1:
                    if (typeof code === 'number') {
                        this.statusCode = code;
                    }
                    else {
                        _data = code;
                        this.statusCode = 200;
                    }
                    break;

                case 2:
                    this.statusCode = code;
                    _data = body;

                    break;

                default:
                    break;
            }

            this.send(self.statusCode, _data);
        },
        success: function(body)
        {
            var self = this;
            self.json(200, body);
        },
        error: function(error)
        {
            var self = this;
            self.json(400, error);
        },
        write: function (data, encoding) {
            _data += data;
            if (encoding) {
                _encoding = encoding;
            }
        },
        end: function (data, encoding) {
            _endCalled = true;
            if (data) {
                _data += data;
            }
            if (encoding) {
                _encoding = encoding;
            }
            this.emit('end');
        },

        header: function (name, value) {
            if(typeof value !== 'undefined'){
                return this.setHeader(name, value);
            }else{
                return this.getHeader(name);
            }
        },

        getHeader: function (name) {
            return _headers[name];
        },

        get: this.getHeader,
        setHeader: function (name, value) {
            _headers[name] = value;
            return value;
        },
        set: this.setHeader,
        removeHeader: function (name) {
            delete _headers[name];
        },
        setEncoding: function (encoding) {
            _encoding = encoding;
        },
        redirect: function (a, b) {
            switch (arguments.length) {
                case 1:
                    _redirectUrl = a;
                    break;

                case 2:
                    if (typeof a === 'number') {
                        this.statusCode = a;
                        _redirectUrl = b;
                    }
                    break;

                default:
                    break;
            }
        },
        render: function (a, b, c) {
            _renderView = a;
            switch (arguments.length) {
                case 2:
                    break;

                case 3:
                    _renderData = b;
                    break;

                default:
                    break;
            }

            this.emit('render');
            this.emit('end');
        },

        writable: function () {
            return writableStream.writable.apply(this, arguments);
        },
        destroy: function () {
            return writableStream.destroy.apply(this, arguments);
        },
        destroySoon: function () {
            return writableStream.destroySoon.apply(this, arguments);
        },
        addListener: function (event, listener) {
            return eventEmitter.addListener.apply(this, arguments);
        },
        on: function (event, listener) {
            return eventEmitter.on.apply(this, arguments);
        },
        once: function (event, listener) {
            return eventEmitter.once.apply(this, arguments);
        },
        removeListener: function (event, listener) {
            return eventEmitter.removeListener.apply(this, arguments);
        },
        removeAllListeners: function (event) {
            return eventEmitter.removeAllListeners.apply(this, arguments);
        },
        setMaxListeners: function (n) {
            return eventEmitter.setMaxListeners.apply(this, arguments);
        },
        listeners: function (event) {
            return eventEmitter.listeners.apply(this, arguments);
        },
        emit: function (event) {
            return eventEmitter.emit.apply(this, arguments);
        },
        _isEndCalled: function () {
            return _endCalled;
        },
        _getHeaders: function () {
            return _headers;
        },
        _getData: function () {
            return _data;
        },
        _getStatusCode: function () {
            return this.statusCode;
        },
        _isJSON: function () {
            return (_headers['Content-Type'] === 'application/json');
        },
        _isUTF8: function () {
            if (!_encoding) {
                return false;
            }
            return (_encoding === 'utf8');
        },
        _isDataLengthValid: function () {
            if (_headers['Content-Length']) {
                return (_headers['Content-Length'].toString() === _data.length.toString());
            }
            return true;
        },
        _getRedirectUrl: function () {
            return _redirectUrl;
        },
        _getRenderView: function () {
            return _renderView;
        },
        _getRenderData: function () {
            return _renderData;
        }
    };
}