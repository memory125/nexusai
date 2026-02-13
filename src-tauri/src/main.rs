// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WindowEvent};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 获取主窗口
            let main_window = app.get_window("main").unwrap();
            
            // 设置窗口事件处理
            main_window.on_window_event(|event| {
                match event {
                    WindowEvent::CloseRequested { api, .. } => {
                        // 可以在这里添加关闭前的保存逻辑
                        println!("Window closing...");
                    }
                    _ => {}
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 在这里添加自定义命令
            greet,
            get_app_version,
            open_external_link
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 示例命令：问候
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 获取应用版本
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// 打开外部链接
#[tauri::command]
fn open_external_link(url: &str) -> Result<(), String> {
    match open::that(url) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open link: {}", e))
    }
}
