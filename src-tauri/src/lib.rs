//! The whole game is the web frontend; this shell hosts it and, on request,
//! serves it to every other device on the local network.
//! Everything lives in the library target so the iOS build can link `libapp.a`.

mod lan;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // only used by the About dialog, to hand a link to the system browser
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(lan::Lan::default());
            // Kiosk/testing hook: come up already sharing, so a device can join
            // without anyone touching the host screen first.
            if std::env::var("BINGO_LAN_AUTOSTART").is_ok() {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    match lan::lan_start(handle).await {
                        Ok(info) => println!("[bingo] sharing on {}", info.url),
                        Err(e) => eprintln!("[bingo] could not share: {e}"),
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            lan::lan_start,
            lan::lan_stop,
            lan::lan_status,
            lan::lan_send
        ])
        .run(tauri::generate_context!())
        .expect("error while running Bingo Party");
}
