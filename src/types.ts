import {
  ForceReply,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from "@grammyjs/types";

const CATEGORIES = [
  "RSUD",
  "PUSKESMAS",
  "SEKOLAH NEGERI",
  "DINAS",
  "SETDA",
  "BAPENDA",
  "POLDA",
] as const;
const PROPERTIES = [
  "submit_proposal",
  "connectivity",
  "eazy",
  "oca",
  "digiclinic",
  "pijar",
  "sprinthink",
  "nilai_project",
] as const;

type CustomerCategory = (typeof CATEGORIES)[number];
type CustomerProperty = (typeof PROPERTIES)[number];
type ReplyMarkup = InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
type UserCache = {
  userState:
    | "is_selecting_category"
    | "empty_category"
    | "is_selecting_customer"
    | "create_customer"
    | "update_customer"
    | "delete_customer"
    | "is_selecting_property";
  customer_category?: CustomerCategory;
  customer_list?: [number, string][] | null;
  customer_name?: string | null;
  customer_property?: CustomerProperty | null;
};

interface MyPostData extends GoogleAppsScript.Events.AppsScriptHttpRequestEventPostData {
  getDataAsString(): string;
}
interface DoPostEvent extends GoogleAppsScript.Events.DoPost {
  postData: MyPostData;
}
