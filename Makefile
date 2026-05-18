# -----------------------------------------------------------------------
# Lumo Task -- top-level Makefile
#
# Usage:
#   make            ->  install deps (if needed) + start dev server
#   make <target>   ->  run specific target  (see `make help`)
#
# Requires: Node 20+, npm, git, gh (GitHub CLI)
# -----------------------------------------------------------------------

APP     := web-app
BACKEND := backend

.DEFAULT_GOAL := dev
.PHONY: dev install build preview typecheck lint ci clean reset \
        backend-install backend-build backend-dev backend-migrate backend-seed \
        dev-full package-win help

# Sentinel files: rebuild when package-lock.json changes.
$(APP)/node_modules: $(APP)/package-lock.json
	@echo ">>> Installing web-app dependencies..."
	cd $(APP) && npm ci
	@touch $(APP)/node_modules

$(BACKEND)/node_modules: $(BACKEND)/package-lock.json
	@echo ">>> Installing backend dependencies..."
	cd $(BACKEND) && npm ci
	@touch $(BACKEND)/node_modules

# -----------------------------------------------------------------------
# Development
# -----------------------------------------------------------------------

dev: $(APP)/node_modules   ## Start dev server at http://localhost:5173  [DEFAULT]
	@echo ">>> Starting dev server at http://localhost:5173"
	cd $(APP) && npm run dev

install:                   ## Install / refresh dependencies
	cd $(APP) && npm install

preview: build             ## Preview the production build locally
	cd $(APP) && npm run preview

# -----------------------------------------------------------------------
# Quality checks
# -----------------------------------------------------------------------

typecheck: $(APP)/node_modules   ## TypeScript type check (tsc --noEmit)
	cd $(APP) && npm run typecheck

lint: $(APP)/node_modules        ## ESLint
	cd $(APP) && npm run lint

build: $(APP)/node_modules       ## Production build (tsc -b + vite build)
	cd $(APP) && npm run build

ci: typecheck lint build         ## Run all CI checks locally (mirrors GitHub Actions)
	@echo ""
	@echo ">>> All CI checks passed."

# -----------------------------------------------------------------------
# Backend
# -----------------------------------------------------------------------

backend-install: $(BACKEND)/node_modules   ## Install backend dependencies

backend-build: $(BACKEND)/node_modules     ## Compile backend TypeScript → backend/dist/
	@echo ">>> Building backend..."
	cd $(BACKEND) && npm run build
	@echo ">>> Backend built."

backend-dev: $(BACKEND)/node_modules       ## Run backend in dev mode (tsx watch, port 47291)
	cd $(BACKEND) && LUMO_JWT_SECRET=dev-secret npm run dev

backend-migrate: $(BACKEND)/node_modules   ## Run DB migrations (creates lumo.db in backend/)
	cd $(BACKEND) && npm run migrate

backend-seed: $(BACKEND)/node_modules      ## Seed DB with demo data
	cd $(BACKEND) && npm run seed

dev-full: $(APP)/node_modules $(BACKEND)/node_modules   ## Run frontend + backend concurrently
	@echo ">>> Starting frontend (5173) and backend (47291) together..."
	@trap 'kill 0' INT TERM EXIT; \
	 ( cd $(BACKEND) && LUMO_JWT_SECRET=dev-secret npm run dev ) & \
	 ( cd $(APP) && npm run dev ) & \
	 wait

# -----------------------------------------------------------------------
# Desktop packaging
# -----------------------------------------------------------------------

package-win: $(APP)/node_modules backend-build build   ## Build backend + frontend, package Windows installer
	@echo ">>> Packaging for Windows (x64)..."
	cd $(APP) && npx electron-builder --win --x64 --config.directories.output="$(CURDIR)/$(APP)/dist-electron"
	@echo ">>> Done. Installer is in $(APP)/dist-electron/"

# -----------------------------------------------------------------------
# Maintenance
# -----------------------------------------------------------------------

clean:   ## Remove node_modules and dist artifacts
	rm -rf $(APP)/node_modules $(APP)/dist $(APP)/dist-electron
	rm -rf $(BACKEND)/node_modules $(BACKEND)/dist
	@echo ">>> Cleaned."

reset:   ## Print the localStorage commands to reset demo data
	@echo ""
	@echo "Open the browser console (F12) and paste:"
	@echo "  localStorage.removeItem('lumo.tasks.v1')"
	@echo "  localStorage.removeItem('lumo.auth.v1')"
	@echo "  location.reload()"
	@echo ""

# -----------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------

help:   ## Show this help
	@echo ""
	@echo "Usage:  make [target]"
	@echo ""
	@echo "Development:"
	@echo "  dev              Start frontend dev server at http://localhost:5173  [DEFAULT]"
	@echo "  install          Install / refresh web-app dependencies"
	@echo "  preview          Build then preview production bundle locally"
	@echo "  dev-full         Run frontend + backend together (concurrently)"
	@echo ""
	@echo "Backend:"
	@echo "  backend-install  Install backend npm dependencies"
	@echo "  backend-build    Compile backend TypeScript → backend/dist/"
	@echo "  backend-dev      Run backend in dev mode (tsx watch)"
	@echo "  backend-migrate  Run DB migrations"
	@echo "  backend-seed     Seed DB with demo data"
	@echo ""
	@echo "Quality:"
	@echo "  typecheck    TypeScript type check (tsc --noEmit)"
	@echo "  lint         ESLint"
	@echo "  build        Frontend production build"
	@echo "  ci           typecheck + lint + build  (mirrors CI gate)"
	@echo ""
	@echo "Desktop:"
	@echo "  package-win  Build backend + frontend, package Windows installer → web-app/dist-electron/"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean        Remove node_modules and dist artifacts"
	@echo "  reset        Print commands to clear localStorage auth data"
	@echo ""
