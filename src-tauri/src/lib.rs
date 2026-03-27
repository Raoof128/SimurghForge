mod commands;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::convert::convert_batch,
            commands::convert::get_default_output_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
