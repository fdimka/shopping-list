import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  RootState,
  AppDispatch,
  loadCatalog,
  addItem,
  clearCart,
  CartItem,
} from "./store";
import { validateCustomer, hebrewInput } from "./validation";
import { requestJson, errorMessage } from "./api";
import "./style.css";
const useAppDispatch = useDispatch.withTypes<AppDispatch>();
const useAppSelector = useSelector.withTypes<RootState>();
function Cart({ items }: { items: CartItem[] }) {
  return (
    <div className="cart">
      {[...new Set(items.map((i) => i.categoryId))].map((id) => (
        <section key={id}>
          <h2>{items.find((i) => i.categoryId === id)!.categoryName}</h2>
          <ul>
            {items
              .filter((i) => i.categoryId === id)
              .map((i) => (
                <li key={i.id}>
                  {i.name} – {i.quantity}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
function Shopping() {
  const dispatch = useAppDispatch();
  const { categories, status, error } = useAppSelector((s) => s.catalog);
  const items = useAppSelector((s) => s.cart.items);
  const [categoryId, setCategory] = useState("");
  const [productId, setProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (status === "idle") dispatch(loadCatalog());
  }, [dispatch, status]);
  const category = categories.find((c) => c.id === Number(categoryId));
  const product = category?.products.find((p) => p.id === Number(productId));
  const valid =
    !!product &&
    Number.isSafeInteger(Number(quantity)) &&
    Number(quantity) >= 1 &&
    Number(quantity) <= 999;
  return (
    <main>
      <h1>רשימת קניות</h1>
      {status === "loading" && <p role="status">טוען קטגוריות ומוצרים…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => dispatch(loadCatalog())}>נסה שוב</button>
        </div>
      )}
      <form
        className="selection"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid || !product || !category) return;
          if (
            (items.find((i) => i.id === product.id)?.quantity || 0) +
              Number(quantity) >
            999
          ) {
            setNotice("ניתן להוסיף עד 999 יחידות מאותו מוצר");
            return;
          }
          dispatch(
            addItem({
              ...product,
              categoryName: category.name,
              quantity: Number(quantity),
            }),
          );
          setNotice("המוצר נוסף לסל");
        }}
      >
        <label>
          קטגוריה
          <select
            value={categoryId}
            disabled={status !== "ready"}
            onChange={(e) => {
              setCategory(e.target.value);
              setProduct("");
              setNotice("");
            }}
            required
          >
            <option value="" disabled hidden>
              בחר קטגוריה
            </option>
            {categories.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          מוצר
          <select
            value={productId}
            disabled={!category}
            onChange={(e) => setProduct(e.target.value)}
            required
          >
            <option value="" disabled hidden>
              שם מוצר
            </option>
            {category?.products.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          כמות
          <input
            type="number"
            min="1"
            max="999"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>
        <button disabled={!valid}>הוסף מוצר לסל</button>
      </form>
      <p className="notice" role="status">
        {notice}
      </p>
      {items.length ? <Cart items={items} /> : <p className="empty">הסל ריק</p>}
      <div className="continue">
        {items.length ? (
          <Link className="button" to="/order">
            המשך להזמנה
          </Link>
        ) : (
          <button disabled>המשך להזמנה</button>
        )}
      </div>
    </main>
  );
}
function Order() {
  const items = useAppSelector((s) => s.cart.items);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [fullName, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const submitting = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  if (!items.length && !orderId) return <Navigate to="/" replace />;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    const issues = validateCustomer(fullName, address, email);
    setErrors(issues);
    setMessage("");
    if (Object.keys(issues).length) return;
    submitting.current = true;
    setPending(true);
    try {
      const result = await requestJson<{ id: string }>(
        `${import.meta.env.VITE_ORDERS_API_URL || "http://localhost:3001"}/api/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: requestId.current,
            fullName: fullName.trim(),
            address: address.trim(),
            email: email.trim(),
            items: items.map(({ id, ...i }) => ({ productId: id, ...i })),
          }),
        },
      );
      setOrderId(result.id);
      dispatch(clearCart());
    } catch (error) {
      setMessage(errorMessage(error) + " הפרטים והסל נשמרו במסך.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  if (orderId)
    return (
      <main>
        <h1>סיכום ההזמנה</h1>
        <p role="status">ההזמנה נשמרה בהצלחה</p>
        <p>
          מספר הזמנה: <bdi>{orderId}</bdi>
        </p>
        <button onClick={() => navigate("/")}>חזרה לרשימת קניות</button>
      </main>
    );
  return (
    <main>
      <h1>סיכום ההזמנה</h1>
      <form className="order-form" onSubmit={submit} noValidate>
        <label>
          שם מלא
          <input
            autoComplete="name"
            required
            maxLength={100}
            value={fullName}
            disabled={pending}
            onChange={(e) => {
              setName(hebrewInput(e.target.value));
              setErrors((previous) => ({ ...previous, fullName: "" }));
            }}
            aria-invalid={!!errors.fullName}
            aria-describedby="name-error"
          />
        </label>
        <span className="error" id="name-error">
          {errors.fullName}
        </span>
        <label>
          כתובת מלאה
          <input
            autoComplete="street-address"
            required
            minLength={5}
            maxLength={300}
            value={address}
            disabled={pending}
            onChange={(e) => {
              setAddress(hebrewInput(e.target.value, true));
              setErrors((previous) => ({ ...previous, address: "" }));
            }}
            aria-invalid={!!errors.address}
            aria-describedby="address-error"
          />
        </label>
        <span className="error" id="address-error">
          {errors.address}
        </span>
        <label>
          מייל
          <input
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            disabled={pending}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
          />
        </label>
        <span className="error" id="email-error">
          {errors.email}
        </span>
        <Cart items={items} />
        {message && (
          <p role="alert" className="error">
            {message}
          </p>
        )}
        <div className="actions">
          <button disabled={pending}>
            {pending ? "שומר הזמנה…" : "אשר הזמנה"}
          </button>
          <Link
            to="/"
            onClick={(e) => {
              if (pending) e.preventDefault();
            }}
          >
            חזרה לרשימת קניות
          </Link>
        </div>
      </form>
    </main>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shopping />} />
        <Route path="/order" element={<Order />} />
        <Route
          path="*"
          element={
            <main>
              <h1>העמוד לא נמצא</h1>
              <p>הכתובת המבוקשת אינה קיימת (404).</p>
              <Link className="button" to="/">
                חזרה לרשימת קניות
              </Link>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
