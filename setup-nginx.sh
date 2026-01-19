#!/bin/bash

# SITA BI - Nginx Setup Script
# This script helps you setup Nginx reverse proxy for SITA BI

echo "=========================================="
echo "SITA BI - Nginx Setup Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt update
    apt install -y nginx
else
    echo "Nginx is already installed"
fi

# Copy nginx configuration
echo ""
echo "Setting up Nginx configuration..."
cp nginx-sitabi.conf /etc/nginx/sites-available/sitabi

# Create symlink
if [ ! -L /etc/nginx/sites-enabled/sitabi ]; then
    ln -s /etc/nginx/sites-available/sitabi /etc/nginx/sites-enabled/sitabi
    echo "Nginx configuration linked"
else
    echo "Nginx configuration already linked"
fi

# Test nginx configuration
echo ""
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
    
    # Reload nginx
    echo "Reloading Nginx..."
    systemctl reload nginx
    systemctl enable nginx
    
    echo ""
    echo "=========================================="
    echo "Nginx setup completed!"
    echo "=========================================="
    echo ""
    echo "Your services are now accessible at:"
    echo "  - Frontend: http://sitabi.mooo.com"
    echo "  - Backend:  http://sita-api.mooo.com"
    echo ""
    echo "To enable HTTPS with Let's Encrypt, run:"
    echo "  sudo apt install certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d sitabi.mooo.com -d sita-api.mooo.com"
    echo ""
    echo "After obtaining SSL certificates, uncomment the HTTPS"
    echo "sections in /etc/nginx/sites-available/sitabi"
    echo "and reload nginx: sudo systemctl reload nginx"
    echo "=========================================="
else
    echo "Nginx configuration test failed!"
    echo "Please check the configuration file"
    exit 1
fi
