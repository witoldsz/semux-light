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
