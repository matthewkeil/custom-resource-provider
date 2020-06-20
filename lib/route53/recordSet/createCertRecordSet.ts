import { Debug } from "../../../src/utils";
const debug = Debug(__dirname, __filename);
import { route53 } from "../../../config";

interface CertRecordSetParams {
  HostedZoneId: string;
  recordSetName: string;
  recordSetValue: string;
}

export const createCertRecordSet = async ({
  HostedZoneId,
  recordSetName,
  recordSetValue
}: CertRecordSetParams) => {
  const { ResourceRecordSets } = await route53
    .listResourceRecordSets({
      HostedZoneId,
      StartRecordName: recordSetName,
      StartRecordType: "CNAME"
    })
    .promise();

  // TODO: what is this actually checking for?? need to look deeper for meaningful telemetry
  if (!!ResourceRecordSets.length) {
    return;
  }

  return route53
    .changeResourceRecordSets({
      HostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: recordSetName,
              ResourceRecords: [
                {
                  Value: recordSetValue
                }
              ],
              TTL: 60,
              Type: "CNAME"
            }
          }
        ],
        Comment: "RecordSet for SSL Certificate Validation"
      }
    })
    .promise();
};
