import { utter } from "@/lib/utter";

// Everything Utter and Northwind CRM's own screens need, from the utter-sdk package: the action
// list and signed action calls from Utter, and the routes the Utter button uses.
export const { GET, POST } = utter.handler;
