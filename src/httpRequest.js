'use strict';
var https = null;
if (typeof XMLHttpRequest === 'undefined') {
    https = require('https');
}

export class HttpRequest {
    constructor(options) {
        this.method = "";
        this.port = "";
        this.path = "";
        this.host = "";
        this.data = "";
        this.headers = {};

        let protocolJson = options.toJson();

        for (let prop in protocolJson) {
            this[prop] = protocolJson[prop];
        }
    }

    node_request() {
        const promise = new Promise((resolve, reject) => {
            const request = https.request({
                method: this.method,
                port: this.port,
                path: this.path,
                host: this.host,
                headers: this.headers
            }, function(res) {
                let result = "";
                if (res.statusCode !== 200) {
                    return reject({
                        error       : true,
                        errCode     : res.statusCode,
                        errMsg      : res.responseText || 'Invalid statusCode'
                    });
                }

                res.on('data', function(data) {
                    result += data.toString();
                });

                res.on('error', function(err) {
                    return reject({
                        error       : true,
                        errCode     : res.statusCode,
                        errMsg      : err.message
                    });
                });

                res.on('end', function(){
                    return resolve(result);
                })
            });

            request.on('aborted', function () {
                return reject({
                    error       : true,
                    errCode     : 504,
                    errMsg      : 'Request has been aborted by the server'
                });
            });

            request.on('abort', function () {
                return reject({
                    error       : true,
                    errCode     : 418,
                    errMsg      : 'Request has been aborted by the client'
                });
            });

            request.on('error', function (err) {
                return reject({
                    error       : true,
                    errCode     : 422,
                    errMsg      : err.message
                });
            });

            request.setTimeout(this.timeout, function(){
                request.abort();
            });

            request.write(this.data);
            request.end();
        });
        return promise;

    }
    ajax() {
        const promise = new Promise((resolve, reject) => {
            let url = 'https://' + this.host + this.path;
            var xhr = new XMLHttpRequest();

            xhr.timeout = this.timeout;
            xhr.open(this.method, url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = () => {
                if (xhr.readyState != 4) return;
                if (xhr.status != 200) {
                    return reject(new Error('Invalid statusCode: ' + xhr.status));
                } else {
                    resolve(xhr.responseText)
                }
            };
            xhr.send(this.data)
        });

        return promise;
    }
    request() {
        if (typeof XMLHttpRequest !== 'undefined') {
            return this.ajax();
        }
        return this.node_request();
    }

    execute() {
        return this.request();
    }
}