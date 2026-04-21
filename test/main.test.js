const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AuthorizeSecurityGroupIngressCommand,
  DescribeSecurityGroupsCommand,
  RevokeSecurityGroupIngressCommand,
} = require('@aws-sdk/client-ec2');

const { run } = require('../src/main');

function makeBaseConfig(ec2) {
  return {
    ec2,
    groupIds: ['sg-1'],
    port: 22,
    toPort: false,
    protocol: 'tcp',
    description: 'GitHub Action',
  };
}

test('main adds single-port ingress rule', async () => {
  const calls = [];
  const ec2 = {
    async send(command) {
      calls.push(command);
      if (command instanceof DescribeSecurityGroupsCommand) {
        return { SecurityGroups: [{ GroupId: 'sg-1', IpPermissions: [] }] };
      }
      return {};
    },
  };

  await run(makeBaseConfig(ec2), async () => '1.2.3.4');

  assert.equal(calls.length, 2);
  assert.ok(calls[0] instanceof DescribeSecurityGroupsCommand);
  assert.ok(calls[1] instanceof AuthorizeSecurityGroupIngressCommand);
  assert.equal(calls[1].input.GroupId, 'sg-1');
  assert.equal(calls[1].input.IpPermissions[0].FromPort, 22);
  assert.equal(calls[1].input.IpPermissions[0].ToPort, 22);
  assert.equal(calls[1].input.IpPermissions[0].IpRanges[0].CidrIp, '1.2.3.4/32');
});

test('main revokes existing matching description before adding range rule', async () => {
  const calls = [];
  const ec2 = {
    async send(command) {
      calls.push(command);
      if (command instanceof DescribeSecurityGroupsCommand) {
        return {
          SecurityGroups: [{
            GroupId: 'sg-1',
            IpPermissions: [{
              FromPort: 22,
              ToPort: 30,
              IpProtocol: 'tcp',
              IpRanges: [
                { CidrIp: '8.8.8.8/32', Description: 'Other' },
                { CidrIp: '9.9.9.9/32', Description: 'GitHub Action' },
              ],
            }],
          }],
        };
      }
      return {};
    },
  };

  const config = {
    ...makeBaseConfig(ec2),
    toPort: 30,
  };

  await run(config, async () => '5.6.7.8');

  assert.equal(calls.length, 3);
  assert.ok(calls[1] instanceof RevokeSecurityGroupIngressCommand);
  assert.ok(calls[2] instanceof AuthorizeSecurityGroupIngressCommand);
  assert.equal(calls[1].input.CidrIp, '9.9.9.9/32');
  assert.equal(calls[1].input.ToPort, 30);
  assert.equal(calls[2].input.IpPermissions[0].ToPort, 30);
  assert.equal(calls[2].input.IpPermissions[0].IpRanges[0].CidrIp, '5.6.7.8/32');
});
