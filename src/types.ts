import {
  ForceReply,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from "@grammyjs/types";

export const CATEGORIES = [
  "RSUD",
  "PUSKESMAS",
  "SEKOLAH NEGERI",
  "DINAS",
  "SETDA",
  "BAPENDA",
  "POLDA",
] as const;

export const PROPERTIES = [
  "submit_proposal",
  "connectivity",
  "eazy",
  "oca",
  "digiclinic",
  "pijar",
  "sprinthink",
  "nilai_project",
] as const;

export type CustomerCategory = (typeof CATEGORIES)[number];
export type CustomerProperty = (typeof PROPERTIES)[number];
export type ReplyMarkup =
  | InlineKeyboardMarkup
  | ReplyKeyboardMarkup
  | ReplyKeyboardRemove
  | ForceReply;
export type UserCache = {
  userState:
    | "is_selecting_category"
    | "empty_category"
    | "is_selecting_customer"
    | "create_customer"
    | "update_customer"
    | "delete_customer"
    | "is_selecting_property"
    | "update_property";
  customer_category?: CustomerCategory;   // untuk state empty_category dan seterusnya
  customer_list?: [number, string][] | null;  // untuk menentukan nomor urut di update_customer dan delete_customer
  customer_name?: string | null; // untuk menyimpan nama pelanggan di is_selecting_property dan update_property
  customer_property?: CustomerProperty | null;
};

export interface MyPostData extends GoogleAppsScript.Events.AppsScriptHttpRequestEventPostData {
  getDataAsString(): string;
}
export interface DoPostEvent extends GoogleAppsScript.Events.DoPost {
  postData: MyPostData;
}

export const CATEGORY_LIST: CustomerCategory[][] = [
  ["RSUD"],
  ["PUSKESMAS"],
  ["SEKOLAH NEGERI"],
  ["DINAS"],
  ["SETDA"],
  ["BAPENDA"],
  ["POLDA"],
]