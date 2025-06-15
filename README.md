# Willy Gold Killer Bot

A Telegram bot that tracks token prices and achievements across multiple groups.

## Features

- Monitors multiple Telegram groups for new tokens
- Tracks token prices and achievements
- Sends notifications for new tokens and price achievements
- Supports multiple chains
- Achievement tracking from 2x to 500x

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a Telegram application:

   - Go to https://my.telegram.org/auth
   - Log in and create a new application
   - Note down the `api_id` and `api_hash`

4. Update the configuration:

   - Open `config.js`
   - Add your Telegram API credentials
   - Add your target groups and user IDs

5. Run the bot:
   ```bash
   npm start
   ```

## Deployment on Render.com

1. Create a free account on [Render.com](https://render.com)

2. Create a new Web Service:

   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Choose the repository
   - Configure the service:
     - Name: `willy-gold-killer` (or your preferred name)
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Plan: `Free`

3. Add Environment Variables:

   - Add your Telegram API credentials
   - Add any other sensitive configuration

4. Deploy!

## Important Notes

- The free tier of Render.com will spin down after 15 minutes of inactivity
- To keep the bot running 24/7, you might want to:
  - Use a paid tier
  - Set up a cron job to ping the service
  - Use a different hosting service with a free tier that doesn't spin down

## Monitoring

- Check the Render.com dashboard for logs
- Monitor the bot's activity in Telegram
- Check for any error notifications

## Troubleshooting

If the bot stops working:

1. Check the Render.com logs
2. Verify your Telegram session is still valid
3. Ensure all environment variables are set correctly
4. Check if the bot has been rate limited by Telegram
