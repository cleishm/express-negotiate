
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
        types = [{ value: lookup_type(format), quality: 1 }];
    } else if (typeof this.headers['accepts'] !== 'undefined') {
        types = parseQuality(this.headers['accepts']);
    } else {
        types = [{ value: '*/*', quality: 1 }];
    }

    for (var idx in types) {
        var type = types[idx].value;
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
 * Methods below from express utils.js (with some adjustments)
 */


function parseQuality(str) {
    return parseQualities(str.split(/ *, */));
}


function parseQualities(strings) {
    return strings
        .map(quality)
        .filter(function(obj) {
            return obj.quality;
        })
        .sort(function(a, b) {
            return b.quality - a.quality;
        });
}


function quality(str) {
    var parts = str.split(/ *; */)
        , val = parts[0];

    var q = parts[1]
        ? parseFloat(parts[1].split(/ *= */)[1])
        : 1;

    return { value: val, quality: q };
}
