import { Debug } from "../../src/utils";
const debug = Debug(__dirname, __filename);
import { ACM } from "aws-sdk";
import { createCertRecordSet, getHostedZone } from "../route53";
import { acm } from "../../config";

export const requestCertificate = async ({
  DomainName = "",
  IdempotencyToken,
  Tags,
  DomainValidationOptions,
  Options,
  SubjectAlternativeNames
}: Partial<ACM.RequestCertificateRequest>) => {
  const params: ACM.RequestCertificateRequest = {
    DomainName,
    IdempotencyToken,
    SubjectAlternativeNames: [`*.${DomainName}`],
    ValidationMethod: "DNS",
    Options: { ...Options, CertificateTransparencyLoggingPreference: "ENABLED" }
  };
  if (Tags) params.Tags = Tags;
  if (DomainValidationOptions) params.DomainValidationOptions = DomainValidationOptions;
  if (SubjectAlternativeNames?.length) {
    for (const alt of SubjectAlternativeNames) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (alt !== params.SubjectAlternativeNames![0]) {
        SubjectAlternativeNames.push(alt);
      }
    }
  }
  debug("request params: ", params);
  const { CertificateArn = "" } = await acm.requestCertificate(params).promise();
  debug("CertificateArn: ", CertificateArn);
  const { Certificate } = await acm.describeCertificate({ CertificateArn }).promise();
  debug("Certificate: ", Certificate);
  const { Id = "" } = (await getHostedZone({ domainName: DomainName })) || {};
  debug("HostedZoneId", Id);
  const dnsValidationOptions = Certificate?.DomainValidationOptions?.filter(option => {
    if (option?.ValidationMethod?.toLowerCase() === "dns") return true;
  });
  debug("dnsValidationOptions", dnsValidationOptions);

  for (const option of dnsValidationOptions || []) {
    await createCertRecordSet({
      HostedZoneId: Id.split("/").pop() || "",
      recordSetName: `${option.ResourceRecord?.Name}`,
      recordSetValue: `${option.ResourceRecord?.Value}`
    });
  }

  return Certificate;
};
