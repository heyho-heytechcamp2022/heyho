import type { Item, Order, Customer } from "./ec";

export const dummyItems: Item[] = [
  { id: "I-001", name: "ロゴ入りシャツ（白）" },
  { id: "I-002", name: "ロゴ入りシャツ（黒）" },
  { id: "I-003", name: "【当日受取用】ロゴ入りシャツ（白）" },
  { id: "I-004", name: "【当日受取用】ロゴ入りシャツ（黒）" },
  { id: "I-005", name: "スポーツタオル" },
  { id: "I-006", name: "【当日受取用】スポーツタオル" },
  { id: "I-007", name: "マグカップ" },
  { id: "I-008", name: "【当日受取用】マグカップ" },
  { id: "I-009", name: "等身大抱きまくら（事前配達限定）" },
  { id: "I-010", name: "とれたて生野菜[コンサート仕様]（当日受取限定）" },
];

export const dummyOrders: Order[] = [
  { id: "O-001", customerId: "C-001", items: [{ id: "I-001", quantity: 1 }] },
  {
    id: "O-002",
    customerId: "C-002",
    items: [
      { id: "I-001", quantity: 1 },
      { id: "I-002", quantity: 2 },
    ],
  },
  {
    id: "O-003",
    customerId: "C-003",
    items: [
      { id: "I-001", quantity: 4 },
      { id: "I-002", quantity: 2 },
      { id: "I-003", quantity: 2 },
    ],
  },
];

export const dummyCustomers: Customer[] = [
  {
    id: "C-001",
    name: "山田 南瓜",
    email: "r+001@hosokawa.dev",
    phone: "000-0000-0000",
    address: "東京都渋谷区渋谷1-1-1",
  },
  {
    id: "C-002",
    name: "中田 トマト",
    email: "r+002@hosokawa.dev",
    phone: "001-0001-0001",
    address: "東京都渋谷区渋谷2-2-2",
  },
  {
    id: "C-003",
    name: "鈴木 にんじん",
    email: "r+003@hosokawa.dev",
    phone: "001-0001-0001",
    address: "東京都渋谷区渋谷2-2-2",
  },
];
