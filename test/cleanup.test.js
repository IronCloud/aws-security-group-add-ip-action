const test = require('node:test');
const assert = require('node:assert/strict');
const { RevokeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');

const { run } = require('../src/cleanup');

test('cleanup revokes IP from each group', async () => {
  const calls = [];
  const config = {
    ec2: {
      async send(command) {
        calls.push(command);
        return {};
      },
    },
    groupIds: ['sg-1', 'sg-2'],
    protocol: 'tcp',
    port: 22,
    toPort: false,
  };

  await run(config, async () => '1.2.3.4');

  assert.equal(calls.length, 2);
  assert.ok(calls[0] instanceof RevokeSecurityGroupIngressCommand);
  assert.ok(calls[1] instanceof RevokeSecurityGroupIngressCommand);
  assert.equal(calls[0].input.GroupId, 'sg-1');
  assert.equal(calls[1].input.GroupId, 'sg-2');
  assert.equal(calls[0].input.CidrIp, '1.2.3.4/32');
  assert.equal(calls[0].input.ToPort, 22);
});
