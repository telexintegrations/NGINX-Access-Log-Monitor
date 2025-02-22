const express = require("express");
const cors = require("cors");
const integrationRouter = require("./routes/integration");
const tickRouter = require("./routes/tick");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://staging.telextest.im",
      "http://telextest.im",
      "https://staging.telex.im",
      "https://telex.im",
    ],
    credentials: true,
    methods: ["*"],
    allowedHeaders: ["*"],
  })
);
app.use(express.json());

// Routes
app.use("/", integrationRouter);
app.use("/", tickRouter);

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
