// The application is offline. Replacing Expo's lazy native fetch accessor also
// prevents framework teardown from initializing a native network module late.
Object.defineProperty(globalThis, "fetch", {
  configurable: true,
  writable: true,
  value: () =>
    Promise.reject(
      new Error(
        "Akses jaringan tidak diizinkan dalam pengujian offline DistiLab.",
      ),
    ),
});
