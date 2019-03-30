"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Analytics implementation that logs analytics events to a logger. This should be used for
 * debugging mainly.
 */
class LoggingAnalytics {
    constructor(_logger) {
        this._logger = _logger;
    }
    event(category, action, options) {
        this._logger.info('event ' + JSON.stringify(Object.assign({ category, action }, options)));
    }
    screenview(screenName, appName, options) {
        this._logger.info('screenview ' + JSON.stringify(Object.assign({ screenName, appName }, options)));
    }
    pageview(path, options) {
        this._logger.info('pageview ' + JSON.stringify(Object.assign({ path }, options)));
    }
    timing(category, variable, time, options) {
        this._logger.info('timing ' + JSON.stringify(Object.assign({ category, variable, time }, options)));
    }
    flush() {
        return Promise.resolve();
    }
}
exports.LoggingAnalytics = LoggingAnalytics;
