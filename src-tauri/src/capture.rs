//! Screen capture of the desktop behind the tank window, for the optional
//! "refract the desktop" effect. Returns RGBA pixels scaled to the requested
//! size. Only Windows and macOS can exclude our own window from the capture;
//! elsewhere the command reports itself unsupported.

use tauri::ipc::Response;

/// Screen rectangle (physical pixels) and the output size to scale to.
#[tauri::command]
pub fn capture_behind(
    window: tauri::Window,
    x: i32,
    y: i32,
    w: u32,
    h: u32,
    out_w: u32,
    out_h: u32,
) -> Result<Response, String> {
    let rgba = platform::capture(&window, x, y, w, h, out_w, out_h)?;
    Ok(Response::new(rgba))
}

/// Nearest-neighbour scale of tightly packed RGBA rows.
#[allow(dead_code)]
fn scale_rgba(src: &[u8], sw: u32, sh: u32, stride: usize, dw: u32, dh: u32) -> Vec<u8> {
    let mut out = vec![0u8; (dw * dh * 4) as usize];
    for y in 0..dh {
        let sy = (y as u64 * sh as u64 / dh as u64) as usize;
        for x in 0..dw {
            let sx = (x as u64 * sw as u64 / dw as u64) as usize;
            let s = sy * stride + sx * 4;
            let d = ((y * dw + x) * 4) as usize;
            out[d..d + 4].copy_from_slice(&src[s..s + 4]);
        }
    }
    out
}

#[cfg(windows)]
mod platform {
    use super::scale_rgba;
    use windows_sys::Win32::UI::WindowsAndMessaging::{SetWindowDisplayAffinity, WDA_EXCLUDEFROMCAPTURE};

    pub fn capture(window: &tauri::Window, x: i32, y: i32, w: u32, h: u32, out_w: u32, out_h: u32) -> Result<Vec<u8>, String> {
        // Keep our own window out of screen captures so the tank does not see itself.
        if let Ok(hwnd) = window.hwnd() {
            unsafe {
                SetWindowDisplayAffinity(hwnd.0 as _, WDA_EXCLUDEFROMCAPTURE);
            }
        }
        let monitor = xcap::Monitor::from_point(x, y).map_err(|e| e.to_string())?;
        let mx = monitor.x().map_err(|e| e.to_string())?;
        let my = monitor.y().map_err(|e| e.to_string())?;
        let img = monitor
            .capture_region((x - mx).max(0) as u32, (y - my).max(0) as u32, w, h)
            .map_err(|e| e.to_string())?;
        let (sw, sh) = (img.width(), img.height());
        Ok(scale_rgba(img.as_raw(), sw, sh, (sw * 4) as usize, out_w, out_h))
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use super::scale_rgba;
    use core_graphics::geometry::{CGPoint, CGRect, CGSize};
    use core_graphics::window::{create_image, kCGWindowImageDefault, kCGWindowListOptionOnScreenBelowWindow};
    use objc2::msg_send;
    use objc2::runtime::AnyObject;

    pub fn capture(window: &tauri::Window, x: i32, y: i32, w: u32, h: u32, out_w: u32, out_h: u32) -> Result<Vec<u8>, String> {
        let ns_window = window.ns_window().map_err(|e| e.to_string())? as *mut AnyObject;
        let number: i64 = unsafe { msg_send![ns_window, windowNumber] };
        let scale: f64 = unsafe { msg_send![ns_window, backingScaleFactor] };
        // CG works in points; we were given physical pixels.
        let rect = CGRect::new(
            &CGPoint::new(x as f64 / scale, y as f64 / scale),
            &CGSize::new(w as f64 / scale, h as f64 / scale),
        );
        let image = create_image(rect, kCGWindowListOptionOnScreenBelowWindow, number as u32, kCGWindowImageDefault)
            .ok_or("screen capture failed (is Screen Recording allowed for Deskfisch?)")?;
        let (sw, sh, stride) = (image.width() as u32, image.height() as u32, image.bytes_per_row());
        let data = image.data();
        let bytes = data.bytes();
        // CoreGraphics hands back BGRA; swap to RGBA while copying.
        let mut rgba = vec![0u8; (sw * sh * 4) as usize];
        for yy in 0..sh as usize {
            for xx in 0..sw as usize {
                let s = yy * stride + xx * 4;
                let d = (yy * sw as usize + xx) * 4;
                rgba[d] = bytes[s + 2];
                rgba[d + 1] = bytes[s + 1];
                rgba[d + 2] = bytes[s];
                rgba[d + 3] = 255;
            }
        }
        Ok(scale_rgba(&rgba, sw, sh, (sw * 4) as usize, out_w, out_h))
    }
}

#[cfg(not(any(windows, target_os = "macos")))]
mod platform {
    pub fn capture(_window: &tauri::Window, _x: i32, _y: i32, _w: u32, _h: u32, _out_w: u32, _out_h: u32) -> Result<Vec<u8>, String> {
        Err("unsupported".into())
    }
}
