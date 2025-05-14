const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const nodemailer = require('nodemailer');

function cleanJsonString(raw) {
  return raw
    .trim()
    // Remove ```json or ``` markers:
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    // Remove single backticks wrapping the whole thing:
    .replace(/^`+/, '')
    .replace(/`+$/, '');
}

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generate email
router.post('/generate-email', async (req, res) => {
  const { toknow, todo } = req.body;
  // if (!subject) {
  //   return res.status(400).json({ error: "Subject is required" });
  // }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are an assistant that generates professional emails to ${process.env.OWNER_NAME}, based on what the sender want him to know and what they want the him to do. The contents can be in any language but everythin in the email should be written in English. Please generate JSON-like content with fields subject and content.` },
        { role: "user", content: 
            `I want ${process.env.OWNER_NAME} to know: ${toknow}.\n` +
            `I want ${process.env.OWNER_NAME} to do: ${todo}.\n` +
            "Compose a detailed, polite, and professional email based on the above information."
        }
      ],
      temperature: 0.7
    });
    const emailText = completion.choices[0].message.content.trim();
    // res.json({ email: emailText });
    res.json(JSON.parse(cleanJsonString(emailText)));
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate email content" });
  }
});

// translate email
router.post('/translate-email', async (req, res) => {
  const { subject, content } = req.body;
  if (!subject) {
    return res.status(400).json({ error: "Subject is required" });
  }
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are an expert in translating English into ${process.env.OWNER_LANG}. Translate the given email to ${process.env.OWNER_LANG}. Please note that the receiver's name in ${process.env.OWNER_LANG} is ${process.env.OWNER_NAME_ALT}. Please generate JSON-like content with fields subject_translation and content_translation.` },
        { role: "user", content: 
            `Subject: ${subject}\n` +
            `${content}\n` +
            `Translate the whole email into ${process.env.OWNER_LANG}.`
        }
      ],
      temperature: 0.7
    });
    const emailText = completion.choices[0].message.content.trim();
    res.json({...JSON.parse(cleanJsonString(emailText)), ...{language: process.env.OWNER_LANG}});
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate email content" });
  }
});


// Send email
router.post('/send-email', async (req, res) => {
  const { subject, emailBody } = req.body;
  if (!emailBody) {
    return res.status(400).json({ error: "Email body required" });
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: subject || "(No Subject)",
      text: emailBody
    });
    res.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Nodemailer error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;
