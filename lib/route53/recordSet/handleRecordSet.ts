import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { route53 } from "../../../config";
import { Route53 } from "aws-sdk";
import { getHostedZone } from "../hostedZone/getHostedZone";

export interface HandleRecordSetParams extends Route53.ResourceRecordSet {
  RequestType: "Create" | "Update" | "Delete";
  HostedZoneId?: string;
  HostedZoneName?: string;
  Comment?: string;
}

export const handleRecordSet = async (request: HandleRecordSetParams) => {
  let { HostedZoneId } = request;
  debug("HostedZoneId: ", HostedZoneId);
  if (!HostedZoneId) {
    const response = await getHostedZone({ domainName: `${request.HostedZoneName}` });
    HostedZoneId = response?.Id;
    debug("HostedZoneId: ", HostedZoneId);
  }
  if (!HostedZoneId) throw new Error("must supply either a valid HostedZoneId or a HostedZoneName");
  return route53
    .changeResourceRecordSets({
      HostedZoneId,
      ChangeBatch: {
        Comment:
          request.RequestType === "Delete"
            ? undefined
            : request.Comment || "Thanks for using https://devops.nomad.house",
        Changes: [
          {
            Action: request.RequestType === "Delete" ? "DELETE" : "UPSERT",
            ResourceRecordSet: request
          }
        ]
      }
    })
    .promise();
};
