#include <pebble.h>

int main(void) {
  Window *w = window_create();
  window_stack_push(w, true);

#ifdef PBL_DEBUG
  // Built with `pebble build --debug`: enable the xsbug JavaScript debugger.
  moddable_createMachine(&(ModdableCreationRecord){
    .recordSize = sizeof(ModdableCreationRecord),
    .chunk = 24576,
    .slot = 49152,
    .stack = 8192,
    .flags = kModdableCreationFlagDebug
  });
#else
  moddable_createMachine(&(ModdableCreationRecord){
    .recordSize = sizeof(ModdableCreationRecord),
    .chunk = 24576,
    .slot = 49152,
    .stack = 8192
  });
#endif

  window_destroy(w);
}
