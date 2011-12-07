
/**
 * Module dependencies.
 */

var express = require('express')
    , should = require('should')
    , assert = require('assert')
    , negotiate = require('../');

module.exports = {
    '.version': function(){
        negotiate.version.should.match(/^\d+\.\d+\.\d+$/);
    },

    'test mimetype selection': function(){
        var app = express.createServer();

        app.get('/neg', function(req, res, next) {
            req.negotiate({
                'application/json': function() {
                    res.send('json');
                },
                'html': function() {
                    res.send('html');
                },
                'default': function() {
                    res.send('unknown');
                }
            });
        });

        assert.response(app,
            { url: '/neg', headers: { 'Accepts': 'application/json' } },
            { body: 'json' });

        assert.response(app,
            { url: '/neg', headers: { 'accepts': 'text/html' } },
            { body: 'html' });

        assert.response(app,
            { url: '/neg', headers: { 'ACCEPTS': 'application/octet-stream' } },
            { body: 'unknown' });

        assert.response(app,
            { url: '/neg', headers: { 'Accepts': 'application/json, text/html' } },
            { body: 'json' });

        assert.response(app,
            { url: '/neg', headers: { 'Accepts': 'application/json;q=0.8, text/html' } },
            { body: 'html' });

        assert.response(app,
            { url: '/neg', headers: { 'Accepts': 'application/json;q=0.8, text/html;q=0.7' } },
            { body: 'json' });

        assert.response(app,
            { url: '/neg', headers: { 'Accepts': 'application/octet-stream;q=1.1, text/html;q=0.7' } },
            { body: 'html' });
    },

    'test format extension override': function(){
        var app = express.createServer();

        app.get('/neg.:format?', function(req, res, next) {
            req.negotiate(req.params.format, {
                'application/json': function() {
                    res.send('json');
                },
                'html': function() {
                    res.send('html');
                },
                'default': function() {
                    res.send('unknown');
                }
            });
        });

        assert.response(app,
            { url: '/neg.json' },
            { body: 'json' });

        assert.response(app,
            { url: '/neg.html' },
            { body: 'html' });

        assert.response(app,
            { url: '/neg.xxxx' },
            { body: 'unknown' });

        assert.response(app,
            { url: '/neg.json', headers: { 'Accepts': 'text/html' } },
            { body: 'json' });
    },

    'test no acceptable handler': function() {
        var app = express.createServer();

        app.get('/neg.:format?', function(req, res, next) {
            req.negotiate(req.params.format, {
            });
        });

        app.error(function(err, req, res, next) {
            if (err instanceof negotiate.NotAcceptable) {
                res.send('Sorry', 406);
            } else {
                next(err);
            }
        });

        assert.response(app,
            { url: '/neg.xxxx' },
            { body: 'Sorry' });
    }
}
