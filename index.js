require("dotenv").config();
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ status: "Always watching the force" });
});
app.post("/shopping-list", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "you need to send a message" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `You are a shopping assistant. The user wants to cook: "${message}". 
Reply with a shopping list only — each item with quantity and estimated price in Nigerian Naira. 
No recipes, no instructions, just the shopping list.`;
    const result = await model.generateContent(prompt);

    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong", details: error.message });
  }
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
