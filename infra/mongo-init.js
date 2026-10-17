const orders = db.getSiblingDB("shopping_orders");
orders.createUser({
  user: process.env.MONGO_APP_USERNAME,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: "readWrite", db: "shopping_orders" }],
});
