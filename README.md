# AWS Security Group Add IP Action

This action adds the runner's public IPv4 address to one or more AWS security groups and removes it in the post step.
If an existing rule matches `port`/`to-port`/`protocol` and has the same `description`, the action revokes that old CIDR first, then adds the current one.

## Inputs

### `aws-region`

**Required** AWS Region.

### `aws-security-group-id`

**Required** AWS Security Group ID (comma separated if multiple).

### `aws-access-key-id`

Optional legacy fallback. Prefer OIDC with `aws-actions/configure-aws-credentials`.

### `aws-secret-access-key`

Optional legacy fallback. Prefer OIDC with `aws-actions/configure-aws-credentials`.

### `protocol`

Protocol to allow. Default: `"tcp"`.

### `port`

From port to allow. Default: `"22"`.

### `to-port`

Optional to-port. Default: `""`.
Leave empty to allow a single port (`ToPort = FromPort`).

### `description`

Description for the IP permission. Default: `"GitHub Action"`.

## Recommended usage (OIDC)

```yaml
name: Example

on: [workflow_dispatch]

permissions:
  id-token: write
  contents: read

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-role
          aws-region: us-east-1

      - name: Add public IP to AWS security group
        uses: IronCloud/aws-security-group-add-ip-action@v1
        with:
          aws-region: us-east-1
          aws-security-group-id: ${{ secrets.AWS_SECURITY_GROUP_ID }}
          port: '22'
          protocol: 'tcp'
          description: 'GitHub Action'
```

## Legacy static-key usage (fallback)

```yaml
- name: Add public IP to AWS security group
  uses: IronCloud/aws-security-group-add-ip-action@v1
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1
    aws-security-group-id: ${{ secrets.AWS_SECURITY_GROUP_ID }}
```

## Required IAM permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "UpdateIngress",
      "Effect": "Allow",
      "Action": [
        "ec2:RevokeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupIngress"
      ],
      "Resource": "arn:aws:ec2:your-region:your-account-id:security-group/your-security-group-id"
    },
    {
      "Sid": "DescribeGroups",
      "Effect": "Allow",
      "Action": "ec2:DescribeSecurityGroups",
      "Resource": "*"
    }
  ]
}
```

Replace `your-region`, `your-account-id`, and `your-security-group-id` with your values.
