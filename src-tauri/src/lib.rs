#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};

/// Desktop: closing the window hides it to the tray so the tank keeps
/// simulating; quit and display modes live in the tray menu, and mode changes
/// are forwarded to the webview, which owns the window setup for each mode.
/// Mobile: one full-screen webview, no tray, no updater, no autostart.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // DESKFISCH_STRESS=1: load the stocked demo tank in stress mode (uncapped
            // frame rate, 30x sim, never saved) so an endurance run needs minutes, not hours.
            if std::env::var_os("DESKFISCH_STRESS").is_some() {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.eval("if (!location.search.includes('stress')) location.replace(location.pathname + '?scene=stocked&stress=1');");
                }
            }
            let show = MenuItem::with_id(app, "show", "Show tank", true, None::<&str>)?;
            let window = MenuItem::with_id(app, "mode:window", "Window mode", true, None::<&str>)?;
            let pet = MenuItem::with_id(app, "mode:pet", "Pet mode", true, None::<&str>)?;
            let full = MenuItem::with_id(app, "mode:fullscreen", "Fullscreen", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&show, &PredefinedMenuItem::separator(app)?, &window, &pet, &full, &PredefinedMenuItem::separator(app)?, &quit],
            )?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main(app),
                    "quit" => app.exit(0),
                    id if id.starts_with("mode:") => {
                        show_main(app);
                        let _ = app.emit("mode", &id["mode:".len()..]);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        });

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(desktop)]
fn show_main(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}
