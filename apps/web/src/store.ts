import { requestJson, errorMessage } from "./api";
import {
  configureStore,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
export interface Product {
  id: number;
  name: string;
  categoryId: number;
}
export interface Category {
  id: number;
  name: string;
  products: Product[];
}
export interface CartItem extends Product {
  categoryName: string;
  quantity: number;
}
export const loadCatalog = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>(
  "catalog/load",
  async (_, { rejectWithValue }) => {
    try {
      return await requestJson<Category[]>(
        `${import.meta.env.VITE_CATALOG_API_URL || "http://localhost:5000"}/api/categories`,
      );
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
  {
    condition: (_, { getState }) =>
      (getState() as { catalog: { status: string } }).catalog.status !==
      "loading",
  },
);
const catalog = createSlice({
  name: "catalog",
  initialState: { categories: [] as Category[], status: "idle", error: "" },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadCatalog.pending, (s) => {
      s.status = "loading";
      s.error = "";
    })
      .addCase(loadCatalog.fulfilled, (s, a) => {
        s.status = "ready";
        s.categories = a.payload;
      })
      .addCase(loadCatalog.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload || "טעינת הקטלוג נכשלה";
      });
  },
});
export const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as CartItem[] },
  reducers: {
    addItem: (s, a: PayloadAction<CartItem>) => {
      if (
        !Number.isSafeInteger(a.payload.quantity) ||
        a.payload.quantity < 1 ||
        a.payload.quantity > 999
      )
        return;
      const item = s.items.find((i) => i.id === a.payload.id);
      if (item) {
        if (item.quantity + a.payload.quantity <= 999)
          item.quantity += a.payload.quantity;
      } else s.items.push(a.payload);
    },
    clearCart: (s) => {
      s.items = [];
    },
  },
});
export const { addItem, clearCart } = cartSlice.actions;
export const createStore = () =>
  configureStore({
    reducer: { catalog: catalog.reducer, cart: cartSlice.reducer },
  });
export const store = createStore();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
