//! The whole game is the web frontend; this shell just hosts it.
//! Everything lives in the library target so the iOS build can link `libapp.a`.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // only used by the About dialog, to hand a link to the system browser
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running Bingo Party");
}
