export PATH := node_modules/.bin:$(PATH)

.PHONY: dist
dist: dist/COMPILED dist/DOCROOT

.PHONY: clean
clean:
	rm -rf dist

.PHONY: compile-watch
compile-watch: dist/DOCROOT
	webpack --watch

node_modules/INSTALLED: package.json
	npm install
	touch $@

dist/COMPILED: node_modules/INSTALLED $(shell find src/main -type f)
	tslint -p src -t codeFrame
	webpack
	touch $@

dist/DOCROOT: $(shell find src/docroot -type f)
	mkdir -p dist
	cp -rf src/docroot/* dist
	touch $@
