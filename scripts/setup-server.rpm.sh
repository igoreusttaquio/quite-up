#!/bin/bash
set -e

echo "==> Atualizando pacotes..."
sudo dnf update -y

echo "==> Instalando Docker..."
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Iniciando e habilitando Docker..."
sudo systemctl enable --now docker

echo "==> Adicionando usuário atual ao grupo docker..."
sudo usermod -aG docker "$USER"

echo "==> Instalando make (para usar o Makefile)..."
sudo dnf install -y make

echo ""
echo "✔ Setup concluído."
echo ""
echo "IMPORTANTE: faça logout e login novamente para aplicar o grupo docker, depois rode:"
echo "  cd quite-up"
echo "  cp .env.example .env"
echo "  # edite o .env com seus valores reais"
echo "  make build"
echo "  make up"
