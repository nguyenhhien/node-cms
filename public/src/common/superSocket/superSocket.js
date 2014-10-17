//Note that socket.io should only be used for some less important task. It cannot replaced traditional $http one.
//This is a wrapper for socket.io client with some sugar methods
function SuperSocket(socketServer)
{
    //keeping the actual socket instance
    this.socketServer = socketServer;
}

SuperSocket.prototype._isConnected = function() {
    return this.socketServer && this.socketServer.connected;
};

SuperSocket.prototype.on = function(eventName, fn)
{
    this.socketServer.on(eventName, fn);
};

SuperSocket.prototype.get = function(url, data, cb) {
    //make data optional
    if (typeof data === 'function') {
        cb = data;
        data = {};
    }

    return this._request({
        method: 'get',
        data: data,
        url: url
    }, cb);
};


SuperSocket.prototype.post = function(url, data, cb) {
    //make data optional
    if (typeof data === 'function') {
        cb = data;
        data = {};
    }

    return this._request({
        method: 'post',
        data: data,
        url: url
    }, cb);
};


SuperSocket.prototype.put = function(url, data, cb) {
    //make data optional
    if (typeof data === 'function') {
        cb = data;
        data = {};
    }

    return this._request({
        method: 'put',
        data: data,
        url: url
    }, cb);
};


SuperSocket.prototype['delete'] = function(url, data, cb) {
    //make data optional
    if (typeof data === 'function') {
        cb = data;
        data = {};
    }

    return this._request({
        method: 'delete',
        data: data,
        url: url
    }, cb);
};


SuperSocket.prototype.request = function(url, data, cb, method) {
    if (typeof cb === 'string') {
        method = cb;
        cb = null;
    }

    if (typeof data === 'function') {
        cb = data;
        data = {};
    }

    return this._request({
        method: method || 'get',
        data: data,
        url: url
    }, cb);
};

SuperSocket.prototype._request = function(options, cb) {
    options = options || {};
    options.data = options.data || {};
    options.headers = options.headers || {};

    // Remove trailing slashes and spaces to make packets smaller.
    options.url = options.url.replace(/^(.+)\/*\s*$/, '$1');
    if (typeof options.url !== 'string') {
        throw new Error('Invalid or missing URL!\n' + usage);
    }

    //build request object to keep it in a queue
    var request = {
        method: options.method,
        data: options.data,
        url: options.url,
        headers: options.headers,
        cb: cb
    };

    //queue up the request when socket come online
    if (!this._isConnected()) {
        // If no queue array exists for this socket yet, create it.
        this.requestQueue = this.requestQueue || [];
        this.requestQueue.push(request);
        return;
    }

    //send the request
    this.socketServer.emit(request.url, {
        method: options.method,
        data: options.data,
        headers: options.headers
    }, cb);
};



