require("dotenv").config();
const express = require("express");
const twilio = require("twilio");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function getShoppingList(message) {
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
  const prompt = `You are a shopping assistant. The user wants to cook: "${message}". 
Reply with a shopping list only — each item with quantity and estimated price in Nigerian Naira. 
No recipes, no instructions, just the shopping list.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

app.get("/", (req, res) => {
  res.json({ status: "Always watching the force" });
});
async function detectIntent(message) {
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
  const prompt = `Look at this message and classify it as one of three intents:
- GREETING (if the user is saying hi, hello, or introducing themselves)
- SHOPPING (if the user is asking for a meal or shopping list)
- OTHER (if the user is asking something unrelated to food or shopping)

Reply with only one word: GREETING, SHOPPING, or OTHER.

Message: "${message}"`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
function sendWhatsAppReply(res, message) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  res.type("text/xml");
  res.send(twiml.toString());
}
app.post("/whatsapp", async (req, res) => {
  try {
    const message = req.body.Body;
    const phoneNumber = req.body.From;
    if (!message) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(
        "Please send me a meal and I will generate a shopping list for you.",
      );
      res.type("text/xml");
      return res.send(twiml.toString());
    }
    intent = await detectIntent(message);
    if (intent === "GREETING") {
      const reply = "Hi, how may I help you";
      sendWhatsAppReply(res, reply);
    } else if (intent === "SHOPPING") {
      const reply = await getShoppingList(message);
      await supabase.from("conversations").insert({
        phone_number: phoneNumber,
        message: message,
        shopping_list: reply,
      });

      sendWhatsAppReply(res, reply);
    } else {
      const reply = "I can only help with shopping list";
      sendWhatsAppReply(res, reply);
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong", details: error.message });
  }
});

app.post("/shopping-list", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "you need to send a message" });
    }
    const reply = await getShoppingList(message);
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
