import {
  DocumentData,
  DocumentReference as DocumentReferenceSdk,
  SnapshotOptions,
  Timestamp,
  QueryDocumentSnapshot as QueryDocumentSnapshotSdk,
} from "firebase/firestore";

import {
  QueryDocumentSnapshot as QueryDocumentSnapshotAdmin,
  DocumentReference as DocumentReferenceAdmin,
} from "firebase-admin/firestore";

import * as t from "io-ts";

export const EcSite = t.union([
  t.literal("stores"),
  t.literal("base"),
  t.literal("shopify"),
]);

export const OrderStatus = t.union([
  t.literal("unadjusted"),
  t.literal("adjusting"),
  t.literal("reserved"),
  t.literal("complited"),
]);

const TimestampIots = new t.Type<Timestamp, Timestamp, unknown>(
  "Timestamp",
  (u): u is Timestamp => u instanceof Timestamp,
  (u, c) => (u instanceof Timestamp ? t.success(u) : t.failure(u, c)),
  (a) => a
);

type SdkType = "sdk" | "admin";

const DocumentReference = (firebaseType: SdkType) =>
  firebaseType === "admin"
    ? new t.Type<DocumentReferenceAdmin, DocumentReferenceAdmin, unknown>(
        "DocumentReferenceAdmin",
        (u): u is DocumentReferenceAdmin => u instanceof DocumentReferenceAdmin,
        (u, c) =>
          u instanceof DocumentReferenceAdmin ? t.success(u) : t.failure(u, c),
        (a) => a
      )
    : new t.Type<DocumentReferenceSdk, DocumentReferenceSdk, unknown>(
        "DocumentReferenceSdk",
        (u): u is DocumentReferenceSdk => u instanceof DocumentReferenceSdk,
        (u, c) =>
          u instanceof DocumentReferenceSdk ? t.success(u) : t.failure(u, c),
        (a) => a
      );

export namespace Firestore {
  export const Owner = t.type({
    displayName: t.string,
    email: t.string,
  });

  export const Event = t.type({
    name: t.string,
    location: t.string,
    maxPreception: t.number,
    theme: t.string,
    openingTimes: t.array(
      t.type({ from: TimestampIots, to: TimestampIots, headcount: t.number })
    ),
  });

  export const Order = (firebaseType: SdkType) =>
    t.type({
      id: t.string,
      name: t.string,
      customerId: t.string,
      customerRef: DocumentReference(firebaseType),
      iam: t.string,
      items: t.array(
        t.type({
          id: t.string,
          itemRef: DocumentReference(firebaseType),
          quantity: t.number,
        })
      ),
      status: OrderStatus,
      receiptDatetime: t.union([
        t.null,
        t.type({
          from: TimestampIots,
          to: TimestampIots,
          headcount: t.number,
        }),
      ]),
    });

  export const Item = (firebaseType: SdkType) =>
    t.type({
      id: t.string,
      name: t.string,
      eventRef: DocumentReference(firebaseType),
    });

  export const Customer = t.type({
    id: t.string,
    name: t.string,
    email: t.string,
    phone: t.string,
    address: t.string,
  });

  export const converter = <A extends DocumentData, O, I>(
    type: t.Type<A, O, I>
  ) => ({
    toFirestore: (data: any): DocumentData => {
      if (!type.is(data)) throw new Error("Invalid data type.");
      return data;
    },
    fromFirestore: (
      snapshot: QueryDocumentSnapshotSdk | QueryDocumentSnapshotAdmin,
      options?: SnapshotOptions
    ): A => {
      const data = snapshot.data(options);
      if (!type.is(data)) throw new Error("Invalid data type.");
      return data;
    },
  });
}

export namespace Functions {
  const Response = t.type({
    status: t.union([t.literal("success"), t.literal("error")]),
    body: t.unknown,
  });

  export namespace FindOrderByIam {
    export const In = t.type({
      iam: t.string,
    });

    export namespace Out {
      export const Admin = t.intersection([
        Response,
        t.type({
          body: t.type({
            owner: t.type({
              id: t.string,
              data: Firestore.Owner,
            }),
            event: t.type({
              id: t.string,
              data: Firestore.Event,
            }),
            order: t.type({
              id: t.string,
              data: Firestore.Order("admin"),
            }),
            customer: t.type({
              id: t.string,
              data: Firestore.Customer,
            }),
          }),
        }),
      ]);
      export const Sdk = t.intersection([
        Response,
        t.type({
          body: t.type({
            owner: t.type({
              id: t.string,
              data: Firestore.Owner,
            }),
            event: t.type({
              id: t.string,
              data: Firestore.Event,
            }),
            order: t.type({
              id: t.string,
              data: Firestore.Order("sdk"),
            }),
            customer: t.type({
              id: t.string,
              data: Firestore.Customer,
            }),
          }),
        }),
      ]);
    }
  }

  export namespace UpdateHeadcount {
    export const In = t.type({
      ownerId: t.string,
      eventId: t.string,
      orderId: t.string,
      timesIndex: t.number,
      diff: t.number,
    });

    export const Out = Response;
  }
}
