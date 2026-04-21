const core = require('@actions/core');
const { RevokeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');
const publicIp = require('public-ip');

async function run(runtimeConfig, ipLookup = publicIp.v4) {
  const effectiveConfig = runtimeConfig || require('./config');
  try {
    const myPublicIp = await ipLookup();

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
