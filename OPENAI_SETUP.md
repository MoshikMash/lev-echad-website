# OpenAI API Setup for Lev Echad Chatbot

Your website now has an advanced AI chatbot that can answer complex questions about Jewish life in Pittsburgh. To enable the full AI capabilities, follow these steps:

## 🔑 Getting Your OpenAI API Key

1. **Create an OpenAI Account:**
   - Go to https://platform.openai.com/
   - Sign up or log in to your account

2. **Get Your API Key:**
   - Navigate to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Give it a name like "Lev Echad Chatbot"
   - Copy the API key (starts with `sk-`)

## ⚙️ Setting Up the API Key

### Option 1: Environment Variable (Recommended)
1. Create a file called `.env.local` in your project root
2. Add this line:
   ```
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Replace `sk-your-actual-api-key-here` with your real API key
4. Restart your development server (`npm run dev`)

### Option 2: Direct Configuration (Not Recommended for Production)
1. Open `src/config/openai.ts`
2. Replace `import.meta.env.VITE_OPENAI_API_KEY || ''` with your API key in quotes
3. Example: `apiKey: 'sk-your-actual-api-key-here'`

## 💰 OpenAI Pricing

- **GPT-3.5 Turbo:** ~$0.002 per 1K tokens (very affordable)
- **Typical conversation:** ~$0.01-0.05 per chat session
- **Monthly cost estimate:** $10-50 depending on usage

## 🔄 Fallback System

If no API key is provided, the chatbot automatically falls back to keyword-based responses using your comprehensive Pittsburgh Jewish community database. This ensures the chatbot always works, even without OpenAI.

## 🧪 Testing the AI

Once set up, test with complex questions like:
- "I'm moving to Pittsburgh with two kids. One needs special education support and the other is interested in Hebrew immersion. What are my school options and which neighborhoods would be best?"
- "My family keeps kosher and we're Orthodox. Can you create a complete guide for our first week in Pittsburgh including where to shop, eat, and pray?"
- "Compare the different Chabad centers in Pittsburgh and help me understand which would be best for a young Israeli family."

## 🛡️ Security Notes

- Never commit your `.env.local` file to version control
- Keep your API key secure and private
- Monitor your OpenAI usage in their dashboard
- Set up usage limits if needed

## 📞 Support

If you need help setting this up, contact the development team or refer to OpenAI's documentation at https://platform.openai.com/docs

Your AI chatbot is now ready to provide sophisticated, natural language responses while staying true to your comprehensive Pittsburgh Jewish community information!
