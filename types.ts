
export enum ShippingStatus {
  PREPARING = '준비중',
  SHIPPED = '배송완료'
}

export interface Product {
  id: string;
  name: string;
  price: string;
  options: string[]; // e.g. ["1", "2"]
  description: string;
  images: string[]; // base64 strings
}

export interface ShippingEntry {
  id: string;
  status: ShippingStatus;
  submitDate: string; // "YYYY-MM-DD" or "추가 제품"
  instagramId: string;
  name: string;
  phone: string;
  address: string;
  message: string;
  extra: string;
  productName: string;
  size: string;
  quantity: number;
  adminMemo: string;
}

export interface Collection {
  id: string;
  name: string;
  accessCode: string;
  maxProducts: number;
  logoUrl?: string;
  lookbookImages: string[]; // base64 strings
  descriptionTitle: string;
  descriptionBody: string;
  products: Product[];
  shippingEntries: ShippingEntry[];
}

export interface CartItem {
  productId: string;
  productName: string;
  size: string;
  image: string;
}

export interface AppState {
  collections: Collection[];
  activeCollectionId: string | null;
  adminAccessCode: string;
}
