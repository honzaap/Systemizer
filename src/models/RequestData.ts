import { Connection } from "./Connection";

export class RequestData{
    header: any;
    data: any;
    origin: Connection;
    originID: string;
    requestId: string;
    responseId: string;
}