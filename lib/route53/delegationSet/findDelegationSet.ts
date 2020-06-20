import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { Route53 } from "aws-sdk";
import { listDelegationSets } from "./listDelegationSets";

export const findDelegationSet = async (
  callerReference: string
): Promise<Route53.DelegationSet | undefined> => {
  const existing = await listDelegationSets();
  debug("existing DelegationSets: ", existing);
  return existing.find(set => set.CallerReference === callerReference);
};
