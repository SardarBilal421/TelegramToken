#!/bin/bash

# WillyGoldKiller Bot Deployment Script for DigitalOcean VPS
# This script sets up the environment and deploys the bot

set -e  # Exit on any error

echo "🚀 Starting WillyGoldKiller Bot Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider running as a regular user for security."
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm (if not already installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed successfully"
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_status "PM2 already installed: $(pm2 --version)"
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Install project dependencies
print_status "Installing project dependencies..."
npm install

# Set up PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup
print_warning "Please run the command that PM2 provided above to enable startup on boot"

# Start the bot with PM2
print_status "Starting the bot with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Display status
print_status "Bot deployment completed!"
echo ""
print_success "Bot Status:"
pm2 status

echo ""
print_success "Useful commands:"
echo "  pm2 logs willygoldkiller-bot          # View bot logs"
echo "  pm2 restart willygoldkiller-bot       # Restart bot"
echo "  pm2 stop willygoldkiller-bot          # Stop bot"
echo "  pm2 status                            # Check status"
echo "  pm2 monit                             # Monitor processes"

echo ""
print_warning "Don't forget to:"
echo "  1. Run the PM2 startup command provided above"
echo "  2. Check the bot logs: pm2 logs willygoldkiller-bot"
echo "  3. Monitor the bot status: pm2 status"

print_success "🎉 Deployment completed successfully!" 