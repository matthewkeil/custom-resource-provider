import {
  CustomProvider,
  CreateEventHandler,
  UpdateEventHandler,
  DeleteEventHandler
} from "../CustomProvider";
import { createDelegationSet } from "../../lib/route53/delegationSet/createDelegationSet";
import { deleteDelegationSet } from "../../lib/route53/delegationSet/deleteDelegationSet";

interface CreateDelegationSetParams {
  CallerRefernce?: string;
  DomainName?: string;
}
export const create: CreateEventHandler<CreateDelegationSetParams> = async event => {
  const { CallerRefernce, DomainName } = event.ResourceProperties;
  const { Id, NameServers } = await createDelegationSet({
    callerReference: CallerRefernce,
    domainName: DomainName
  });

  return {
    Status: "SUCCESS",
    Data: {
      Id: `${Id?.split("/").pop()}`,
      NameServers: NameServers.join(" ")
    }
  };
};

export const update: UpdateEventHandler = async () => {
  throw new Error(
    `Custom::DelegationSet cannot be updated. Delete the existing one and recreate it, or create one with a different CallerRefernce`
  );
};

interface DeleteDelegationSetParams {
  CallerRefernce?: string;
  DomainName?: string;
}
export const _delete: DeleteEventHandler<DeleteDelegationSetParams> = async event => {
  const { CallerRefernce } = event.ResourceProperties;
  await deleteDelegationSet({
    callerReference: CallerRefernce
  });
  return { Status: "SUCCESS" };
};

export const delegationSetProvider = new CustomProvider({ create, update, delete: _delete });
