const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

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

// Environment variable validation
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_RECIPIENT',
  'FROM_EMAIL',
  'FROM_NAME'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
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

// Template configuration
const TEMPLATE_CONFIG_PATH = path.join(__dirname, '../config/template.json');

// Get template configuration
router.get('/template-config', async (req, res) => {
  try {
    const templateConfig = await fs.readFile(TEMPLATE_CONFIG_PATH, 'utf8');
    res.json(JSON.parse(templateConfig));
  } catch (error) {
    console.error('Error reading template config:', error);
    res.status(500).json({ error: 'Failed to read template configuration' });
  }
});

// Update template configuration
router.post('/template-config', async (req, res) => {
  try {
    const templateConfig = req.body;
    await fs.writeFile(TEMPLATE_CONFIG_PATH, JSON.stringify(templateConfig, null, 2));
    res.json({ message: 'Template configuration updated successfully' });
  } catch (error) {
    console.error('Error updating template config:', error);
    res.status(500).json({ error: 'Failed to update template configuration' });
  }
});

// Add request logging middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    }
  });
  next();
});

// Generate email
router.post('/generate-email', async (req, res) => {
  const { formData, templateConfig } = req.body;
  
  try {
    // Replace variables in the user prompt
    let userPrompt = templateConfig.promptTemplate.user;
    Object.entries(formData).forEach(([key, value]) => {
      userPrompt = userPrompt.replace(`{${key}}`, value);
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `You are an assistant that generates professional emails to ${templateConfig.owner.name}. The contents can be in any language but everything in the email should be written in English. You must always respond in JSON format with exactly two fields: 'subject' (string) and 'content' (string).`
        },
        { 
          role: "user", 
          content: userPrompt
        }
      ],
      temperature: 0.7
    });
    const emailText = completion.choices[0].message.content.trim();
    res.json(JSON.parse(cleanJsonString(emailText)));
  } catch (error) {
    const errorDetails = {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      model: error.model,
      response: error.response?.data,
      stack: error.stack
    };
    
    console.error("OpenAI error details:", errorDetails);
    
    res.status(500).json({ 
      error: "Failed to generate email content",
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

// translate email
router.post('/translate-email', async (req, res) => {
  const { subject, content, templateConfig } = req.body;
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
        { 
          role: "system", 
          content: `You are an expert in translating English into ${templateConfig.owner.language}. Translate the given email to ${templateConfig.owner.language}. Please note that the receiver's name in ${templateConfig.owner.language} is ${templateConfig.owner.nameAlt}. Please generate JSON-like content with fields subject_translation and content_translation.` 
        },
        { 
          role: "user", 
          content: 
            `Subject: ${subject}\n` +
            `${content}\n` +
            `Translate the whole email into ${templateConfig.owner.language}.`
        }
      ],
      temperature: 0.7
    });
    const emailText = completion.choices[0].message.content.trim();
    res.json({...JSON.parse(cleanJsonString(emailText)), ...{language: templateConfig.owner.language}});
  } catch (error) {
    console.error("OpenAI translation error details:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      error: "Failed to generate email content",
      details: error.message
    });
  }
});

// Send email
router.post('/send-email', upload.array('attachments'), async (req, res) => {
  const { subject, emailBody } = req.body;
  const files = req.files || [];
  
  if (!emailBody) {
    return res.status(400).json({ error: "Email body required" });
  }
  
  try {
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: process.env.EMAIL_RECIPIENT,
      subject: subject || "(No Subject)",
      text: emailBody,
      attachments: files.map(file => ({
        filename: file.originalname,
        path: file.path
      }))
    };

    await transporter.sendMail(mailOptions);
    
    // Clean up uploaded files
    await Promise.all(files.map(file => fs.unlink(file.path)));
    
    res.json({ message: "Email sent successfully" });
  } catch (error) {
    // Clean up uploaded files in case of error
    if (files.length > 0) {
      await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
    }
    console.error("Nodemailer error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;
