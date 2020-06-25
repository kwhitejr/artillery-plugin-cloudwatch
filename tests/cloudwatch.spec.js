const aws = require('aws-sdk');
const { expect } = require('chai');

const cloudwatchPlugin = require('../lib/cloudwatch.js');

const script = {
  config: {
    plugins: {
      cloudwatch: {
        namespace: 'MY_NAMESPACE'
      }
    }
  }
};

if (!aws.config) {
  aws.config = {};
}
if (!aws.config.credentials) {
  aws.config.credentials = {};
}
aws.config.credentials.accessKeyId = '12345678901234567890';
aws.config.credentials.secretAccessKey = '1234567890123456789012345678901234567890';
aws.config.credentials.sessionToken = '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234==';
aws.config.credentials.region = 'my-region';


describe('Artillery - CloudWatch Plugin', () => {
  describe('validateConfig()', () => {
    it('Expects configuration to be provided', () => {
      expect(() => {
        cloudwatchPlugin.impl.validateConfig(null);
      }).to.throw(cloudwatchPlugin.messages.pluginConfigRequired);
      expect(() => {
        cloudwatchPlugin.impl.validateConfig({});
      }).to.throw(cloudwatchPlugin.messages.pluginConfigRequired);
      expect(() => {
        cloudwatchPlugin.impl.validateConfig({ plugins: {} });
      }).to.throw(cloudwatchPlugin.messages.pluginConfigRequired);
    });

    it('Expects configuration to include the attribute `namespace` with a string value', () => {
      expect(() => {
        cloudwatchPlugin.impl.validateConfig({ plugins: { cloudwatch: {} } });
      }).to.throw(cloudwatchPlugin.messages.pluginParamNamespaceRequired);
      expect(() => {
        cloudwatchPlugin.impl.validateConfig({ plugins: { cloudwatch: { namespace: {} } } });
      }).to.throw(cloudwatchPlugin.messages.pluginParamNamespaceMustBeString);
      expect(() => {
        cloudwatchPlugin.impl.validateConfig({ plugins: { cloudwatch: { namespace: true } } });
      }).to.throw(cloudwatchPlugin.messages.pluginParamNamespaceMustBeString);
      expect(() => {
        cloudwatchPlugin.impl.validateConfig({ plugins: { cloudwatch: { namespace: 1 } } });
      }).to.throw(cloudwatchPlugin.messages.pluginParamNamespaceMustBeString);
      expect(() => {
        cloudwatchPlugin.impl.validateConfig({ plugins: { cloudwatch: { namespace: '' } } });
      }).to.throw(cloudwatchPlugin.messages.pluginParamNamespaceMustHaveALengthOfAtLeastOne);
    });

    it('Expects valid configuration produce a usable plugin', () => {
      expect(() => {
        cloudwatchPlugin.impl.validateConfig(script.config);
      }).to.not.throw('config is valid');
    });
  });
});
