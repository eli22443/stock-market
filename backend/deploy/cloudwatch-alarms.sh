#!/usr/bin/env bash
#
# cloudwatch-alarms.sh — create the SNS topic + email subscription and the
# CloudWatch alarms that watch the Stock Market backend instance.
#
# Run from your workstation (needs AWS creds), NOT on the EC2 box.
# Idempotent: re-running updates existing alarms and reuses the SNS topic.
#
# Required environment variables (no values are hardcoded):
#   AWS_REGION    e.g. eu-north-1
#   INSTANCE_ID   e.g. i-0123456789abcdef0
#   ALERT_EMAIL   address that receives alarm notifications
#
# Optional overrides:
#   SNS_TOPIC_NAME   (default: stock-market-alerts)
#   METRICS_NAMESPACE(default: StockMarket/Backend)  must match cloudwatch-agent.json
#
# Usage:
#   AWS_REGION=eu-north-1 INSTANCE_ID=i-... ALERT_EMAIL=you@example.com ./cloudwatch-alarms.sh

set -euo pipefail 

: "${AWS_REGION:?Set AWS_REGION}"
: "${INSTANCE_ID:?Set INSTANCE_ID}"
: "${ALERT_EMAIL:?Set ALERT_EMAIL}"

SNS_TOPIC_NAME="${SNS_TOPIC_NAME:-stock-market-alerts}"
METRICS_NAMESPACE="${METRICS_NAMESPACE:-StockMarket/Backend}"

echo "==> Creating / reusing SNS topic ${SNS_TOPIC_NAME}"
TOPIC_ARN="$(aws sns create-topic \
  --region "${AWS_REGION}" \
  --name "${SNS_TOPIC_NAME}" \
  --query "TopicArn" --output text)"
echo "    Topic: ${TOPIC_ARN}"

echo "==> Subscribing ${ALERT_EMAIL} (confirm via the email AWS sends)"
aws sns subscribe \
  --region "${AWS_REGION}" \
  --topic-arn "${TOPIC_ARN}" \
  --protocol email \
  --notification-endpoint "${ALERT_EMAIL}" >/dev/null

common_alarm_args=(
  --region "${AWS_REGION}"
  --alarm-actions "${TOPIC_ARN}"
  --ok-actions "${TOPIC_ARN}"
  --treat-missing-data missing
)

echo "==> Alarm: memory > 85% for 5 min (primary t3.micro guardrail)"
aws cloudwatch put-metric-alarm \
  "${common_alarm_args[@]}" \
  --alarm-name "stock-market-mem-high" \
  --alarm-description "Memory > 85% on the backend instance" \
  --namespace "${METRICS_NAMESPACE}" \
  --metric-name "mem_used_percent" \
  --dimensions "Name=InstanceId,Value=${INSTANCE_ID}" \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold

echo "==> Alarm: disk (root) > 85%"
aws cloudwatch put-metric-alarm \
  "${common_alarm_args[@]}" \
  --alarm-name "stock-market-disk-high" \
  --alarm-description "Root disk usage > 85%" \
  --namespace "${METRICS_NAMESPACE}" \
  --metric-name "disk_used_percent" \
  --dimensions "Name=InstanceId,Value=${INSTANCE_ID}" \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold

echo "==> Alarm: CPU > 80% for 10 min"
aws cloudwatch put-metric-alarm \
  "${common_alarm_args[@]}" \
  --alarm-name "stock-market-cpu-high" \
  --alarm-description "CPUUtilization > 80% for 10 min" \
  --namespace "AWS/EC2" \
  --metric-name "CPUUtilization" \
  --dimensions "Name=InstanceId,Value=${INSTANCE_ID}" \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

echo "==> Alarm: low CPU credit balance (burstable exhaustion)"
aws cloudwatch put-metric-alarm \
  "${common_alarm_args[@]}" \
  --alarm-name "stock-market-cpu-credits-low" \
  --alarm-description "CPUCreditBalance running low — sustained burst usage" \
  --namespace "AWS/EC2" \
  --metric-name "CPUCreditBalance" \
  --dimensions "Name=InstanceId,Value=${INSTANCE_ID}" \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 20 \
  --comparison-operator LessThanThreshold

echo "==> Alarm: EC2 status check failed"
aws cloudwatch put-metric-alarm \
  "${common_alarm_args[@]}" \
  --alarm-name "stock-market-status-check-failed" \
  --alarm-description "Instance or system status check failed" \
  --namespace "AWS/EC2" \
  --metric-name "StatusCheckFailed" \
  --dimensions "Name=InstanceId,Value=${INSTANCE_ID}" \
  --statistic Maximum \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold

echo
echo "Done. Confirm the SNS subscription from the email AWS just sent,"
echo "otherwise alarm notifications will not be delivered."
