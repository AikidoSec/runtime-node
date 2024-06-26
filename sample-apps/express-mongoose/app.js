require("dotenv").config();
require("@aikidosec/firewall");

const mongoose = require("mongoose");
const express = require("express");
const asyncHandler = require("express-async-handler");
const { Cat } = require("./Cat");
const { escape } = require("./escape");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

require("@aikidosec/firewall/nopp");

async function main(port) {
  const app = express();
  // Normally you'd use environment variables for this
  await mongoose.connect("mongodb://root:password@127.0.0.1:27017");

  app.use(morgan("tiny"));
  app.use(cookieParser());

  // Try http://localhost:4000/?search[$ne]=null
  // Which will result in a query like:
  // { title: { '$ne': null } }
  app.get(
    "/",
    asyncHandler(async (req, res) => {
      const cats = await Cat.find(
        req.query.search ? { name: req.query.search } : {}
      );

      res.send(`
        <html lang="en">
          <body>
            <form action="/" method="GET">
              <label for="search">Search</label>
              <input type="text" name="search">
              <input type="submit" value="Search" />
            </form>
            <ul>
              ${cats.map((cat) => `<li>${escape(cat.name)}</li>`).join("\n")}
            </ul>
            <form action="/cats" method="POST">
              <label for="name">Name</label>
              <input type="text" name="name" />
              <input type="submit" value="Create cat" />
            </form>
          </body>
        </html>
      `);
    })
  );

  app.post(
    "/cats",
    express.urlencoded({ extended: false }),
    asyncHandler(async (req, res) => {
      const cat = new Cat({
        name: req.body.name,
        createdAt: new Date(),
      });

      await cat.save();
      res.redirect("/");
    })
  );

  return new Promise((resolve, reject) => {
    try {
      app.listen(port, () => {
        console.log(`Listening on port ${port}`);
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

function getPort() {
  const port = parseInt(process.argv[2], 10) || 4000;

  if (isNaN(port)) {
    console.error("Invalid port");
    process.exit(1);
  }

  return port;
}

main(getPort());
