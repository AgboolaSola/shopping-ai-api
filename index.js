const express = require("express");
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ status: "Always watching the force" });
});
app.post("/shopping-list", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "you need to send a message" });
  }

  res.json({
    message: `you sent a message saying: ${message}`,
  });
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
