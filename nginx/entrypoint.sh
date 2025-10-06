#!/bin/sh
set -e

mkdir -p /etc/ssl/private

IP_ADDR="${HOST_IP:-${DOMAIN:-}}"
if [ -z "$IP_ADDR" ]; then
    echo "HOST_IP/DOMAIN not set. Falling back to localhost"
    IP_ADDR="localhost"
fi

if grep -q "!DOMAIN!" /etc/nginx/nginx.conf; then
    echo "Updating nginx.conf with IP/Domain: $IP_ADDR"
    sed "s|!DOMAIN!|$IP_ADDR|g" /etc/nginx/nginx.conf > /tmp/nginx.conf
    cat /tmp/nginx.conf > /etc/nginx/nginx.conf   # üzerine yaz
    rm -f /tmp/nginx.conf
fi

if echo "$IP_ADDR" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
    SAN_VALUE="IP:$IP_ADDR,DNS:localhost"
else
    SAN_VALUE="DNS:$IP_ADDR,DNS:localhost"
fi

if [ ! -f "/etc/ssl/private/nginx.key" ] || [ ! -f "/etc/ssl/private/nginx.crt" ]; then
    echo "Creating SSL certificate for $IP_ADDR..."

    openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
        -keyout /etc/ssl/private/nginx.key \
        -out /etc/ssl/private/nginx.crt \
        -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Development/OU=IT/CN=$IP_ADDR" \
        -addext "subjectAltName=$SAN_VALUE" \
        -addext "keyUsage=digitalSignature,keyEncipherment" \
        -addext "extendedKeyUsage=serverAuth"

    echo "SSL certificate created for $IP_ADDR (SAN: $SAN_VALUE)"
else
    echo "SSL certificate already exists!"
fi

exec nginx -g 'daemon off;'
