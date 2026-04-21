const core = require('@actions/core');
const { EC2Client } = require('@aws-sdk/client-ec2');

const region = core.getInput('aws-region', { required: true });
const accessKeyId = core.getInput('aws-access-key-id', { required: false }).trim();
const secretAccessKey = core.getInput('aws-secret-access-key', { required: false }).trim();
const groupIds = core
  .getInput('aws-security-group-id', { required: true })
  .split(',')
  .map(item => item.trim())
  .filter(item => item.length > 0);
const port = Number.parseInt(core.getInput('port', { required: false }), 10);

const toPortInput = core.getInput('to-port', { required: false });
const toPort = toPortInput.length > 0 ? Number.parseInt(toPortInput, 10) : false;

const description = core.getInput('description', { required: false });
const protocol = core.getInput('protocol', { required: false });

if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
  throw new Error('Both aws-access-key-id and aws-secret-access-key must be provided together.');
}

const ec2Config = { region };
if (accessKeyId && secretAccessKey) {
  core.warning('Using aws-access-key-id/aws-secret-access-key is a legacy fallback. Prefer OIDC with aws-actions/configure-aws-credentials.');
  ec2Config.credentials = {
    accessKeyId,
    secretAccessKey,
  };
}

const ec2 = new EC2Client(ec2Config);

module.exports = {
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
