
/*!
 * express-negotiate
 * Copyright(c) 2011 Chris Leishman <chris@leishman.org>
 * MIT Licensed
 */


/**
 * Library version.
 */
exports.version = '0.0.1';


/**
 * Module dependencies.
 */
var request = require('http').IncomingMessage.prototype
    , mime = require('mime');
var qStringRegex = /^\s*q=([01](?:\.\d+))\s*$/;


/**
 * NotAcceptable error type
 *
 * To catch and handle:
 *   var negotiate = require('express-negotiate');
 *
 *   ...
 *
 *   app.error(function(err, req, res, next) {
 *     if (err instanceof negotiate.NotAcceptable) {
 *       res.send('Sorry, cant give you it in that format', 406);
 *     } else {
 *       next(err);
 *     }
 *   });
 */
function NotAcceptable(msg) {
    this.name = 'NotAcceptable';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

NotAcceptable.prototype.__proto__ = Error.prototype;

exports.NotAcceptable = NotAcceptable;


/**
 * Add 'negotiate' method to request (http.IncomingMessage)
 *
 * @param {String} format
 * @param {Object} content handlers
 * @api public
 */
request.negotiate = function(format, handlers) {
    var format;
    if (arguments.length == 1) {
        handlers = format;
        format = undefined;
    }
    handlers = handlers || {};

    var types;
    if (typeof format !== 'undefined' && format !== '') {
        types = [ lookup_type(format) ];
    } else if (typeof this.headers['accepts'] !== 'undefined') {
        types = sortQArrayString(this.headers['accepts']);
    } else {
        types = [];
    }

    for (var idx in types) {
        var type = types[idx];
        for (var handlerType in handlers) {
            if (handlerType === 'default')
                continue;
            if (lookup_type(handlerType) === type)
                return handlers[handlerType]();
        }
    }

    if (handlers['default'])
        return handlers['default']();
    else
        throw new NotAcceptable('No acceptable Content-Type handler or default handler found');
};


function lookup_type(type) {
    if (type && !~type.indexOf('/'))
        type = mime.lookup(type);
    return type;
}


/*
 * Methods below from https://github.com/foxxtrot/connect-conneg
 */

function parseQString(qString) {
    var d = qStringRegex.exec(qString);
    if (!d) {
        return 1;
    }
    return Number(d[1]);
}


function sortQArrayString(content) {
    var entries = content.split(','), sortData = [];
    entries.forEach(function(rec) {
        var s = rec.split(';');
        sortData.push({
            key: s[0],
            quality: parseQString(s[1])
        });
    });

    sortData.sort(function(a, b) {
        if (a.quality > b.quality) { return -1; }
        if (a.quality < b.quality) { return 1;  }
        return 0;
    });
    return sortData.map(function(rec) { return rec.key.trim(); });
}
