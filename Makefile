.PHONY: clean
clean:
	pebble clean

build:
	pebble build

.PHONY: debug
debug: clean
	pebble build --debug
	pebble install --emulator="emery" --logs

.PHONY: install
install: build
	pebble install --emulator="emery" --logs

.PHONY: cloud
cloud: build
	pebble install --cloudpebble --logs

.PHONY: config
config:
	pebble emu-app-config --emulator="emery"

ci-build/app.pbw:
	dagger call --source="." build directory --path="build" export --path="ci-build" --wipe

.PHONY: ci-install
ci-install: ci-build/app.pbw
	pebble install --emulator="emery" --logs $<
