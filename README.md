# eaisy-email

A customizable web application that makes it easy for people to email you! 

## Overview

This project provides a user-friendly website where visitors can easily send emails to the website owner. You can customize it with your own name, preferred language, and email settings.

Key features:
- Simple form interface - visitors just need to:
  - Share what they want you to know
  - Share what they want you to do
  - Optionally provide their email for replies
- AI-powered email generation using OpenAI
- Automatic translation to your preferred language
- Professional email formatting
- No login required for visitors
- Fully customizable with your:
  - Name (in both English and your preferred language)
  - Email settings
  - Language preferences
  - SMTP server configuration

Perfect for:
- Personal websites
- Professional portfolios
- Contact pages
- Any situation where you want to make it easy for others to reach you

## Environment Setup

Before deploying, create a `.env` file in the `backend` folder with the following variables:

```env
# Node Environment
NODE_ENV=production  # Change to 'development' for development mode

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Owner Information
OWNER_NAME=Your Name  # Your name in English (e.g., John Smith)
OWNER_LANG=Your Language  # Your preferred language (e.g., Chinese, Spanish, French)
OWNER_NAME_ALT=Your Name in Preferred Language  # Your name in your preferred language

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password_here

# Email Settings
EMAIL_RECIPIENT=recipient@example.com  # Where you want to receive the emails
```

Replace the placeholder values with your actual configuration:
- `NODE_ENV`: Set to 'production' for production deployment, 'development' for development
- `OPENAI_API_KEY`: Your OpenAI API key
- `OWNER_NAME`: Your name in English (this will be used in the generated emails)
- `OWNER_LANG`: The language you want emails translated to (e.g., Chinese, Spanish, French)
- `OWNER_NAME_ALT`: Your name written in your preferred language
- `SMTP_HOST`: Your email server host (e.g., smtp.gmail.com for Gmail)
- `SMTP_PORT`: Email server port (usually 587 for TLS or 465 for SSL)
- `SMTP_USER`: Your email address (for sending the emails)
- `SMTP_PASS`: Your email password or app-specific password
- `EMAIL_RECIPIENT`: Email address where you want to receive the emails (can be different from SMTP_USER)

## Deployment

⚠️ **IMPORTANT: All commands must be run from the project root directory** ⚠️

Before running any commands, make sure you are in the project root directory:
```bash
cd /path/to/eaisy-email  # Replace with your actual project path
```

### Production Deployment

For production deployment, you'll serve both the frontend and backend from the same server:

1. Set up environment:
   - Create `.env` file in the `backend` folder
   - Set `NODE_ENV=production` in `.env`
   - Configure all other environment variables as described above

2. From the project root, install dependencies and build:
```bash
cd backend && npm install && cd ../frontend && npm install && npm run build && cd ../backend
```

3. From the project root, start the server:
```bash
cd backend && npm start
```

The application will be available at `http://localhost:5000` (or your configured PORT).

### Development Deployment

For development, you'll run the frontend and backend servers separately:

1. Set up environment:
   - Create `.env` file in the `backend` folder
   - Set `NODE_ENV=development` in `.env`
   - Configure all other environment variables as described above

2. From the project root, start the backend server (first terminal):
```bash
cd backend && npm install && npm run dev
```

3. From the project root, start the frontend development server (second terminal):
```bash
cd frontend && npm install && npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Remote Server Development

For development on a remote server:

1. Follow the same environment setup as Development Deployment

2. From the project root, start the backend server (first terminal):
```bash
cd backend && npm install && npm run dev
```

3. From the project root, start the frontend server with external access (second terminal):
```bash
cd frontend && npm install && npm run dev -- --host 0.0.0.0
```

The application will be available at:
- Frontend: `http://<server-ip>:5173`
- Backend API: `http://<server-ip>:5000`

Note for remote development:
- The `--host 0.0.0.0` flag allows external access to the development server
- Make sure your server's firewall allows access to ports 5000 and 5173
- Replace `<server-ip>` with your actual server IP address