.PHONY: help build up down logs clean prune clean-volumes install lint re

help:
	@echo "🚀 ft_transcendence DevOps Automation Commands"
	@echo "=============================================="
	@echo ""
	@echo "📦 CORE OPERATIONS:"
	@echo "  make up          - Start all services (development mode)"
	@echo "  make down        - Stop all services gracefully"
	@echo "  make build       - Build all containers from scratch"
	@echo "  make re          - Full rebuild cycle (clean + build + up)"
	@echo ""
	@echo "📊 MONITORING & DEBUGGING:"
	@echo "  make logs        - Show real-time logs from all services"
	@echo "  make status      - Display detailed service health status"
	@echo "  make shell       - Interactive shell access to services"
	@echo ""
	@echo "🧹 CLEANUP & MAINTENANCE:"
	@echo "  make clean       - Remove containers, images AND volumes"
	@echo "  make prune       - Docker system cleanup (preserves volumes)"
	@echo "  make clean-volumes - ⚠️  REMOVE ALL VOLUMES (DATA LOSS!)"
	@echo ""
	@echo "🔧 DEVELOPMENT WORKFLOW:"
	@echo "  make install     - Install dependencies in all services"
	@echo "  make test        - Run comprehensive test suite"
	@echo "  make lint        - Code quality analysis ve formatting"
	@echo ""
	@echo "🧪 COMPREHENSIVE TEST SUITE:"
	@echo "  make test-super-final    - 🏆 Super Final Tester (PDF compliance)"
	@echo "  make test-comprehensive  - 🧪 Full functionality test"
	@echo "  make test-api-endpoints  - 🔌 API validation"
	@echo "  make test-functional     - ⚙️ Core functionality"
	@echo "  make test-security       - 🛡️ Security measures"
	@echo "  make test-frontend       - 🎮 Frontend validation"
	@echo "  make test-all           - 📋 All test suites"
	@echo "  make test-smoke         - 💨 Quick health check"
	@echo "  make test-critical      - 🚨 Critical tests only"
	@echo ""
	@echo "🗄️  DATABASE MANAGEMENT:"
	@echo "  make db-init     - Initialize database with schema"
	@echo "  make db-show     - Show all database tables"
	@echo "  make db-users    - Show users table content"
	@echo "  make db-shell    - Open SQLite shell"
	@echo "  make db-backup   - Backup database to file"
	@echo "  make db-restore  - Restore database from backup"
	@echo "  make db-reset    - Reset database (delete + recreate)"
	@echo "  make db-info     - Show database file information"
	@echo ""
	@echo "🎯 QUICK ACTIONS:"
	@echo "  make dev         - Full development environment setup"
	@echo "  make prod        - Production simulation mode"

up:
	@echo "🚀 Starting ft_transcendence..."
	docker compose up --build

up-d:
	@echo "🚀 Starting ft_transcendence in background..."
	docker compose up --build -d

down:
	@echo "🛑 Stopping ft_transcendence..."
	docker compose down

build:
	@echo "🔨 Building containers..."
	docker compose build

re:
	@echo "🔄 Rebuilding everything..."
	@echo "🛑 Stopping containers..."
	docker compose down --remove-orphans
	@echo "🧹 Cleaning containers and images..."
	docker container prune -f
	docker image prune -f
	@echo "🔨 Building fresh containers..."
	docker compose build --no-cache
	@echo "🚀 Starting services..."
	docker compose up -d
	@echo "✅ Rebuild complete!"

logs:
	docker compose logs -f

clean:
	@echo "🧹 Cleaning up everything (including volumes)..."
	docker compose down -v --rmi all --remove-orphans

prune:
	@echo "🧹 Cleaning Docker system (keeping volumes)..."
	docker compose down --remove-orphans
	@echo "🗑️  Removing unused containers..."
	docker container prune -f
	@echo "🗑️  Removing unused images..."
	docker image prune -f
	@echo "🗑️  Removing unused networks..."
	docker network prune -f
	@echo "🗑️  Removing build cache..."
	docker builder prune -f
	@echo "✅ Docker cleanup complete! (Volumes preserved)"
	rm -rf ./backend/data/transcendence.db
	rm -rf ./backend/src/migrations/*
	@echo "✅ Docker cleanup complete! (Database deleted)"

clean-volumes:
	@echo "⚠️  WARNING: This will remove ALL Docker volumes!"
	@echo "⚠️  Database data will be lost permanently!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ]
	@echo "🗑️  Stopping containers..."
	docker compose down
	@echo "🗑️  Removing ALL volumes..."
	docker volume prune -f
	@echo "🗑️  Removing project volumes..."
	docker volume rm $$(docker volume ls -q | grep ft_trancendence) 2>/dev/null || true
	@echo "⚠️  All volumes removed! Database data is gone."


install:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install

lint:
	@echo "🔍 Running linting..."
	cd frontend && npm run lint
	cd backend && npm run lint || echo "Backend linting not configured yet"

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && npm run dev

setup:
	@echo "⚙️  Setting up environment..."
	cp .env.example .env
	@echo "✅ Environment file created. Please edit .env with your settings."

restart: down up
