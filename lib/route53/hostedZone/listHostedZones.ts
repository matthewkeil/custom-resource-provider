import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { route53 } from "../../../config";

export const listHostedZones = async (DelegationSetId?: string) => {
  const existing = [] as AWS.Route53.HostedZones;
  let Marker: undefined | string;
  do {
    const { HostedZones, NextMarker } = await route53
      .listHostedZones({ Marker, DelegationSetId })
      .promise();
    debug("NextMarker: ", NextMarker);
    existing.push(...(HostedZones?.length ? HostedZones : []));
    Marker = NextMarker;
  } while (!!Marker);
  return existing;
};
