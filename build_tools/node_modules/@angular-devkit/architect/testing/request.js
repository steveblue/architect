"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const http = require("http");
const https = require("https");
const Url = require("url");
/**
 * @deprecated
 */
function request(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const u = Url.parse(url);
        const options = {
            hostname: u.hostname,
            protocol: u.protocol,
            host: u.host,
            port: u.port,
            path: u.path,
            headers: Object.assign({ 'Accept': 'text/html' }, headers),
        };
        function _callback(res) {
            if (!res.statusCode || res.statusCode >= 400) {
                // Consume the rest of the data to free memory.
                res.resume();
                reject(new Error(`Requesting "${url}" returned status code ${res.statusCode}.`));
            }
            else {
                res.setEncoding('utf8');
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(data);
                    }
                    catch (err) {
                        reject(err);
                    }
                });
            }
        }
        if (u.protocol == 'https:') {
            options.agent = new https.Agent({ rejectUnauthorized: false });
            https.get(options, _callback);
        }
        else if (u.protocol == 'http:') {
            http.get(options, _callback);
        }
        else {
            throw new Error(`Unknown protocol: ${JSON.stringify(u.protocol)}.`);
        }
    });
}
exports.request = request;
