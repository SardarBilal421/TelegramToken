# WillyGoldKiller Bot

A Telegram bot for monitoring crypto trading signals and tracking token prices with achievement notifications.

## Features

- 🔍 **Token Detection**: Automatically detects and tracks new tokens from Telegram groups
- 📊 **Price Monitoring**: Tracks token prices and calculates multipliers (2x to 500x)
- 🎯 **Achievement Alerts**: Sends notifications when tokens reach specific multiplier targets
- 🚨 **Trade Signal Monitoring**: Monitors for trading signals in configured groups
- 📱 **Error Monitoring**: Comprehensive error tracking with notifications to @Saqlain666
- 🔄 **Auto Recovery**: Automatic restart and reconnection on failures
- 💾 **Persistent Storage**: Saves session and token data for reliability

## Error Monitoring

The bot includes comprehensive error monitoring that sends notifications to @Saqlain666 for:

- ❌ **Uncaught Exceptions**: Critical errors that could crash the bot
- 🔄 **Connection Issues**: Telegram connection problems
- 📊 **API Failures**: DexScreener API errors
- 🏗️ **Initialization Issues**: Startup problems
- 💾 **Storage Errors**: Token storage issues
- ⚠️ **Rate Limits**: Telegram rate limiting

## Status Notifications

Regular status updates are sent to @Saqlain666:

- 🚀 **Startup**: Bot initialization and connection status
- 📊 **Health Checks**: Hourly status with uptime and token count
- 🔄 **Reconnections**: Connection restoration notifications
- 📈 **Group Status**: Group connection summaries

## DigitalOcean VPS Deployment

### Prerequisites

- DigitalOcean account
- Ubuntu 20.04+ VPS
- SSH access to your VPS

### Quick Deployment

1. **Connect to your VPS:**

   ```bash
   ssh root@your-vps-ip
   ```

2. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd willygoldkiller-bot
   ```

3. **Make deployment script executable:**

   ```bash
   chmod +x deploy.sh
   ```

4. **Run the deployment script:**

   ```bash
   ./deploy.sh
   ```

5. **Follow the PM2 startup instructions:**
   The script will provide a command to run for auto-startup on boot.

### Manual Deployment

If you prefer manual deployment:

1. **Install Node.js:**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2:**

   ```bash
   sudo npm install -g pm2
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Start the bot:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Configuration

### Environment Variables

The bot uses the following configuration:

- `API_ID`: Your Telegram API ID
- `API_HASH`: Your Telegram API Hash
- Session string (stored in `session.txt`)

### Group Configuration

Edit the `groupNames` array in `index.js` to add or remove groups to monitor.

## Monitoring and Management

### PM2 Commands

```bash
# View bot status
pm2 status

# View logs
pm2 logs willygoldkiller-bot

# Restart bot
pm2 restart willygoldkiller-bot

# Stop bot
pm2 stop willygoldkiller-bot

# Monitor processes
pm2 monit
```

### Log Files

Logs are stored in the `logs/` directory:

- `err.log`: Error logs
- `out.log`: Output logs
- `combined.log`: Combined logs

### Health Monitoring

The bot sends hourly health checks to @Saqlain666 with:

- Uptime information
- Number of tracked tokens
- Group connection status
- Error count

## Error Recovery

The bot includes several recovery mechanisms:

1. **Automatic Restart**: PM2 automatically restarts the bot on crashes
2. **Session Recovery**: Handles expired sessions by creating new ones
3. **Connection Retry**: Retries failed connections with exponential backoff
4. **Error Cooldown**: Prevents spam notifications (5-minute cooldown)

## Security Considerations

- Store sensitive data (API keys, session strings) securely
- Use a dedicated user account instead of root
- Keep the system updated
- Monitor logs regularly
- Use firewall rules to restrict access

## Troubleshooting

### Common Issues

1. **Session Expired:**

   - The bot will automatically create a new session
   - Check logs for session-related errors

2. **Rate Limiting:**

   - Bot will notify you and wait for the rate limit to reset
   - Consider reducing message frequency

3. **Connection Issues:**

   - Check internet connectivity
   - Verify Telegram API access
   - Review error logs

4. **Memory Issues:**
   - PM2 will restart the bot if memory usage exceeds 1GB
   - Monitor memory usage with `pm2 monit`

### Getting Help

If you encounter issues:

1. Check the logs: `pm2 logs willygoldkiller-bot`
2. Review error notifications sent to @Saqlain666
3. Check the bot status: `pm2 status`
4. Restart if necessary: `pm2 restart willygoldkiller-bot`

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, contact @Saqlain666 on Telegram.
