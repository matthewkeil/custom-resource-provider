import { Debug } from "./utils";
const debug = Debug(__dirname, __filename);
import { CloudFormationCustomResourceEvent } from "aws-lambda";
import {
  CustomResourceProvider,
  CreateEventHandler,
  UpdateEventHandler,
  DeleteEventHandler
} from "./CustomResourceProvider";

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
  create: hanldleEvent() as CreateEventHandler,
  update: hanldleEvent() as UpdateEventHandler,
  delete: hanldleEvent() as DeleteEventHandler
});
const ErrorProvider = new CustomResourceProvider({
  create: hanldleEvent({ error: true }) as CreateEventHandler,
  update: hanldleEvent({ error: true }) as UpdateEventHandler,
  delete: hanldleEvent({ error: true }) as DeleteEventHandler
});
const ThrowErrorProvider = new CustomResourceProvider({
  create: hanldleEvent({ throwErr: true, error: true }) as CreateEventHandler,
  update: hanldleEvent({ throwErr: true, error: true }) as UpdateEventHandler,
  delete: hanldleEvent({ throwErr: true, error: true }) as DeleteEventHandler
});

export const testProviders = {
  Error: ErrorProvider,
  Success: SuccessProvider,
  ThrowError: ThrowErrorProvider
};
