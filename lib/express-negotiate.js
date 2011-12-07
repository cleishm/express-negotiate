
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

    var handlerTypes = splitTypes(parseHandlers(handlers || {}));

    var acceptedTypes;
    if (typeof format !== 'undefined' && format !== '') {
        acceptedTypes = [{ value: lookup_type(format), quality: 1 }];
    } else if (typeof this.headers['accepts'] !== 'undefined') {
        acceptedTypes = parseQualities(this.headers['accepts']);
    } else {
        acceptedTypes = [{ value: '*/*', quality: 1 }];
    }
    acceptedTypes = splitTypes(acceptedTypes);

    for (var i in acceptedTypes) {
        var accept = acceptedTypes[i];
        for (var j in handlerTypes) {
            var handler = handlerTypes[j];
            if ((handler.type == accept.type || '*' == accept.type) &&
                (handler.subtype == accept.subtype || '*' == accept.subtype))
            {
                return handler.handler();
            }
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


function parseHandlers(handlerMap) {
    var handlerArray = [];
    for (var key in handlerMap) {
        if (key === 'default')
            continue;
        var o = parseQuality(key)
        handlerArray.push({
              value: lookup_type(o.value)
            , quality: o.quality
            , handler: handlerMap[key]
        });
    }
    return sortByQuality(handlerArray);
}


function parseQuality(str) {
    var parts = str.split(/ *; */)
        , val = parts[0];

    var q = parts[1]
        ? parseFloat(parts[1].split(/ *= */)[1])
        : 1;

    return { value: val, quality: q };
}


function sortByQuality(objs) {
    return objs
        .filter(function(obj) {
            return obj.quality;
        })
        .sort(function(a, b) {
            return b.quality - a.quality;
        });
}


function parseQualities(str) {
    return sortByQuality(str.split(/ *, */).map(parseQuality));
}


function splitTypes(objs) {
    return objs.map(function(obj) {
        var parts = obj.value.split('/');
        obj.type = parts[0];
        obj.subtype = parts[1];
        return obj;
    });
}
