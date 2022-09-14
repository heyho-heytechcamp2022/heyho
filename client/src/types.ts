import { CommonFirestore, CommonFunctions } from "@common";
import {
  DocumentData,
  DocumentReference,
  SnapshotOptions,
  Timestamp,
  QueryDocumentSnapshot,
} from "firebase/firestore";

import * as t from "io-ts";

const TimestampIots = new t.Type<Timestamp, Timestamp, unknown>(
  "Timestamp",
  (u): u is Timestamp => u instanceof Timestamp,
  (u, c) => (u instanceof Timestamp ? t.success(u) : t.failure(u, c)),
  (a) => a
);

const DocumentReferenceIoto = new t.Type<
  DocumentReference,
  DocumentReference,
  unknown
>(
  "DocumentReference",
  (u): u is DocumentReference => u instanceof DocumentReference,
  (u, c) => (u instanceof DocumentReference ? t.success(u) : t.failure(u, c)),
  (a) => a
);

export namespace Firestore {
  export const Order = CommonFirestore.getOrder(
    DocumentReferenceIoto,
    TimestampIots
  );

  export const Event = CommonFirestore.getEvent(TimestampIots);

  export const Item = CommonFirestore.getItem(DocumentReferenceIoto);

  export const converter = <A extends DocumentData, O, I>(
    type: t.Type<A, O, I>
  ) => ({
    toFirestore: (data: any): DocumentData => {
      if (!type.is(data)) {
        console.error(data);
        throw new Error("Invalid data type.");
      }
      return data;
    },
    fromFirestore: (
      snapshot: QueryDocumentSnapshot,
      options?: SnapshotOptions
    ): A => {
      const data = snapshot.data(options);
      if (!type.is(data)) {
        console.error(data);
        throw new Error("Invalid data type.");
      }
      return data;
    },
  });
}

export namespace Functions {
  export namespace FindOrderByIam {
    export const Out = CommonFunctions.FindOrderByIam.getOut(
      DocumentReferenceIoto,
      TimestampIots
    );
  }
}
