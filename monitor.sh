#!/bin/bash

# WillyGoldKiller Bot Monitoring Script
# Quick status checks and management commands

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

# Function to show bot status
show_status() {
    echo "🤖 WillyGoldKiller Bot Status"
    echo "================================"
    pm2 status willygoldkiller-bot
    echo ""
}

# Function to show recent logs
show_logs() {
    echo "📋 Recent Bot Logs (last 20 lines)"
    echo "=================================="
    pm2 logs willygoldkiller-bot --lines 20
    echo ""
}

# Function to show system resources
show_resources() {
    echo "💻 System Resources"
    echo "==================="
    echo "CPU Usage:"
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
    echo "Memory Usage:"
    free -h | grep Mem | awk '{print $3 "/" $2}'
    echo "Disk Usage:"
    df -h / | tail -1 | awk '{print $5}'
    echo ""
}

# Function to restart bot
restart_bot() {
    print_status "Restarting WillyGoldKiller Bot..."
    pm2 restart willygoldkiller-bot
    print_success "Bot restarted successfully!"
    echo ""
    show_status
}

# Function to stop bot
stop_bot() {
    print_warning "Stopping WillyGoldKiller Bot..."
    pm2 stop willygoldkiller-bot
    print_success "Bot stopped successfully!"
    echo ""
    show_status
}

# Function to start bot
start_bot() {
    print_status "Starting WillyGoldKiller Bot..."
    pm2 start ecosystem.config.js
    print_success "Bot started successfully!"
    echo ""
    show_status
}

# Function to show help
show_help() {
    echo "🤖 WillyGoldKiller Bot Monitor"
    echo "=============================="
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status    - Show bot status"
    echo "  logs      - Show recent logs"
    echo "  resources - Show system resources"
    echo "  restart   - Restart the bot"
    echo "  stop      - Stop the bot"
    echo "  start     - Start the bot"
    echo "  help      - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 logs"
    echo "  $0 restart"
    echo ""
}

# Main script logic
case "${1:-status}" in
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "resources")
        show_resources
        ;;
    "restart")
        restart_bot
        ;;
    "stop")
        stop_bot
        ;;
    "start")
        start_bot
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 