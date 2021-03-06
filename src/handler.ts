import { Debug } from "./debug";
const debug = Debug();
import { CloudFormationCustomResourceHandler } from "aws-lambda";
import { CustomResourceProvider } from "./CustomResourceProvider";
import { testProviders } from "./testProviders";

export const buildHandler = (resources: {
  [resource: string]: CustomResourceProvider;
}): CloudFormationCustomResourceHandler => {
  type Resource = keyof typeof resources;
  const resourceTypes = new Set<Resource>(Object.keys(resources) as Resource[]);

  return async (event, context) => {
    const type = event.ResourceType.split("::").pop() as Resource;
    debug({ type, event, context });
    if (resourceTypes.has(type)) {
      const results = await resources[type].handle(event, context);
      return debug({ results });
    }

    const response = await CustomResourceProvider.handleError({
      event,
      Reason: "NomadDevops doesn't have that kind of custom resource"
    });
    debug({ response });
  };
};

export const testHandler = buildHandler({
  ...testProviders
});
export const dlqTest: CloudFormationCustomResourceHandler = async (event, context) => {
  console.log("dlqTest handler: ", { event, context });
  throw new Error("dlq test error. it works!! me thinks...");
};
