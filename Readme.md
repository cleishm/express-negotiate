
# express-negotiate

  Express content negotiation functions.

## Installation

    $ npm install express-negotiate

## Usage

Require the module to add the request.negotiate method:

```javascript
var express = require('express')
    , negotiate = require('express-negotiate');
```

Then use in the route handler:

```javascript
app.get('/index', function(req, res, next) {
    req.negotiate({
        'application/json': function() {
            res.send('{ message: "Hello World" }');
        },
        'html': function() {
            res.send('<html><body><h1>Hello World</h1></body></html>');
        },
        'default': function() {
            // send HTML anyway
            res.send('<html><body><h1>Hello World</h1></body></html>');
        }
    });
});
```

## Handling unacceptable requests

If a 'default' handler is not provided, then req.negotiate will throw
a negotiate.NotAcceptable error.  This can be caught and handled using
express error handling:

```javascript
app.get('/index', function(req, res, next) {
    req.negotiate({
        'application/json': function() {
            res.send('{ message: "Hello World" }');
        }
    });
});

app.error(function(err, req, res, next) {
    if (err instanceof negotiate.NotAcceptable) {
        res.send('Sorry, I dont know how to return any of the content types requested', 406);
    } else {
        next(err);
    }
});
```


## Allowing route filename extensions to override Accept header

By parsing out any filename extension on the route, and passing
this to req.negotiate, the client can force a particular
Content-Type regardless of the Accept header.

```javascript
app.get('/index.:format?', function(req, res, next) {
    req.negotiate(req.params.format, {
        'application/json': function() {
            res.send('{ message: "Hello World" }');
        }
    });
});
```


## Credits

Methods for parsing HTTP header qStrings taken from connect-conneg,
by Jeff Craig (https://github.com/foxxtrot/connect-conneg).

## License 

(The MIT License)

Copyright (c) 2011 Chris Leishman &lt;chris@leishman.org&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
