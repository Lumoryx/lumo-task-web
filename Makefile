# -----------------------------------------------------------------------
# Lumo Task -- top-level Makefile
#
# Usage:
#   make            ->  install deps (if needed) + start dev server
#   make <target>   ->  run specific target  (see `make help`)
#
# Requires: Node 20+, npm, git, gh (GitHub CLI)
# -----------------------------------------------------------------------

APP := web-app

.DEFAULT_GOAL := dev
.PHONY: dev install build preview typecheck lint ci clean reset help

# Sentinel file: rebuild (npm ci) whenever package-lock.json changes.
$(APP)/node_modules: $(APP)/package-lock.json
	@echo ">>> Installing dependencies..."
	cd $(APP) && npm ci
	@touch $(APP)/node_modules

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
# Maintenance
# -----------------------------------------------------------------------

clean:   ## Remove node_modules and dist
	rm -rf $(APP)/node_modules $(APP)/dist
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
	@echo "  dev          Start dev server at http://localhost:5173  [DEFAULT]"
	@echo "  install      Install / refresh npm dependencies"
	@echo "  preview      Build then preview production bundle locally"
	@echo ""
	@echo "Quality:"
	@echo "  typecheck    TypeScript type check (tsc --noEmit)"
	@echo "  lint         ESLint"
	@echo "  build        Production build (tsc -b + vite build)"
	@echo "  ci           typecheck + lint + build  (mirrors CI gate)"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean        Remove node_modules and dist"
	@echo "  reset        Print commands to clear localStorage demo data"
	@echo ""
