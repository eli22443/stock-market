# IAM for GitHub Actions + SSM Deploys

This setup lets GitHub Actions deploy to EC2 without SSH keys or long-lived AWS access keys.

## Files

| File | Purpose |
|------|---------|
| `github-actions-trust.json` | Trust policy for GitHub OIDC (`eli22443/stock-market`, branch `master`) |
| `github-actions-permissions.json` | Inline policy for the GitHub role to call SSM Run Command |
| `ec2-instance-permissions.json` | Inline policy for the EC2 role to read `/stock-market/prod/*` parameters |

Replace placeholders in the IAM JSON files before applying:

- `<AWS_ACCOUNT_ID>`
- `<AWS_REGION>`
- `<EC2_INSTANCE_ID>`

Use your own IAM role name when creating the deploy role (example below: `github-actions-deploy-role`).

## One-time AWS setup

### 1. Create GitHub OIDC provider

Create once per AWS account:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

If the provider already exists, skip this step.

### 2. Create GitHub deploy role

```bash
aws iam create-role \
  --role-name github-actions-deploy-role \
  --assume-role-policy-document file://backend/deploy/iam/github-actions-trust.json

aws iam put-role-policy \
  --role-name github-actions-deploy-role \
  --policy-name stock-market-ssm-deploy \
  --policy-document file://backend/deploy/iam/github-actions-permissions.json
```

Save the role ARN for GitHub Actions:

```bash
aws iam get-role \
  --role-name github-actions-deploy-role \
  --query 'Role.Arn' \
  --output text
```

### 3. Configure EC2 instance role

Attach these managed policies to the EC2 instance role:

- `AmazonSSMManagedInstanceCore`
- Later for CloudWatch: `CloudWatchAgentServerPolicy`

Add the inline policy from `ec2-instance-permissions.json` to the EC2 instance role:

```bash
aws iam put-role-policy \
  --role-name stock-market-ec2-role \
  --policy-name stock-market-read-ssm-params \
  --policy-document file://backend/deploy/iam/ec2-instance-permissions.json
```

Attach the role to the running EC2 instance if it does not already have it:

```bash
aws ec2 associate-iam-instance-profile \
  --region <AWS_REGION> \
  --instance-id <EC2_INSTANCE_ID> \
  --iam-instance-profile Name=stock-market-ec2-role
```

## GitHub repository variables

Set these in GitHub:

`Settings -> Secrets and variables -> Actions -> Variables`

| Variable | Description |
|----------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | ARN of the GitHub OIDC deploy role (e.g. `arn:aws:iam::<account-id>:role/<role-name>`) |
| `AWS_REGION` | AWS region for SSM commands (e.g. `eu-north-1`) |
| `EC2_INSTANCE_ID` | Target EC2 instance id (e.g. `i-...`) |

Set these at repository level or under the workflow `production` environment. The workflow reads them via `${{ vars.* }}` — do not commit account IDs or instance IDs into the repo.

## Verify SSM before using CI/CD

On your machine:

```bash
aws ssm send-command \
  --region "$AWS_REGION" \
  --document-name AWS-RunShellScript \
  --instance-ids "$EC2_INSTANCE_ID" \
  --parameters 'commands=["hostname","systemctl is-active stock-market"]'
```

If this command does not reach the instance, check:

- The EC2 instance has `AmazonSSMManagedInstanceCore`
- SSM Agent is running on EC2
- The instance has outbound internet access
- The GitHub role policy uses the correct instance ARN/account id
