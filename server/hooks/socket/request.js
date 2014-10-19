var methods             = require('methods');
var Stream              = require('stream');
var parse               = require('url').parse;
var format              = require('url').format;
var util                = require('util');
var _                   = require('lodash-node');
var mime                = require('mime');
var qs                  = require('qs');
var https               = require('https');
var http                = require('http');

exports = module.exports = request;

function request(options) {
    return {
        method: (options.method) ? options.method : 'GET',
        url: (options.url) ? options.url : '',
        params: (options.params) ? options.params : {},
        session: (options.session) ? options.session : {},
        cookies: (options.cookies) ? options.cookies : {},
        headers: (options.headers) ? options.headers : {},
        body: (options.body) ? options.body : {},
        query: (options.query) ? options.query : {},
        files: (options.files) ? options.files : {},
        socket: (options.socket) ? options.socket : {},

        port: "TODO",
        io: "TODO",
        protocol: "TODO",
        transport: "TODO",

        header: function getHeader(headerName, defaultValue) {
            var headerValue = this.headers[headerName];
            return (typeof headerValue === 'undefined') ? defaultValue : headerValue;
        },
        param: function(paramName)
        {
            return this.params[paramName] || this.body[paramName];
        }
    }
}
