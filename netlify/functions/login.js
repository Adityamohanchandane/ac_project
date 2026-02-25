const { MongoClient } = require("mongodb");

let client;

exports.handler = async (event) => {
  try {

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

   fetch("/.netlify/functions/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});

    const data = JSON.parse(event.body);
    const { email, password } = data;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password required" })
      };
    }

    if (!client) {
      client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
    }

    const db = client.db("observeX");
    const users = db.collection("users");

    await users.insertOne({ email, password });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Registration successful" })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};