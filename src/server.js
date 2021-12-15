import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from 'path';

const dbConf = {
  uri: "mongodb+srv://dbAdminRafay:tkUUC9AS2cVpUi4@cluster0.55xq4.mongodb.net/nodeVueCommerce?retryWrites=true&w=majority",
  db: "nodeVueCommerce"
}
const app = express();
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, '../assets')));

app.get("/api/products", async (req, res) => {

  const client = await MongoClient.connect(dbConf.uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(dbConf.db);

  const products = await db.collection('products').find({}).toArray();

  res.status(200).json(products);

  client.close();
});

app.get("/api/products/:productId", async (req, res) => {
  const { productId } = req.params;

  const client = await MongoClient.connect(dbConf.uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(dbConf.db);

  const product = await db.collection('products').findOne({ id: productId });

  if (product) {
    res.status(200).json(product);
  }
  else {
    res.status(404).json("Product not found!");
  }

  client.close();
});

app.post("/api/users/:userId/cart", async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;

  //Connect to MongoDB
  const client = await MongoClient.connect(dbConf.uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(dbConf.db);

  await db.collection('cart').updateOne({ id: userId }, {
    $addToSet: { cartItems: productId }
  });

  //Get cart products
  const products = await db.collection('products').find({}).toArray();
  const cart = await db.collection('cart').findOne({ id: userId });
  const cartItemIds = cart.cartItems;
  const cartItems = cartItemIds.map(id =>
    products.find( product => product.id === id )
  );

  res.status(200).json(cartItems);

  //Close connection from MongoDB
  client.close();
});

app.delete("/api/users/:userId/cart/:productId", async (req, res) => {
  const { productId, userId } = req.params;

  //Connect to MongoDB
  const client = await MongoClient.connect(dbConf.uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(dbConf.db);

  await db.collection('cart').updateOne({ id: userId }, {
    $pull: { cartItems: productId }
  });

  //Get cart products
  const products = await db.collection('products').find({}).toArray();
  const cart = await db.collection('cart').findOne({ id: userId });
  const cartItemIds = cart.cartItems;
  const cartItems = cartItemIds.map(id =>
    products.find( product => product.id === id )
  );

  res.status(200).json(cartItems);

  //Close connection from MongoDB
  client.close();
})

app.get("/api/users/:userId/cart", async (req, res) => {
  const { userId } = req.params;
  
  const client = await MongoClient.connect(dbConf.uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(dbConf.db);

  const cart = await db.collection('cart').findOne({ id: userId });
  if (!cart) {
    res.status(404).json('User not found!');

    client.close();

    return;
  }

  //Get cart products
  const products = await db.collection('products').find({}).toArray();
  const cartItemIds = cart.cartItems;
  const cartItems = cartItemIds.map(id =>
    products.find( product => product.id === id )
  );

  if (cartItems.length) {
    res.status(200).json(cartItems);
  }
  else {
    res.status(404).json("Your cart is empty");
  }

  client.close();
});

app.listen(8000, () => {
  console.log("Server is listening on port 8000, http://localhost:8000")
})