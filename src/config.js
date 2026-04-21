const { EC2Client } = require('@aws-sdk/client-ec2');

async function loadConfig(core) {
  const effectiveCore = core || await import('@actions/core');

  const region = effectiveCore.getInput('aws-region', { required: true });
  const accessKeyId = effectiveCore.getInput('aws-access-key-id', { required: false }).trim();
  const secretAccessKey = effectiveCore.getInput('aws-secret-access-key', { required: false }).trim();
  const groupIds = effectiveCore
    .getInput('aws-security-group-id', { required: true })
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
  const port = Number.parseInt(effectiveCore.getInput('port', { required: false }), 10);

  const toPortInput = effectiveCore.getInput('to-port', { required: false });
  const toPort = toPortInput.length > 0 ? Number.parseInt(toPortInput, 10) : false;

  const description = effectiveCore.getInput('description', { required: false });
  const protocol = effectiveCore.getInput('protocol', { required: false });

  if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
    throw new Error('Both aws-access-key-id and aws-secret-access-key must be provided together.');
  }

  const ec2Config = { region };
  if (accessKeyId && secretAccessKey) {
    effectiveCore.warning('Using aws-access-key-id/aws-secret-access-key is a legacy fallback. Prefer OIDC with aws-actions/configure-aws-credentials.');
    ec2Config.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }

  const ec2 = new EC2Client(ec2Config);

  return {
    region,
    accessKeyId,
    secretAccessKey,
    groupIds,
    port,
    toPort,
    protocol,
    description,
    ec2,
  };
}

module.exports = { loadConfig };
