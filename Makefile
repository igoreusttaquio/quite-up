.PHONY: up down build logs ps

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f api

ps:
	docker compose ps
