export interface HostedZoneInfo extends AWS.Route53.HostedZone {
  VPCs?: AWS.Route53.VPCs;
  DelegationSet?: AWS.Route53.DelegationSet;
  HostedZoneTags?: AWS.Route53.TagList;
  QueryLoggingConfig?: AWS.Route53.QueryLoggingConfig;
}
