import { Debug } from "./debug";
const debug = Debug();
import { CloudFormationCustomResourceEvent } from "aws-lambda";
import { CustomResourceProvider } from "./CustomResourceProvider";
import { CreateEventHandler, DeleteEventHandler, UpdateEventHandler } from "./interfaces";

const hanldleEvent = (params?: { throwErr?: boolean; error?: boolean }) => async (
  event: CloudFormationCustomResourceEvent
) => {
  const { throwErr, error } = params || {};
  debug({ throwErr, error, event });
  const response: any = {
    Status: error ? "FAILED" : "SUCCESS"
  };

  if (!error) {
    if (throwErr) throw new Error("errored good, yo'");
    return response;
  }

  response.Data = {
    Name: event.ResourceProperties.Name
  };
  return response;
};

const SuccessProvider = new CustomResourceProvider({
  create: hanldleEvent() as CreateEventHandler<any>,
  update: hanldleEvent() as UpdateEventHandler<any>,
  delete: hanldleEvent() as DeleteEventHandler<any>
});
const ErrorProvider = new CustomResourceProvider({
  create: hanldleEvent({ error: true }) as CreateEventHandler<any>,
  update: hanldleEvent({ error: true }) as UpdateEventHandler<any>,
  delete: hanldleEvent({ error: true }) as DeleteEventHandler<any>
});
const ThrowErrorProvider = new CustomResourceProvider({
  create: hanldleEvent({ throwErr: true, error: true }) as CreateEventHandler<any>,
  update: hanldleEvent({ throwErr: true, error: true }) as UpdateEventHandler<any>,
  delete: hanldleEvent({ throwErr: true, error: true }) as DeleteEventHandler<any>
});

export const testProviders = {
  Error: ErrorProvider,
  Success: SuccessProvider,
  ThrowError: ThrowErrorProvider
};
