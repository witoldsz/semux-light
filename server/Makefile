export PATH := node_modules/.bin:$(PATH)

.PHONY: build
build: build/COMPILED

.PHONY: deploy
deploy:
	node build/app.js

.PHONY: debug
debug: build/COMPILED
	node --inspect=0.0.0.0 build/app.js

.PHONY: clean
clean:
	rm -rf dist build

build/COMPILED: node_modules/INSTALLED $(shell find ./src -type f)
	tslint -p src -t codeFrame
	tsc -p src/tsconfig.json
	touch $@

node_modules/INSTALLED: package.json
	npm install
	touch $@
