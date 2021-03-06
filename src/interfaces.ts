import {
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudFormationCustomResourceDeleteEvent,
  CloudFormationCustomResourceResponse
} from "aws-lambda";

export interface FailedResponse {
  Status: "FAILED";
  Reason?: string;
  NoEcho?: boolean;
}
export interface DeleteSuccessResponse {
  Status: "SUCCESS";
}
export interface SuccessResponse extends DeleteSuccessResponse {
  PhysicalResourceId: string;
  NoEcho?: boolean;
  Data?: { [key: string]: string };
}

export type CreateResponse = SuccessResponse | FailedResponse;
export type CreateEventHandler<T extends object> = (
  event: {
    ResourceProperties: T;
  } & Omit<CloudFormationCustomResourceCreateEvent, "ResourceProperties">
) => Promise<CreateResponse>;

export type UpdateResponse = SuccessResponse | FailedResponse;
export type UpdateEventHandler<T extends object> = (
  event: Omit<CloudFormationCustomResourceUpdateEvent, "ResourceProperties"> & {
    ResourceProperties: T;
    OldResourceProperties: T;
  }
) => Promise<UpdateResponse>;

export type DeleteResponse = DeleteSuccessResponse | FailedResponse;
export type DeleteEventHandler<T extends object> = (
  event: Omit<CloudFormationCustomResourceDeleteEvent, "ResourceProperties"> & {
    ResourceProperties: T;
  }
) => Promise<DeleteResponse>;

export type Response = CreateResponse | UpdateResponse | DeleteResponse;

export interface CustomResourceProviderParams<
  T extends object,
  U extends object,
  V extends object
> {
  create: CreateEventHandler<T>;
  update: UpdateEventHandler<U>;
  delete: DeleteEventHandler<V>;
}

export interface SendResponseParams {
  url: string;
  data: string;
}
export interface HandlerResponse {
  statusCode: number;
  data?: CloudFormationCustomResourceResponse;
}
