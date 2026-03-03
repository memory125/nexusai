// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|_app| {
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_version,
            open_external_link,
            fetch_ollama
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn fetch_ollama(url: String, method: String, body: Option<String>) -> Result<String, String> {
    println!("[Ollama] Request: {} {}", method, url);
    
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;
    
    let request = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        _ => return Err("Unsupported method".to_string()),
    };
    
    let request = request
        .header("User-Agent", "Mozilla/5.0")
        .header("Accept", "application/json");
    
    let request = if let Some(b) = body {
        request
            .header("Content-Type", "application/json")
            .body(b)
    } else {
        request
    };
    
    let response = request.send().await.map_err(|e| {
        println!("[Ollama] Connection error: {}", e);
        e.to_string()
    })?;
    
    let status = response.status();
    println!("[Ollama] Response status: {}", status);
    
    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        println!("[Ollama] Response body: {}", text);
        return Err(format!("HTTP {} - {}", status, text));
    }
    
    let text = response.text().await.map_err(|e| e.to_string())?;
    println!("[Ollama] Response: {}", &text[..text.len().min(200)]);
    Ok(text)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn open_external_link(url: &str) -> Result<(), String> {
    match open::that(url) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open link: {}", e)),
    }
}
