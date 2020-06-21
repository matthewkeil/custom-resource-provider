import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { Route53 } from "aws-sdk";
import { listDelegationSets } from "./listDelegationSets";
import { DELEGATION_SET_CALLER_REFERENCE } from "../../../config";

export const findDelegationSet = async (
  callerReference?: string
): Promise<Route53.DelegationSet | undefined> => {
  const existing = await listDelegationSets();
  debug("existing DelegationSets: ", existing);
  const CallerReference = callerReference || DELEGATION_SET_CALLER_REFERENCE;
  return existing.find(set => set.CallerReference === CallerReference);
};
