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

export namespace CommonFirestore {
  export const Owner = t.type({
    displayName: t.string,
    email: t.string,
  });

  export const getEvent = (timestamp: t.Type<any>) =>
    t.type({
      name: t.string,
      location: t.string,
      maxPreception: t.number,
      theme: t.string,
      openingTimes: t.array(
        t.type({ from: timestamp, to: timestamp, headcount: t.number })
      ),
    });

  export const getOrder = <T extends t.Mixed, S extends t.Mixed>(
    documentReference: T,
    timestamp: S
  ) =>
    t.type({
      id: t.string,
      name: t.string,
      customerId: t.string,
      customerRef: documentReference,
      iam: t.string,
      items: t.array(
        t.type({
          id: t.string,
          itemRef: documentReference,
          quantity: t.number,
        })
      ),
      status: OrderStatus,
      receiptDatetime: t.union([
        t.null,
        t.type({
          from: timestamp,
          to: timestamp,
          headcount: t.number,
        }),
      ]),
    });

  export const getItem = <T extends t.Mixed>(documentReference: T) =>
    t.type({
      id: t.string,
      name: t.string,
      eventRef: t.union([t.null, documentReference]),
    });

  export const Customer = t.type({
    id: t.string,
    name: t.string,
    email: t.string,
    phone: t.string,
    address: t.string,
  });
}

export namespace CommonFunctions {
  const Response = t.type({
    status: t.union([t.literal("success"), t.literal("error")]),
    body: t.unknown,
  });

  export namespace FindOrderByIam {
    export const In = t.type({
      iam: t.string,
    });

    export const getOut = <S extends t.Mixed, T extends t.Mixed>(
      documentReference: S,
      timestamp: T
    ) =>
      t.intersection([
        Response,
        t.type({
          body: t.type({
            owner: t.type({
              id: t.string,
              data: CommonFirestore.Owner,
            }),
            event: t.type({
              id: t.string,
              data: CommonFirestore.getEvent(timestamp),
            }),
            order: t.type({
              id: t.string,
              data: CommonFirestore.getOrder(documentReference, timestamp),
            }),
            customer: t.type({
              id: t.string,
              data: CommonFirestore.Customer,
            }),
          }),
        }),
      ]);
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
