import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { Route53 } from "aws-sdk";
import { route53 } from "../../../config";
import { findDelegationSet } from "../delegationSet/findDelegationSet";
import { getHostedZone } from "./getHostedZone";
import { HostedZoneInfo } from "./HostedZoneInfo";

export interface HostedZoneParams {
  Name: string;
  DelegationSetCallerReference?: string;
  HostedZoneConfig?: AWS.Route53.HostedZoneConfig;
  HostedZoneTags?: AWS.Route53.TagList;
  QueryLoggingConfig?: AWS.Route53.QueryLoggingConfig;
  VPCs?: AWS.Route53.VPCs;
}

type CreateRequest = {
  RequestId: string;
  ResourceProperties: Partial<HostedZoneParams>;
};

export const createHostedZone = async ({
  RequestId,
  ResourceProperties
}: CreateRequest): Promise<HostedZoneInfo> => {
  const {
    Name,
    DelegationSetCallerReference,
    HostedZoneConfig = {},
    HostedZoneTags,
    QueryLoggingConfig,
    VPCs
  } = ResourceProperties;

  if (!HostedZoneConfig.Comment) {
    HostedZoneConfig.Comment = "brought to you by https://devops.nomad.house";
  }

  const deletgationSet = await findDelegationSet(DelegationSetCallerReference);
  const params = {
    CallerReference: RequestId,
    Name,
    DelegationSetId: deletgationSet?.Id,
    HostedZoneConfig
  } as Route53.CreateHostedZoneRequest;

  if (!!params.DelegationSetId) {
    // HostedZones associated with DelegationSets cannot be private
    HostedZoneConfig.PrivateZone = false;
  }

  if (VPCs) params.VPC = VPCs[0];
  const { HostedZone } = await route53.createHostedZone(params).promise();
  const Id = `${HostedZone.Id.split("/").pop()}`;

  if (VPCs && VPCs.length > 1) {
    for (const vpc of VPCs.slice(1)) {
      await route53.associateVPCWithHostedZone({ HostedZoneId: Id, VPC: vpc }).promise();
    }
  }

  if (HostedZoneTags?.length) {
    await route53
      .changeTagsForResource({
        ResourceId: Id,
        ResourceType: "hostedzone",
        AddTags: HostedZoneTags
      })
      .promise();
  }

  if ((QueryLoggingConfig as Route53.QueryLoggingConfig)?.CloudWatchLogsLogGroupArn) {
    await route53
      .createQueryLoggingConfig({
        HostedZoneId: Id,
        CloudWatchLogsLogGroupArn: `${QueryLoggingConfig?.CloudWatchLogsLogGroupArn}`
      })
      .promise();
  }

  return (await getHostedZone({ id: Id })) as HostedZoneInfo;
};
