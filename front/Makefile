SHELL=/bin/bash
export PATH := node_modules/.bin:$(PATH)

.PHONY: build
build: build/COMPILED build/DOCROOT

.PHONY: clean
clean:
	rm -rf dist build

.PHONY: compile-watch
compile-watch: build/DOCROOT
	webpack --watch

node_modules/INSTALLED: package.json
	npm install
	touch $@

build/COMPILED: node_modules/INSTALLED $(shell find src/main -type f)
	tslint -p src -t codeFrame
	webpack
	touch $@

build/DOCROOT: $(shell find src/docroot -type f)
	mkdir -p build
	cp -rf src/docroot/* build
	touch $@
