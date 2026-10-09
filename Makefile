.PHONY: clean
clean:
	pebble clean

build/: clean
	pebble build

.PHONY: debug
debug: clean
	pebble build --debug
	pebble install --emulator="emery" --logs

.PHONY: install
install: build/
	pebble install --emulator="emery" --logs

.PHONY: cloud
cloud: build/
	pebble install --cloudpebble --logs

.PHONY: config
config:
	pebble emu-app-config --emulator="emery"
