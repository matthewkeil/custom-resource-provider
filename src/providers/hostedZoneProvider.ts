import {
  CustomProvider,
  CreateEventHandler,
  UpdateEventHandler,
  DeleteEventHandler
} from "../CustomProvider";
import { HostedZoneParams, createHostedZone, updateHostedZone, deleteHostedZone } from "../../lib";
import { HostedZoneInfo } from "../../lib/route53/hostedZone/HostedZoneInfo";

interface HostedZoneData {
  [key: string]: string;
  Id: string;
  NameServers: string;
}
const buildData = ({ Id, DelegationSet }: HostedZoneInfo): HostedZoneData => {
  return {
    Id: `${Id?.split("/").pop()}`,
    NameServers: `${DelegationSet?.NameServers.join(" ")}`
  };
};

export const create: CreateEventHandler<HostedZoneParams> = async event => {
  const hostedZoneInfo = await createHostedZone(event);
  return {
    Status: "SUCCESS",
    Data: buildData(hostedZoneInfo)
  };
};

export const update: UpdateEventHandler<HostedZoneParams> = async event => {
  const hostedZoneInfo = await updateHostedZone(event);
  return {
    Status: "SUCCESS",
    Data: buildData(hostedZoneInfo)
  };
};

export const _delete: DeleteEventHandler<HostedZoneParams> = async event => {
  await deleteHostedZone(event);
  return { Status: "SUCCESS" };
};

export const delegationSetProvider = new CustomProvider({ create, update, delete: _delete });
