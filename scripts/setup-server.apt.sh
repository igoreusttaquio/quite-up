#!/bin/bash
set -e

echo "==> Atualizando pacotes..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Instalando dependências do Docker..."
sudo apt-get install -y ca-certificates curl

echo "==> Adicionando repositório oficial do Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y

echo "==> Instalando Docker..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Iniciando e habilitando Docker..."
sudo systemctl enable --now docker

echo "==> Adicionando usuário atual ao grupo docker..."
sudo usermod -aG docker "$USER"

echo "==> Instalando make (para usar o Makefile)..."
sudo apt-get install -y make

echo ""
echo "✔ Setup concluído."
echo ""
echo "IMPORTANTE: faça logout e login novamente para aplicar o grupo docker, depois rode:"
echo "  cd quite-up"
echo "  cp .env.example .env"
echo "  # edite o .env com seus valores reais"
echo "  make build"
echo "  make up"
