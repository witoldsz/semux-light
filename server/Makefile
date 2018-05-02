export PATH := node_modules/.bin:$(PATH)

.PHONY: dist
dist: dist/COMPILED

.PHONY: deploy
deploy: dist/COMPILED
	node dist/app.js

.PHONY: debug
debug: dist/COMPILED
	node --inspect=0.0.0.0 dist/app.js

.PHONY: clean
clean:
	rm -rf dist

dist/COMPILED: node_modules/INSTALLED $(shell find ./src -type f)
	tslint -p src -t codeFrame
	tsc -p src/tsconfig.json
	touch $@

node_modules/INSTALLED: package.json
	npm install
	touch $@
