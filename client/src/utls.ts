import * as t from "io-ts";
import { CommonFirestore } from "@common";

export const convertTimestampToDate = (
  timestamp: t.TypeOf<typeof CommonFirestore.SerializedTimestampIots>
) => new Date(timestamp._seconds * 1000);
