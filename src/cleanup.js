const { RevokeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');
const { loadConfig } = require('./config');

async function getCore() {
  return import('@actions/core');
}

async function defaultIpLookup() {
  const { publicIpv4 } = await import('public-ip');
  return publicIpv4();
}

async function run(runtimeConfig, ipLookup) {
  const core = await getCore();
  try {
    const effectiveConfig = runtimeConfig || await loadConfig(core);
    const lookup = ipLookup || defaultIpLookup;
    const myPublicIp = await lookup();

    for (const groupId of effectiveConfig.groupIds) {
      await effectiveConfig.ec2.send(new RevokeSecurityGroupIngressCommand({
        GroupId: groupId,
        CidrIp: `${myPublicIp}/32`,
        IpProtocol: effectiveConfig.protocol,
        FromPort: effectiveConfig.port,
        ToPort: effectiveConfig.toPort !== false ? effectiveConfig.toPort : effectiveConfig.port,
      }));
    }

    core.info(`The IP ${myPublicIp} is removed`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

module.exports = { run };

if (require.main === module) {
  run();
}
