// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // GNOME on Wayland ignores always-on-top for native GTK windows, so the pet
    // mode could not stay pinned. XWayland honours it, so always use the X11
    // backend in a Wayland session (desktop environments commonly export
    // GDK_BACKEND=wayland globally, so an existing value is not a user choice).
    #[cfg(target_os = "linux")]
    if std::env::var_os("WAYLAND_DISPLAY").is_some() {
        std::env::set_var("GDK_BACKEND", "x11");
    }
    fisch_lib::run()
}
