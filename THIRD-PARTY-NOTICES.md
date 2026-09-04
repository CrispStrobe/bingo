# Third-party notices

Bingo Party (`bingo-party` 1.0.0) is distributed under the GNU AGPL v3.0
with an additional permission under section 7 — see [LICENSE](LICENSE). It bundles
the following third-party work.

## Fonts (shipped as .woff2 in the app)

Both are licensed under the **SIL Open Font License, Version 1.1**, reproduced in
full at [licenses/OFL-1.1.txt](licenses/OFL-1.1.txt).

- **Fredoka** — Copyright 2016 The Fredoka Project Authors
  (https://github.com/hafontia/Fredoka-One)
- **Outfit** — Copyright 2021 The Outfit Project Authors
  (https://github.com/Outfitio/Outfit-Fonts)

## Web frontend (shipped in the bundle)

- **react** — MIT — https://github.com/facebook/react
- **react-dom** — MIT — https://github.com/facebook/react
- **qrcode** — MIT — https://github.com/soldair/node-qrcode
- **dijkstrajs** — MIT — https://github.com/tcort/dijkstrajs
- **pngjs** — MIT — https://github.com/pngjs/pngjs
- **jsQR** — Apache-2.0 — https://github.com/cozmo/jsQR

Build-time only, not shipped: Vite (MIT), TypeScript (Apache-2.0),
@tauri-apps/cli (MIT OR Apache-2.0), gh-pages (MIT).

## Native shell (Tauri, 502 Rust crates)

The desktop and mobile apps embed a Tauri shell. Tauri itself is dual-licensed
**MIT OR Apache-2.0**. The full crate graph, grouped by licence:

### Apache-2.0 OR MIT (297)

android_system_properties 0.1.6, anyhow 1.0.104, async-broadcast 0.7.2, async-channel 2.5.0, async-executor 1.14.0, async-io 2.6.0, async-lock 3.4.2, async-process 2.5.0, async-recursion 1.1.1, async-signal 0.2.14, async-task 4.7.1, async-trait 0.1.92, atomic-waker 1.1.2, autocfg 1.5.1, base64 0.21.7, base64 0.22.1, bit-set 0.8.0, bit-vec 0.8.0, bitflags 1.3.2, bitflags 2.13.1, block-buffer 0.10.4, blocking 1.7.0, bs58 0.5.1, bumpalo 3.20.3, camino 1.2.5, cargo-platform 0.1.9, cargo_toml 0.22.3, cc 1.4.5, cesu8 1.1.0, cfg-expr 0.15.8, cfg-if 1.0.4, chrono 0.4.45, concurrent-queue 2.5.0, cookie 0.18.2, core-foundation 0.10.1, core-foundation-sys 0.8.7, core-graphics 0.25.0, core-graphics-types 0.2.0, cpufeatures 0.2.17, crc32fast 1.5.1, crossbeam-channel 0.5.16, crossbeam-utils 0.8.22, crypto-common 0.1.7, ctor 0.8.0, ctor-proc-macro 0.0.7, dbus 0.9.12, defmt 1.1.1, defmt-macros 1.1.1, defmt-parser 1.0.0, deranged 0.5.8, derive_builder 0.20.2, derive_builder_core 0.20.2, derive_builder_macro 0.20.2, digest 0.10.7, dirs 6.0.0, dirs-sys 0.5.0, displaydoc 0.2.7, dtoa 1.0.11, dtor 0.3.0, dtor-proc-macro 0.0.6, dyn-clone 1.0.20, either 1.18.0, embed_plist 1.2.2, enumflags2 0.7.12, enumflags2_derive 0.7.12, equivalent 1.0.2, erased-serde 0.4.10, errno 0.3.14, event-listener 5.4.2, event-listener-strategy 0.5.4, fastrand 2.5.0, fdeflate 0.3.7, field-offset 0.3.6, find-msvc-tools 0.1.12, flate2 1.1.10, fnv 1.0.7, foreign-types 0.5.0, foreign-types-macros 0.2.4, foreign-types-shared 0.3.1, form_urlencoded 1.2.2, futures-channel 0.3.34, futures-core 0.3.34, futures-executor 0.3.34, futures-io 0.3.34, futures-lite 2.6.1, futures-macro 0.3.34, futures-sink 0.3.34, futures-task 0.3.34, futures-util 0.3.34, getrandom 0.2.17, getrandom 0.3.4, getrandom 0.4.3, glob 0.3.4, hashbrown 0.12.3, hashbrown 0.17.1, heck 0.4.1, heck 0.5.0, hermit-abi 0.5.3, hex 0.4.3, html5ever 0.38.0, http 1.5.0, httparse 1.10.1, httpdate 1.0.3, iana-time-zone 0.1.65, iana-time-zone-haiku 0.1.2, ident_case 1.0.1, idna 1.1.0, idna_adapter 1.2.2, indexmap 1.9.3, indexmap 2.14.1, ipnet 2.12.1, itoa 1.0.18, jni 0.21.1, jni-sys 0.3.1, jni-sys 0.4.1, jni-sys-macros 0.4.1, js-sys 0.3.104, json-patch 3.0.1, jsonptr 0.6.3, keyboard-types 0.7.0, libappindicator 0.9.0, libappindicator-sys 0.9.0, libc 0.2.189, libdbus-sys 0.2.7, local-ip-address 0.6.13, lock_api 0.4.14, log 0.4.34, markup5ever 0.38.0, mime 0.3.17, muda 0.19.3, ndk 0.9.0, ndk-sys 0.6.0+11769913, num-conv 0.2.2, num-traits 0.2.19, once_cell 1.21.4, ordered-stream 0.2.0, parking 2.2.1, parking_lot 0.12.5, parking_lot_core 0.9.12, percent-encoding 2.3.2, pin-project-lite 0.2.17, piper 0.2.5, pkg-config 0.3.34, png 0.17.16, png 0.18.1, polling 3.11.0, portable-atomic 1.15.0, portable-atomic-util 0.2.7, powerfmt 0.2.0, ppv-lite86 0.2.21, proc-macro-crate 1.3.1, proc-macro-crate 2.0.2, proc-macro-crate 3.5.0, proc-macro-error 1.0.4, proc-macro-error-attr 1.0.4, proc-macro2 1.0.107, qrcode 0.14.1, quote 1.0.47, rand 0.9.5, rand_chacha 0.9.0, rand_core 0.9.5, ref-cast 1.0.27, ref-cast-impl 1.0.27, regex 1.13.1, regex-automata 0.4.18, regex-syntax 0.8.11, reqwest 0.13.4, rustc-hash 2.1.3, rustc_version 0.4.1, rustversion 1.0.23, scopeguard 1.2.0, semver 1.0.28, serde 1.0.229, serde-untagged 0.1.9, serde_core 1.0.229, serde_derive 1.0.229, serde_derive_internals 0.29.1, serde_json 1.0.151, serde_path_to_error 0.1.20, serde_repr 0.1.21, serde_spanned 0.6.9, serde_spanned 1.1.1, serde_urlencoded 0.7.1, serde_with 3.22.0, serde_with_macros 3.22.0, serialize-to-javascript 0.1.2, serialize-to-javascript-impl 0.1.2, servo_arc 0.4.3, sha1 0.10.7, sha2 0.10.9, shlex 2.0.1, signal-hook-registry 1.4.8, siphasher 1.0.3, smallvec 1.16.0, socket2 0.6.5, softbuffer 0.4.8, stable_deref_trait 1.2.1, string_cache 0.9.0, string_cache_codegen 0.6.1, swift-rs 1.0.8, syn 1.0.109, syn 2.0.119, syn 3.0.4, system-deps 6.2.2, tao-macros 0.1.4, tauri 2.11.5, tauri-build 2.6.3, tauri-codegen 2.6.3, tauri-macros 2.6.3, tauri-plugin 2.6.3, tauri-plugin-opener 2.5.5, tauri-runtime 2.11.3, tauri-runtime-wry 2.11.4, tauri-utils 2.9.3, tempfile 3.27.0, tendril 0.5.1, thiserror 1.0.69, thiserror 2.0.20, thiserror-impl 1.0.69, thiserror-impl 2.0.20, time 0.3.55, time-core 0.1.9, time-macros 0.2.32, toml 0.8.2, toml 0.9.12+spec-1.1.0, toml 1.1.5+spec-1.1.0, toml_datetime 0.6.3, toml_datetime 0.7.5+spec-1.1.0, toml_datetime 1.1.1+spec-1.1.0, toml_edit 0.19.15, toml_edit 0.20.2, toml_edit 0.25.13+spec-1.1.0, toml_parser 1.1.3+spec-1.1.0, toml_writer 1.1.2+spec-1.1.0, tray-icon 0.24.2, tungstenite 0.29.0, typeid 1.0.3, typenum 1.20.1, unic-char-property 0.9.0, unic-char-range 0.9.0, unic-common 0.9.0, unic-ucd-ident 0.9.0, unic-ucd-version 0.9.0, unicode-segmentation 1.13.3, url 2.5.8, utf8_iter 1.0.4, uuid 1.26.0, version_check 0.9.5, wasm-bindgen 0.2.127, wasm-bindgen-futures 0.4.77, wasm-bindgen-macro 0.2.127, wasm-bindgen-macro-support 0.2.127, wasm-bindgen-shared 0.2.127, wasm-streams 0.5.0, web-sys 0.3.104, web_atoms 0.2.6, winapi 0.3.9, winapi-i686-pc-windows-gnu 0.4.0, winapi-x86_64-pc-windows-gnu 0.4.0, window-vibrancy 0.6.0, windows 0.61.3, windows-collections 0.2.0, windows-core 0.61.2, windows-core 0.62.2, windows-future 0.2.1, windows-implement 0.60.2, windows-interface 0.59.3, windows-link 0.1.3, windows-link 0.2.1, windows-numerics 0.2.0, windows-result 0.3.4, windows-result 0.4.1, windows-strings 0.4.2, windows-strings 0.5.1, windows-sys 0.45.0, windows-sys 0.59.0, windows-sys 0.61.2, windows-targets 0.42.2, windows-targets 0.52.6, windows-threading 0.1.0, windows-version 0.1.7, windows_aarch64_gnullvm 0.42.2, windows_aarch64_gnullvm 0.52.6, windows_aarch64_msvc 0.42.2, windows_aarch64_msvc 0.52.6, windows_i686_gnu 0.42.2, windows_i686_gnu 0.52.6, windows_i686_gnullvm 0.52.6, windows_i686_msvc 0.42.2, windows_i686_msvc 0.52.6, windows_x86_64_gnu 0.42.2, windows_x86_64_gnu 0.52.6, windows_x86_64_gnullvm 0.42.2, windows_x86_64_gnullvm 0.52.6, windows_x86_64_msvc 0.42.2, windows_x86_64_msvc 0.52.6, wry 0.55.1

### MIT (121)

atk 0.18.2, atk-sys 0.18.2, axum 0.8.9, axum-core 0.5.6, block2 0.6.2, bytes 1.12.1, cairo-rs 0.18.5, cairo-sys-rs 0.18.2, cargo_metadata 0.19.2, cfb 0.7.3, combine 4.6.8, darling 0.20.11, darling 0.23.0, darling_core 0.20.11, darling_core 0.23.0, darling_macro 0.20.11, darling_macro 0.23.0, data-encoding 2.11.1, derive_more 2.1.1, derive_more-impl 2.1.1, dlopen2 0.8.2, dlopen2_derive 0.4.3, dom_query 0.27.0, embed-resource 3.0.11, endi 1.1.1, gdk 0.18.2, gdk-pixbuf 0.18.5, gdk-pixbuf-sys 0.18.0, gdk-sys 0.18.2, gdkwayland-sys 0.18.2, gdkx11 0.18.2, gdkx11-sys 0.18.2, generic-array 0.14.7, getset 0.1.7, gio 0.18.4, gio-sys 0.18.1, glib 0.18.5, glib-macros 0.18.5, glib-sys 0.18.1, gobject-sys 0.18.0, gtk 0.18.2, gtk-sys 0.18.2, gtk3-macros 0.18.2, http-body 1.1.0, http-body-util 0.1.5, hyper 1.11.1, hyper-util 0.1.20, ico 0.5.0, infer 0.19.0, is-docker 0.2.0, is-wsl 0.4.0, javascriptcore-rs 1.1.2, javascriptcore-rs-sys 1.1.1, libredox 0.1.23, memoffset 0.9.1, mio 1.2.3, new_debug_unreachable 1.0.6, objc2 0.6.4, objc2-encode 4.1.0, objc2-foundation 0.3.2, open 5.4.3, pango 0.18.3, pango-sys 0.18.0, phf 0.13.1, phf_codegen 0.13.1, phf_generator 0.13.1, phf_macros 0.13.1, phf_shared 0.13.1, plist 1.10.0, precomputed-hash 0.1.1, quick-xml 0.41.0, redox_syscall 0.5.18, redox_users 0.5.2, schemars 0.8.22, schemars 0.9.0, schemars 1.2.2, schemars_derive 0.8.22, simd-adler32 0.3.10, slab 0.4.12, soup3 0.5.0, soup3-sys 0.5.0, strsim 0.11.1, synstructure 0.13.2, tauri-winres 0.3.6, tokio 1.53.1, tokio-macros 2.7.2, tokio-tungstenite 0.29.0, tokio-util 0.7.19, tower 0.5.3, tower-http 0.6.11, tower-layer 0.3.3, tower-service 0.3.3, tracing 0.1.44, tracing-attributes 0.1.31, tracing-core 0.1.36, try-lock 0.2.5, uds_windows 1.2.1, urlpattern 0.3.0, version-compare 0.2.1, vswhom 0.1.0, vswhom-sys 0.1.3, want 0.3.1, webkit2gtk 2.0.2, webkit2gtk-sys 2.0.2, webview2-com 0.38.2, webview2-com-macros 0.8.1, webview2-com-sys 0.38.2, winnow 0.5.40, winnow 0.7.15, winnow 1.0.4, winreg 0.55.0, x11 2.21.0, x11-dl 2.21.0, zbus 5.19.0, zbus_macros 5.19.0, zbus_names 4.3.4, zcheapstr 1.1.0, zmij 1.0.23, zvariant 5.15.0, zvariant_derive 5.15.0, zvariant_utils 4.2.0

### Apache-2.0 OR MIT OR Zlib (21)

bytemuck 1.25.2, dispatch2 0.3.1, miniz_oxide 0.8.9, miniz_oxide 0.9.1, objc2-app-kit 0.3.2, objc2-cloud-kit 0.3.2, objc2-core-data 0.3.2, objc2-core-foundation 0.3.2, objc2-core-graphics 0.3.2, objc2-core-image 0.3.2, objc2-core-location 0.3.2, objc2-core-text 0.3.2, objc2-exception-helper 0.1.1, objc2-io-surface 0.3.2, objc2-quartz-core 0.3.2, objc2-ui-kit 0.3.2, objc2-user-notifications 0.3.2, objc2-web-kit 0.3.2, raw-window-handle 0.6.2, tinyvec 1.13.2, tinyvec_macros 0.1.1

### Unicode-3.0 (18)

icu_collections 2.3.0, icu_locale_core 2.3.0, icu_normalizer 2.3.0, icu_normalizer_data 2.3.0, icu_properties 2.3.0, icu_properties_data 2.3.0, icu_provider 2.3.1, litemap 0.8.3, potential_utf 0.1.6, tinystr 0.8.4, writeable 0.6.4, yoke 0.8.3, yoke-derive 0.8.2, zerofrom 0.1.8, zerofrom-derive 0.1.7, zerotrie 0.2.5, zerovec 0.11.8, zerovec-derive 0.11.6

### MIT OR Unlicense (11)

aho-corasick 1.1.5, byteorder 1.5.0, jiff 0.2.35, jiff-core 0.1.0, jiff-static 0.2.35, jiff-tzdb 0.1.8, jiff-tzdb-platform 0.1.3, memchr 2.8.3, same-file 1.0.6, walkdir 2.5.0, winapi-util 0.1.11

### MPL-2.0 (5)

cssparser 0.36.0, cssparser-macros 0.6.1, dtoa-short 0.3.5, option-ext 0.2.0, selectors 0.36.1

### Apache-2.0 OR Apache-2.0 WITH LLVM-exception OR MIT (5)

linux-raw-sys 0.12.1, rustix 1.1.4, wasi 0.11.1+wasi-snapshot-preview1, wasip2 1.0.4+wasi-0.2.12, wit-bindgen 0.57.1

### BSD-3-Clause (4)

alloc-no-stdlib 2.0.4, alloc-stdlib 0.2.4, neli 0.7.4, neli-proc-macros 0.2.2

### BSD-3-Clause AND MIT (2)

brotli 8.0.4, matchit 0.8.4

### Zlib (2)

foldhash 0.2.0, zlib-rs 0.6.7

### Apache-2.0 OR BSD-3-Clause OR MIT (2)

num_enum 0.7.6, num_enum_derive 0.7.6

### Apache-2.0 OR LGPL-2.1-or-later OR MIT (2)

r-efi 5.3.0, r-efi 6.0.0

### Apache-2.0 (2)

sync_wrapper 1.0.2, tao 0.35.3

### Apache-2.0 OR BSD-2-Clause OR MIT (2)

zerocopy 0.8.56, zerocopy-derive 0.8.56

### 0BSD OR Apache-2.0 OR MIT (1)

adler2 2.0.1

### BSD-3-Clause OR MIT (1)

brotli-decompressor 5.0.3

### Apache-2.0 AND MIT (1)

dpi 0.1.2

### Apache-2.0 OR CC0-1.0 OR MIT-0 (1)

dunce 1.0.5

### ISC (1)

libloading 0.7.4

### Apache-2.0 OR BSL-1.0 (1)

ryu 1.0.23

### Apache-2.0 WITH LLVM-exception (1)

target-lexicon 0.12.16

### (Apache-2.0 OR MIT) AND Unicode-3.0 (1)

unicode-ident 1.0.24

Nothing in the tree is GPL- or LGPL-only: the 5 MPL-2.0 crates are file-level
copyleft and impose no condition that conflicts with app-marketplace
distribution, and every dual-licensed crate is taken under its MIT or Apache-2.0
option.

_Generated by `scripts/generate-notices.mjs`._
