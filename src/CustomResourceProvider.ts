import { Debug } from "./debug";
const debug = Debug();
import { parse } from "url";
import { request } from "https";
import { generate as Generate } from "shortid";
const generate = () => Generate().replace(/[-_]/g, `${Math.floor(Math.random() * 10)}`);
import {
  CloudFormationCustomResourceUpdateEvent,
  CloudFormationCustomResourceResponse,
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceFailedResponse,
  CloudFormationCustomResourceSuccessResponse,
  Context
} from "aws-lambda";
import {
  CustomResourceProviderParams,
  SendResponseParams,
  FailedResponse,
  CreateEventHandler,
  UpdateEventHandler,
  DeleteEventHandler,
  HandlerResponse,
  Response,
  SuccessResponse
} from "./interfaces";

export function send({ url, data }: SendResponseParams) {
  return new Promise<HandlerResponse>((resolve, reject) => {
    const { host, path } = parse(url);
    debug({ url, host, path });

    const req = request(
      {
        method: "PUT",
        host,
        port: 443,
        path,
        headers: {
          "content-type": "",
          "content-length": data.length
        }
      },
      response => {
        resolve({ statusCode: response.statusCode || 500 });
      }
    );

    req.on("error", err => {
      debug({ message: "ERROR: req.on('error') in send()", err });
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

const defaultHandler = (type: keyof CustomResourceProviderParams) => async (): Promise<
  FailedResponse
> => ({
  Status: "FAILED",
  Reason: `${type} handler is not implemented`
});

export class CustomResourceProvider {
  public static prepareResponse(
    event: CloudFormationCustomResourceEvent,
    results: Response
  ): CloudFormationCustomResourceResponse {
    let PhysicalResourceId: string;
    if (results.hasOwnProperty("PhysicalResourceId")) {
      // if developer returns a value from handler use that
      PhysicalResourceId = (results as SuccessResponse).PhysicalResourceId;
    } else if (event.hasOwnProperty("PhysicalResourceId")) {
      // otherwise use the value that is on the event if it exists (same resource was updated)
      PhysicalResourceId = (event as CloudFormationCustomResourceUpdateEvent).PhysicalResourceId;
    } else {
      // set to default for creation events where no value is returned from handler
      PhysicalResourceId = `${event.ResourceType.split("::").pop()}-${generate()}`;
    }

    const response: Partial<CloudFormationCustomResourceResponse> = {
      PhysicalResourceId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      StackId: event.StackId,
      Status: results.Status || "FAILED"
    };

    if (response.Status === "FAILED") {
      response.Reason = !!(results as FailedResponse).Reason?.length
        ? (results as FailedResponse).Reason
        : "unknown reason for failure";
      return response as CloudFormationCustomResourceFailedResponse;
    }

    if (event.RequestType !== "Delete" && results.hasOwnProperty("NoEcho")) {
      response.NoEcho = (results as SuccessResponse).NoEcho;
    }

    if (event.RequestType !== "Delete" && results.hasOwnProperty("Data")) {
      response.Data = (results as SuccessResponse).Data;
    }

    return response as CloudFormationCustomResourceSuccessResponse;
  }

  public static handleError({
    event,
    Reason
  }: {
    event: CloudFormationCustomResourceEvent;
    Reason: string;
  }) {
    debug("handleError: ", { event, Reason });
    const response = CustomResourceProvider.prepareResponse(event, { Status: "FAILED", Reason });
    return send({ url: event.ResponseURL, data: JSON.stringify(response) });
  }

  private _send = send;
  private create: CreateEventHandler<any>;
  private update: UpdateEventHandler<any>;
  private delete: DeleteEventHandler<any>;

  constructor(params: CustomResourceProviderParams) {
    debug("constructor params: ", { params });
    const { create, update, delete: _delete } = params || {};
    /**
     * validate params. verify that create, update and delete are
     * functions and take a single argument. if not add the default
     * handler that returns an  error saying the handler wasnt
     * implemented correctly
     */
    if (typeof create !== "function" || create.length !== 1)
      debug("create handler must be a function. usind default 'fail' handler");
    this.create = !!create ? create : defaultHandler("create");

    if (typeof update !== "function" || update.length !== 1)
      debug("update handler must be a function. usind default 'fail' handler");
    this.update = !!update ? update : defaultHandler("update");

    if (typeof _delete !== "function" || _delete.length !== 1)
      debug("delete handler must be a function. usind default 'fail' handler");
    this.delete = !!_delete ? _delete : defaultHandler("delete");

    Object.freeze(this);
  }

  public async handle(event: CloudFormationCustomResourceEvent, context: Context): Promise<void> {
    const timer = setTimeout(() => {
      const res = CustomResourceProvider.prepareResponse(event, {
        Status: "FAILED",
        Reason: "resource provider timed out"
      });
      this._send({ url: event.ResponseURL, data: JSON.stringify(res) }).catch(err =>
        CustomResourceProvider.handleError(err)
      );
    }, context.getRemainingTimeInMillis() - 1000);

    let response!: CloudFormationCustomResourceResponse;
    try {
      debug({ event });
      let results: Response;
      switch (event.RequestType) {
        case "Create":
          results = await this.create(event);
          break;
        case "Update":
          results = await this.update(event);
          break;
        case "Delete":
          results = await this.delete(event);
          break;
        default:
          results = {
            Status: "FAILED",
            Reason: "invalid event.RequestType"
          };
      }
      debug({ results });
      response = CustomResourceProvider.prepareResponse(event, results as Response);
    } catch (err) {
      console.log({ err });
      response = CustomResourceProvider.prepareResponse(event, {
        Status: "FAILED",
        Reason: err.message
      });
    } finally {
      debug({ response });
      clearTimeout(timer);
      await this._send({ url: event.ResponseURL, data: JSON.stringify(response) });
    }
  }
}
