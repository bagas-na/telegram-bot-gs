import {
  ForceReply,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from "@grammyjs/types";

export type ReplyMarkup =
  | InlineKeyboardMarkup
  | ReplyKeyboardMarkup
  | ReplyKeyboardRemove
  | ForceReply;
export type CustomerCategory = (typeof CATEGORIES)[number];
export type CustomerProperty = (typeof PROPERTIES)[number];
export type Funnel = "F0" | "F3" | "F4" | "F5";
export type UserCache = {
  user_state:
    | "awaiting_category_selection"
    | "awaiting_customer_selection"
    | "awaiting_customer_creation"
    | "awaiting_customer_update"
    | "awaiting_property_selection"
    | "awaiting_property_update";
  customer_category?: CustomerCategory; // untuk state select_customer dan seterusnya
  customer_name?: string | null; // untuk menyimpan nama pelanggan di select_property dan update_property
  customer_property?: CustomerProperty | null;
};
export type CustomerData = {
  customer_category: string;
  customer_name: string;
  submit_proposal: "SUDAH" | "BELUM";
  connectivity: Funnel;
  eazy: Funnel;
  oca: Funnel;
  digiclinic: Funnel;
  pijar: Funnel;
  sprinthink: Funnel;
  nilai_project: number;
};
// export interface MyPostData extends GoogleAppsScript.Events.AppsScriptHttpRequestEventPostData {
//   getDataAsString(): string;
// }
// export interface DoPostEvent extends GoogleAppsScript.Events.DoPost {
//   postData: MyPostData;
// }

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

export const FUNNEL_PROPERTIES = [
  "connectivity",
  "eazy",
  "oca",
  "digiclinic",
  "pijar",
  "sprinthink",
];

export const CATEGORY_LIST: CustomerCategory[][] = [
  ["RSUD"],
  ["PUSKESMAS"],
  ["SEKOLAH NEGERI"],
  ["DINAS"],
  ["SETDA"],
  ["BAPENDA"],
  ["POLDA"],
] as const;

export const PROPERTIES_LIST: CustomerProperty[][] = [
  ["submit_proposal"],
  ["connectivity"],
  ["eazy"],
  ["oca"],
  ["digiclinic"],
  ["pijar"],
  ["sprinthink"],
  ["nilai_project"],
] as const;

export const MAP_PROPS_TO_COL: { [key in CustomerProperty]: number } = {
  submit_proposal: 6,
  connectivity: 7,
  eazy: 8,
  oca: 9,
  digiclinic: 10,
  pijar: 11,
  sprinthink: 12,
  nilai_project: 13,
} as const;

export const MAP_PROPS_TO_TEXT: { [key in CustomerProperty]: string } = {
  submit_proposal: "Submit Proposal",
  connectivity: "Connectivity",
  eazy: "Antares Eazy",
  oca: "OCA",
  digiclinic: "DIGIClinic",
  pijar: "Pijar",
  sprinthink: "Sprinthink",
  nilai_project: "Nilai proyek",
} as const;

export const MAP_COL_TO_PROPS: { [key: number]: CustomerProperty } = {
  "6": "submit_proposal",
  "7": "connectivity",
  "8": "eazy",
  "9": "oca",
  "10": "digiclinic",
  "11": "pijar",
  "12": "sprinthink",
  "13": "nilai_project",
} as const;
