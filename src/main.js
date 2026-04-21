const core = require('@actions/core');
const {
  AuthorizeSecurityGroupIngressCommand,
  DescribeSecurityGroupsCommand,
  RevokeSecurityGroupIngressCommand,
} = require('@aws-sdk/client-ec2');
const publicIp = require('public-ip');

async function run(runtimeConfig, ipLookup = publicIp.v4) {
  const effectiveConfig = runtimeConfig || require('./config');
  try {
    const result = await effectiveConfig.ec2.send(new DescribeSecurityGroupsCommand({
      GroupIds: effectiveConfig.groupIds,
    }));

    for (const group of result.SecurityGroups || []) {
      const ruleByPort = (group.IpPermissions || []).find(permission => {
        if (effectiveConfig.toPort !== false) {
          return permission.FromPort === effectiveConfig.port
            && permission.ToPort === effectiveConfig.toPort
            && permission.IpProtocol === effectiveConfig.protocol;
        }

        return permission.FromPort === effectiveConfig.port && permission.IpProtocol === effectiveConfig.protocol;
      });

      if (ruleByPort) {
        const ipByDesc = (ruleByPort.IpRanges || []).find(ip => ip.Description === effectiveConfig.description);

        if (ipByDesc) {
          await effectiveConfig.ec2.send(new RevokeSecurityGroupIngressCommand({
            GroupId: group.GroupId,
            CidrIp: ipByDesc.CidrIp,
            IpProtocol: effectiveConfig.protocol,
            FromPort: effectiveConfig.port,
            ToPort: effectiveConfig.toPort !== false ? effectiveConfig.toPort : effectiveConfig.port,
          }));
        }
      }

      const myPublicIp = await ipLookup();
      await effectiveConfig.ec2.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: group.GroupId,
        IpPermissions: [{
          IpProtocol: effectiveConfig.protocol,
          FromPort: effectiveConfig.port,
          ToPort: effectiveConfig.toPort !== false ? effectiveConfig.toPort : effectiveConfig.port,
          IpRanges: [{
            CidrIp: `${myPublicIp}/32`,
            Description: effectiveConfig.description,
          }],
        }],
      }));

      core.info(`The IP ${myPublicIp} is added`);
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

module.exports = { run };

if (require.main === module) {
  run();
}
