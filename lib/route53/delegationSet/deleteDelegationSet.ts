import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { route53, DELEGATION_SET_CALLER_REFERENCE } from "../../../config";
import { listHostedZones } from "../hostedZone/listHostedZones";
import { findDelegationSet } from "./findDelegationSet";

export const deleteDelegationSet = async ({ callerReference }: { callerReference?: string }) => {
  const CallerReference = callerReference || DELEGATION_SET_CALLER_REFERENCE;
  const delegastionSet = await findDelegationSet(CallerReference);
  if (!delegastionSet) {
    throw new Error("there is no delegation set with the callerReference " + CallerReference);
  }

  const hostedZones = await listHostedZones(delegastionSet.Id);

  if (hostedZones.length) {
    throw new Error("DeletgationSet is in use by one or more HostedZones and cannot be deleted");
  }

  await route53.deleteReusableDelegationSet({ Id: `${delegastionSet.Id}` }).promise();
  debug("deleted delegation set: ", { delegationSet: delegastionSet });

  return;
};
