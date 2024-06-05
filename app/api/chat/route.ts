const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(
   cors({
      origin: "http://localhost:3000", // replace with the origin of your client app
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
   })
);

app.listen(3001, () => {
   console.log("Server is running on port 3001");
});
