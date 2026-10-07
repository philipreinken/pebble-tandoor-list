.PHONY: clean
clean:
	pebble clean

build/: clean
	pebble build

.PHONY: debug
debug: clean
	pebble build --debug

.PHONY: install
install: build/
	pebble install --emulator="emery" --logs
