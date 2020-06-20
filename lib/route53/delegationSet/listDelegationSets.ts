import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { Route53 } from "aws-sdk";
import { route53 } from "../../../config";

export const listDelegationSets = async (): Promise<Route53.DelegationSet[]> => {
  const existing = [] as Route53.DelegationSet[];
  let Marker: undefined | string;
  do {
    const { DelegationSets, NextMarker } = await route53
      .listReusableDelegationSets({ Marker })
      .promise();
    debug("NextMarker: ", NextMarker);
    existing.push(...(DelegationSets?.length ? DelegationSets : []));
    Marker = NextMarker;
  } while (!!Marker);
  return existing;
};
