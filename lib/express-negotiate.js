
/*!
 * express-negotiate
 * Copyright(c) 2011 Chris Leishman <chris@leishman.org>
 * MIT Licensed
 */


/**
 * Library version.
 */
exports.version = '0.0.5';


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
request.negotiate = function(format, next, handlers) {
    var format;
    if (arguments.length == 1) {
        handlers = arguments[0];
        format = undefined;
    } else if (arguments.length == 2) {
        handlers = arguments[1];
        if (typeof format === 'string') {
            next = undefined;
        } else {
            next = arguments[0];
            format = undefined;
        }
    }

    var handledTypes = splitTypes(parseHandlers(handlers || {}));

    var acceptedTypes;
    if (typeof format !== 'undefined' && format !== '') {
        acceptedTypes = [{ value: lookup_type(format), quality: 1 }];
    } else if (typeof this.headers.accept !== 'undefined') {
        acceptedTypes = parseQualities(this.headers.accept);
    } else {
        acceptedTypes = [{ value: '*/*', quality: 1 }];
    }
    acceptedTypes = splitTypes(acceptedTypes);

    for (var i in acceptedTypes) {
        var accept = acceptedTypes[i];
        for (var j in handledTypes) {
            var handler = handledTypes[j];
            if (handler.type !== 'default' &&
                (handler.type == accept.type || '*' == accept.type) &&
                (handler.subtype == accept.subtype || '*' == accept.subtype))
            {
                return handler.handler(next);
            }
        }
    }

    if (handledTypes.length > 0 && handledTypes[handledTypes.length - 1].type === 'default') {
        return handledTypes[handledTypes.length - 1].handler(next);
    }

    var err = new NotAcceptable('No acceptable Content-Type handler or default handler found');
    if (typeof next !== 'undefined')
        return next(err);
    else
        throw err;
};


function lookup_type(type) {
    if (type && !~type.indexOf('/'))
        // for unknown types application/octet-stream is returned to maintain
        // the behaviour of the old mime.lookup (mime < 2.0.0)
        type = mime.getType(type) || 'application/octet-stream';
    return type;
}


function parseHandlers(handlerMap) {
    var handlerArray = [];
    for (var key in handlerMap) {
        parseQualities(key).forEach(function(o) {
            if (o.value !== 'default' && o.quality <= 0.0)
                return;
            handlerArray.push({
                  value: (o.value !== 'default')? lookup_type(o.value) : o.value
                , quality: (o.value !== 'default')? o.quality : 0.0
                , handler: handlerMap[key]
            });
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
            return obj.quality >= 0.0;
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
