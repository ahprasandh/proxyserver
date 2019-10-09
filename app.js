// Simple proxy/forwarding server
// Start Server: node app.js <port>
//
// Example:
// proxyTargetUrl=https://hari.com:8443
// API Request => https://hari.external.com/api/micrososft/bot
// Tunneled Request=>https://hari.com:8443/api/micrososft/bot
//
// Note: All Headers & Request Body will be forwarded
// Change the proxyTargetUrl according to your condition
var server = null;
var PORT = process.argv[2] || 9000;

var url = require('url'),
    http = require('http'),
    https = require('https');

server = http.createServer(function(req, res) {


    var proxyTargetUrl = "https://hari.com";
    req.pause();
    var options = url.parse(req.url);
    var proxy = url.parse(proxyTargetUrl);
    options.headers = req.headers;
    options.method = req.method;
    options.agent = false;
    options.host = proxy.host;
    options.hostname = proxy.hostname;
    options.port = proxy.port;
    options.protocol = proxy.protocol;
    options.headers['host'] = options.host;
    console.log('==> Tunneling req to ' + proxyTargetUrl + req.url + '\n');
    console.log('\t-> Request Headers: ', options);

    var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
        console.log(' ');
        console.log('<== Forwarding response from ' + proxyTargetUrl + req.url + ' > status ' + serverResponse.statusCode);
        console.log(' ');
        // console.log('\t-> Response Headers: ', serverResponse.headers);

        serverResponse.pause();

        serverResponse.headers['access-control-allow-origin'] = '*';

        switch (serverResponse.statusCode) {
            // pass through.  we're not too smart here...
            case 200:
            case 201:
            case 202:
            case 203:
            case 204:
            case 205:
            case 206:
            case 304:
            case 400:
            case 401:
            case 402:
            case 403:
            case 404:
            case 405:
            case 406:
            case 407:
            case 408:
            case 409:
            case 410:
            case 411:
            case 412:
            case 413:
            case 414:
            case 415:
            case 416:
            case 417:
            case 418:
                res.writeHeader(serverResponse.statusCode, serverResponse.headers);
                serverResponse.pipe(res, {
                    end: true
                });
                serverResponse.resume();
                break;

                // fix host and pass through.
            case 301:
            case 302:
            case 303:
                serverResponse.statusCode = 303;
                serverResponse.headers['location'] = 'http://localhost:' + PORT + '/' + serverResponse.headers['location'];
                console.log('\t-> Redirecting to ', serverResponse.headers['location']);
                res.writeHeader(serverResponse.statusCode, serverResponse.headers);
                serverResponse.pipe(res, {
                    end: true
                });
                serverResponse.resume();
                break;

                // error everything else
            default:
                var stringifiedHeaders = JSON.stringify(serverResponse.headers, null, 4);
                serverResponse.resume();
                res.writeHeader(500, {
                    'content-type': 'text/plain'
                });
                res.end(process.argv.join(' ') + ':\n\nError ' + serverResponse.statusCode + '\n' + stringifiedHeaders);
                break;
        }
        console.log('\n\n');
    });

    connector.on('error', function(error) {
        console.log(error)
        res.writeHeader(500, {
            'content-type': 'application/json'
        });
        res.end(JSON.stringify({error:error}));
    });

    req.pipe(connector, {
        end: true
    });
    req.resume();

});
console.log('Listening on http://localhost:%s...', PORT);
server.listen(PORT);

