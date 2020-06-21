import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { Route53 } from "aws-sdk";
import { route53, DELEGATION_SET_CALLER_REFERENCE } from "../../../config";
import { findDelegationSet } from "./findDelegationSet";
import { getHostedZone } from "../hostedZone/getHostedZone";

export const createDelegationSet = async ({
  callerReference,
  domainName
}: {
  callerReference?: string;
  domainName?: string;
}): Promise<Route53.DelegationSet> => {
  const CallerReference = callerReference || DELEGATION_SET_CALLER_REFERENCE;
  const existing = await findDelegationSet(CallerReference);
  if (existing) {
    throw new Error(`A delegationSet with callerReference ${callerReference} already exists`);
  }

  const request: Route53.CreateReusableDelegationSetRequest = {
    CallerReference
  };
  // look to see if a HostedZone for the domain already exists and
  // if so make the delegation set match the existing NS
  if (domainName) {
    const hostedZoneId = await getHostedZone({ domainName });
    if (hostedZoneId?.Id) request.HostedZoneId = hostedZoneId.Id.split("/").pop();
  }

  debug("CreateDelegationSetRequest: ", request);
  const { DelegationSet } = await route53.createReusableDelegationSet(request).promise();
  return DelegationSet;
};
