# tandoor-list

> *Check your tandoor recipes shopping list on the go 📝*

This app connects to a [Tandoor](https://tandoor.dev/) instance, loads the current shopping list, and lets you mark items as checked directly from your Pebble watch.

<details><summary>Screenshot</summary>

![](./screenshot.png)

</details>

## Building & running

```sh
make install    # build and install in the local emulator
make cloud      # build and install on a watch using the pebble app dev-connection
make config     # configure the emulator app instance
make debug      # run a debug build in the local emulator
```

### CI/CD Pipeline

The pipeline is implemented with [dagger.io](https://dagger.io).

For a list of possible tasks, checkout this repo and run

```bash
dagger functions
```

There are also some `make` targets to help you out:

```bash
make ci-install # run the ci build and install the result in the local emulator
```

## Is this vibecoded?

No! I take full responsibility for shitty code; all done by hand, like way back in the dark ages 🧙‍♂️
