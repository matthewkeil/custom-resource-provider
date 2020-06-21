import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { Route53 } from "aws-sdk";
import { route53 } from "../../../config";
import { normalizeDomain } from "../../normalizeDomain";
import { listHostedZones } from "./listHostedZones";
import { HostedZoneInfo } from "./HostedZoneInfo";

export const getHostedZone = async ({
  domainName,
  id
}: {
  id?: string;
  domainName?: string;
}): Promise<HostedZoneInfo | undefined> => {
  let Id = id;
  if (!Id) {
    const hostedZones = await listHostedZones();
    const hostedZone = hostedZones.find(
      ({ Name }) =>
        normalizeDomain(Name).includes(normalizeDomain(domainName)) ||
        normalizeDomain(domainName).includes(normalizeDomain(Name))
    );
    Id = hostedZone?.Id;
  }
  if (!Id) {
    throw new Error(
      "must provide domain assocaited with an existing HostedZone or a valid HostedZoneId"
    );
  }

  let HostedZone, VPCs, DelegationSet;
  try {
    ({ HostedZone, VPCs, DelegationSet } = await route53.getHostedZone({ Id }).promise());
  } catch (err) {
    // TODO: figure out error code for no hosted zone and return undefined for that but throw the rest
    console.log(err);
    return;
  }

  let HostedZoneTags: undefined | Route53.TagList;
  try {
    const { ResourceTagSet } = await route53
      .listTagsForResource({ ResourceId: Id, ResourceType: "hostedzone" })
      .promise();
    HostedZoneTags = ResourceTagSet?.Tags;
  } catch {}

  let QueryLoggingConfig: undefined | Route53.QueryLoggingConfig;
  try {
    const queryConfig = await route53.getQueryLoggingConfig({ Id }).promise();
    QueryLoggingConfig = queryConfig.QueryLoggingConfig;
  } catch {}

  return {
    ...HostedZone,
    VPCs,
    DelegationSet,
    HostedZoneTags,
    QueryLoggingConfig
  };
};
