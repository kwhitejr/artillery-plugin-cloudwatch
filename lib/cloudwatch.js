'use strict';

var aws = require('aws-sdk'),
  cloudWatch = new aws.CloudWatch(),
  getQuantileMetrics = require('./quantile'),
  constants = {
    PLUGIN_NAME: 'cloudwatch',
    PLUGIN_PARAM_NAMESPACE: 'namespace',
    // PLUGIN_PARAM_METRICS: 'metrics',
    THE: 'The "',
    CONFIG_REQUIRED: '" plugin requires configuration under <script>.config.plugins.',
    PARAM_REQUIRED: '" parameter is required',
    PARAM_MUST_BE_STRING: '" param must have a string value',
    PARAM_MUST_HAVE_LENGTH_OF_AT_LEAST_ONE: '" param must have a length of at least one',
    PARAM_MUST_BE_ARRAY: '" param must have an array value',
    // Report Array Positions
    TIMESTAMP: 0,
    REQUEST_ID: 1,
    LATENCY: 2,
    STATUS_CODE: 3
  },
  messages = {
    pluginConfigRequired: constants.THE + constants.PLUGIN_NAME + constants.CONFIG_REQUIRED + constants.PLUGIN_NAME,
    pluginParamNamespaceRequired: constants.THE + constants.PLUGIN_PARAM_NAMESPACE + constants.PARAM_REQUIRED,
    pluginParamNamespaceMustBeString: constants.THE + constants.PLUGIN_PARAM_NAMESPACE + constants.PARAM_MUST_BE_STRING,
    pluginParamNamespaceMustHaveALengthOfAtLeastOne: constants.THE + constants.PLUGIN_PARAM_NAMESPACE + constants.PARAM_MUST_HAVE_LENGTH_OF_AT_LEAST_ONE // ,
    // pluginParamMetricsRequired: constants.THE + constants.PLUGIN_PARAM_METRICS + constants.PARAM_REQUIRED,
    // pluginParamMetricsMustBeArray: constants.THE + constants.PLUGIN_PARAM_METRICS + constants.PARAM_MUST_BE_ARRAY
  },
  impl = {
    validateConfig: function (scriptConfig) {
      // Validate that plugin config exists
      if (!(scriptConfig && scriptConfig.plugins && constants.PLUGIN_NAME in scriptConfig.plugins)) {
        throw new Error(messages.pluginConfigRequired);
      }
      // Validate NAMESPACE
      if (!(constants.PLUGIN_PARAM_NAMESPACE in scriptConfig.plugins[constants.PLUGIN_NAME])) {
        throw new Error(messages.pluginParamNamespaceRequired);
      } else if (!('string' === typeof scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_NAMESPACE] ||
        scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_NAMESPACE] instanceof String)) {
        throw new Error(messages.pluginParamNamespaceMustBeString);
      } else if (scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_NAMESPACE].length === 0) {
        throw new Error(messages.pluginParamNamespaceMustHaveALengthOfAtLeastOne);
      }
      // // Validate METRICS
      // if (!(messages.PLUGIN_PARAM_METRICS in pluginConfig)) {
      //     throw new Error(messages.pluginParamMetricsRequired)
      // } else if (!Array.isArray(pluginConfig[messages.PLUGIN_PARAM_METRICS])) {
      //     throw new Error(messages.pluginParamMetricsMustBeArray);
      // }
      // for(var i = 0; pluginConfig[messages.PLUGIN_PARAM_METRICS].length; i++) {
      //     validateMetric(pluginConfig[messages.PLUGIN_PARAM_METRICS][i]);
      // }
    },
    buildLatencyMetrics: function (report) {
      var latencies = report._latencies,
        timestamp = Math.max.apply(null, report._requestTimestamps);
      const {
        p50,
        p95,
        p99,
        avg,
        min,
        max
      } = getQuantileMetrics(latencies);
      return [
        {
          MetricName: 'AverageLatency',
          Dimensions: [],
          Timestamp: (new Date(timestamp)).toISOString(),
          Value: avg / 1000000,
          Unit: 'Milliseconds'
        },
        {
          MetricName: 'MinLatency',
          Dimensions: [],
          Timestamp: (new Date(timestamp)).toISOString(),
          Value: min / 1000000,
          Unit: 'Milliseconds'
        },
        {
          MetricName: 'MaxLatency',
          Dimensions: [],
          Timestamp: (new Date(timestamp)).toISOString(),
          Value: max / 1000000,
          Unit: 'Milliseconds'
        },
        {
          MetricName: 'P50Latency',
          Dimensions: [],
          Timestamp: (new Date(timestamp)).toISOString(),
          Value: p50 / 1000000,
          Unit: 'Milliseconds'
        },
        {
          MetricName: 'P95Latency',
          Dimensions: [],
          Timestamp: (new Date(timestamp)).toISOString(),
          Value: p95 / 1000000,
          Unit: 'Milliseconds'
        },
        {
          MetricName: 'P99Latency',
          Dimensions: [],
          Timestamp: (new Date(timestamp)).toISOString(),
          Value: p99 / 1000000,
          Unit: 'Milliseconds'
        }
      ];
    },
    // buildErrorMetricData: function (report) {
    //   var errorCount = 0;
    //   var timestamp = Math.max.apply(null, report._requestTimestamps);

    //   Object.getOwnPropertyNames(report._errors).forEach(function (propertyName) {
    //     errorCount += report._errors[propertyName];
    //   });

    //   return [
    //     {
    //       MetricName: 'Error',
    //       Dimensions: dimensions,
    //       Timestamp: (new Date(timestamp)).toISOString(),
    //       Value: errorCount,
    //       Unit: 'None',
    //     },
    //   ];
    // },
    CloudWatchPlugin: function (scriptConfig, eventEmitter) {
      var self = this,
        reportError = function (err) {
          if (err) {
            console.log('Error reporting metrics to CloudWatch via putMetricData:', err);
          }
        };
      self.config = JSON.parse(JSON.stringify(scriptConfig.plugins[constants.PLUGIN_NAME]));
      eventEmitter.on('stats', function (report) {
        console.log(JSON.stringify(report));
        // fail fast if no metrics
        if (typeof report._entries === 'undefined' || report._entries.length === 0) {
          return;
        }

        const latencyMetrics = impl.buildLatencyMetrics(report);

        var cloudWatchParams = {
          Namespace: self.config[constants.PLUGIN_PARAM_NAMESPACE],
          MetricData: latencyMetrics
        };

        cloudWatch.putMetricData(cloudWatchParams, reportError);

        console.log('Metrics reported to CloudWatch');
      });
    }
  },
  api = {
    init: function (scriptConfig, eventEmitter) {
      impl.validateConfig(scriptConfig);
      return new impl.CloudWatchPlugin(scriptConfig, eventEmitter);
    }
  };

/**
 * Configuration:
 *  {
 *      "config": {
 *          "plugins": {
 *              "cloudwatch": {
 *                  "namespace": "[INSERT_NAMESPACE]",
 // *                  "metrics": [
 // *                      {
 // *                          "name": "[METRIC_NAME]",
 // *                          "dimensions": [...],
 // *
 // *                      }
 // *                  ]
 *              }
 *          }
 *      }
 *  }
 */
module.exports = api.init;

/* test-code */
module.exports.constants = constants;
module.exports.messages = messages;
module.exports.impl = impl;
module.exports.api = api;
/* end-test-code */
