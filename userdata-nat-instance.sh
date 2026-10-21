#!/bin/bash
# Aktifkan IP forwarding pada kernel
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf

# Dapatkan nama interface utama
INTERFACE=$(ip route show default | awk '{print $5}')

# Konfigurasi iptables untuk NAT masquerade
iptables -t nat -A POSTROUTING -o $INTERFACE -j MASQUERADE
iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -o $INTERFACE -j ACCEPT

# Instal iptables-persistent secara non-interaktif
echo iptables-persistent iptables-persistent/autosave_v4 boolean true | debconf-set-selections
echo iptables-persistent iptables-persistent/autosave_v6 boolean true | debconf-set-selections
apt-get update -y
apt-get install -y iptables-persistent
netfilter-persistent save