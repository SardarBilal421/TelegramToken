# 🚀 DigitalOcean VPS Deployment Guide

## Complete Setup Instructions for WillyGoldKiller Bot

### Step 1: Create DigitalOcean Droplet

1. **Sign up/Login to DigitalOcean**

   - Go to [digitalocean.com](https://digitalocean.com)
   - Create account or login

2. **Create a New Droplet**
   - Click "Create" → "Droplets"
   - Choose **Ubuntu 22.04 LTS**
   - Select **Basic Plan**
   - Choose **Regular with SSD** (1GB RAM, 1 CPU, 25GB SSD) - $6/month
   - Choose a datacenter region close to you
   - Add your SSH key or create a password
   - Click "Create Droplet"

### Step 2: Connect to Your VPS

```bash
# Connect via SSH (replace with your droplet's IP)
ssh root@YOUR_DROPLET_IP

# Or if you set a password, you'll be prompted for it
```

### Step 3: Upload Your Bot Files

**Option A: Using Git (Recommended)**

```bash
# Install git
apt update && apt install git -y

# Clone your repository (replace with your repo URL)
git clone https://github.com/yourusername/willygoldkiller-bot.git
cd willygoldkiller-bot
```

**Option B: Using SCP (if you have files locally)**

```bash
# From your local machine, upload files
scp -r /path/to/your/bot/files root@YOUR_DROPLET_IP:/root/willygoldkiller-bot/
```

### Step 4: Run the Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:

- ✅ Update system packages
- ✅ Install Node.js 18.x
- ✅ Install PM2 globally
- ✅ Install project dependencies
- ✅ Create logs directory
- ✅ Start the bot with PM2
- ✅ Set up auto-startup

### Step 5: Complete PM2 Setup

After running `deploy.sh`, PM2 will show you a command like:

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

**Run that exact command** to enable auto-startup on boot.

### Step 6: Verify Installation

```bash
# Check bot status
pm2 status

# View logs
pm2 logs willygoldkiller-bot

# Check if bot is running
pm2 list
```

### Step 7: Monitor Your Bot

Use the monitoring script:

```bash
# Make it executable
chmod +x monitor.sh

# Check status
./monitor.sh status

# View logs
./monitor.sh logs

# Restart if needed
./monitor.sh restart
```

## 🔧 Important Configuration Notes

### Session Management

- The bot will create a `session.txt` file with your Telegram session
- Keep this file secure - it contains your login credentials
- If the session expires, the bot will automatically create a new one

### Error Notifications

- All errors will be sent to @Saqlain666 on Telegram
- You'll receive notifications for:
  - Bot startup/shutdown
  - Connection issues
  - API errors
  - Rate limiting
  - Health checks (hourly)

### Group Configuration

- Edit the `groupNames` array in `index.js` to add/remove groups
- The bot monitors 70+ groups by default
- Add your own groups as needed

## 📊 Monitoring Commands

### Quick Status Check

```bash
pm2 status
```

### View Real-time Logs

```bash
pm2 logs willygoldkiller-bot --lines 50
```

### Monitor Resources

```bash
pm2 monit
```

### Restart Bot

```bash
pm2 restart willygoldkiller-bot
```

### Stop Bot

```bash
pm2 stop willygoldkiller-bot
```

## 🚨 Troubleshooting

### Bot Won't Start

```bash
# Check logs for errors
pm2 logs willygoldkiller-bot

# Check if Node.js is installed
node --version

# Reinstall dependencies
npm install

# Restart PM2
pm2 restart willygoldkiller-bot
```

### Session Issues

```bash
# Delete session file to force new login
rm session.txt

# Restart bot
pm2 restart willygoldkiller-bot
```

### Memory Issues

```bash
# Check memory usage
pm2 monit

# Restart if memory is high
pm2 restart willygoldkiller-bot
```

### Connection Problems

```bash
# Check internet connectivity
ping google.com

# Check if Telegram is accessible
curl -I https://api.telegram.org
```

## 🔒 Security Recommendations

1. **Create a dedicated user** (instead of using root):

   ```bash
   adduser botuser
   usermod -aG sudo botuser
   su - botuser
   ```

2. **Set up firewall**:

   ```bash
   ufw allow ssh
   ufw allow 22
   ufw enable
   ```

3. **Keep system updated**:

   ```bash
   apt update && apt upgrade -y
   ```

4. **Monitor logs regularly**:
   ```bash
   tail -f logs/combined.log
   ```

## 💰 Cost Estimation

- **DigitalOcean Droplet**: $6/month (1GB RAM, 1 CPU)
- **Total monthly cost**: ~$6 USD

## 📱 Telegram Notifications

You'll receive these notifications to @Saqlain666:

- 🚀 **Startup**: Bot initialization
- 📊 **Health Check**: Hourly status updates
- ❌ **Errors**: Any issues or failures
- 🔄 **Reconnections**: Connection restoration
- 🎯 **Achievements**: Token multiplier alerts
- 💎 **New Tokens**: New token discoveries

## 🎉 Success Indicators

Your bot is running successfully when you see:

1. ✅ PM2 status shows "online"
2. ✅ Telegram notifications are being sent
3. ✅ Logs show group connections
4. ✅ No error messages in logs
5. ✅ Hourly health checks are received

## 📞 Support

If you encounter issues:

1. Check the logs: `pm2 logs willygoldkiller-bot`
2. Review error notifications sent to @Saqlain666
3. Use the monitoring script: `./monitor.sh help`
4. Contact @Saqlain666 on Telegram for support

---

**🎯 Your bot is now ready to monitor crypto signals 24/7!**
