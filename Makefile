.PHONY: build
build:
	@cd front && make build
	@cd server && make build
	@test -f start.sh || cp _start.sh start.sh && chmod 700 start.sh
	@echo
	@echo adjust ./start.sh and launch it
	@echo

.PHONY: clean
clean:
	@cd front && make clean
	@cd server && make clean
	rm -rf dist

dist: $(shell find front/build -type f)
	rm -rf dist
	mkdir dist
	$(eval TIME := $(shell date '+%Y-%m-%d_%H-%M'))
	$(eval NAME := semux-light-${TIME})
	cp -R front/build dist/${NAME}
	cd dist && zip -rm9 ${NAME} ${NAME}
