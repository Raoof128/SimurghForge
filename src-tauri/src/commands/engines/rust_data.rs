use crate::commands::convert::{emit_progress, ConversionOptions};
use std::fs;
use std::path::Path;
use tauri::AppHandle;

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    let input_ext = input_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let output_ext = output_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

    emit_progress(app_handle, file_id, "converting", 10, None, None);

    // Read input file
    let content = fs::read_to_string(input_path).map_err(|e| format!("Cannot read file: {}", e))?;

    // Parse input into a serde_json::Value as a universal intermediate representation
    let value: serde_json::Value = match input_ext.as_str() {
        "json" => serde_json::from_str(&content).map_err(|e| format!("Invalid JSON: {}", e))?,
        "yaml" | "yml" => {
            serde_yaml::from_str(&content).map_err(|e| format!("Invalid YAML: {}", e))?
        }
        "toml" => {
            // Parse TOML via the toml crate's serde support, then convert to serde_json::Value
            let toml_val: toml::Value =
                toml::from_str(&content).map_err(|e| format!("Invalid TOML: {}", e))?;
            serde_json::to_value(&toml_val).map_err(|e| format!("TOML to JSON: {}", e))?
        }
        "xml" => {
            // Use quick-xml serde deserialization
            quick_xml::de::from_str(&content).map_err(|e| format!("Invalid XML: {}", e))?
        }
        "csv" | "tsv" => {
            // Parse CSV/TSV into an array of objects
            let delimiter = if input_ext == "tsv" {
                b'\t'
            } else {
                options
                    .data
                    .as_ref()
                    .and_then(|d| d.delimiter.as_ref())
                    .and_then(|d| d.bytes().next())
                    .unwrap_or(b',')
            };
            csv_to_json(&content, delimiter)?
        }
        // Formats that need Pandas (binary / complex)
        "xlsx" | "parquet" | "sqlite" => {
            return Err("Use Pandas engine for this input format".into());
        }
        _ => return Err(format!("Unsupported input format: {}", input_ext)),
    };

    emit_progress(app_handle, file_id, "converting", 50, None, None);

    let pretty = options.data.as_ref().and_then(|d| d.pretty_print).unwrap_or(true);

    // Ensure parent directory exists
    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Cannot create output dir: {}", e))?;
    }

    // Serialize to output format
    let output_str = match output_ext.as_str() {
        "json" => {
            if pretty {
                serde_json::to_string_pretty(&value).map_err(|e| e.to_string())?
            } else {
                serde_json::to_string(&value).map_err(|e| e.to_string())?
            }
        }
        "yaml" | "yml" => serde_yaml::to_string(&value).map_err(|e| e.to_string())?,
        "toml" => json_to_toml(&value)?,
        "xml" => {
            // quick-xml serialization wraps in a root element
            quick_xml::se::to_string(&value).map_err(|e| format!("XML serialize: {}", e))?
        }
        "csv" | "tsv" => {
            let delimiter = if output_ext == "tsv" {
                b'\t'
            } else {
                options
                    .data
                    .as_ref()
                    .and_then(|d| d.delimiter.as_ref())
                    .and_then(|d| d.bytes().next())
                    .unwrap_or(b',')
            };
            json_to_csv(&value, delimiter)?
        }
        // Formats that need Pandas (binary / complex)
        "xlsx" | "parquet" | "sqlite" => {
            return Err("Use Pandas engine for this output format".into());
        }
        _ => return Err(format!("Unsupported output format: {}", output_ext)),
    };

    emit_progress(app_handle, file_id, "converting", 90, None, None);

    fs::write(output_path, output_str).map_err(|e| format!("Write error: {}", e))?;

    Ok(())
}

/// Convert a serde_json::Value to a TOML string.
/// TOML requires a table/object at the root level.
fn json_to_toml(value: &serde_json::Value) -> Result<String, String> {
    match value {
        serde_json::Value::Object(_) => {
            toml::to_string_pretty(value).map_err(|e| format!("TOML serialize: {}", e))
        }
        _ => Err("TOML requires an object/table at the root level".into()),
    }
}

/// Convert a serde_json::Value (expected array of objects) to CSV/TSV.
fn json_to_csv(value: &serde_json::Value, delimiter: u8) -> Result<String, String> {
    let arr = value.as_array().ok_or("CSV output requires a JSON array")?;
    if arr.is_empty() {
        return Ok(String::new());
    }

    // Collect all unique headers from all objects, preserving insertion order
    let mut headers: Vec<String> = Vec::new();
    for item in arr {
        if let Some(obj) = item.as_object() {
            for key in obj.keys() {
                if !headers.contains(key) {
                    headers.push(key.clone());
                }
            }
        }
    }

    if headers.is_empty() {
        return Err("CSV requires array of objects".into());
    }

    let mut wtr = csv::WriterBuilder::new().delimiter(delimiter).from_writer(Vec::new());

    // Write headers
    wtr.write_record(&headers).map_err(|e| e.to_string())?;

    // Write rows
    for item in arr {
        if let Some(obj) = item.as_object() {
            let row: Vec<String> = headers
                .iter()
                .map(|h| {
                    obj.get(h)
                        .map(|v| match v {
                            serde_json::Value::String(s) => s.clone(),
                            serde_json::Value::Null => String::new(),
                            other => other.to_string(),
                        })
                        .unwrap_or_default()
                })
                .collect();
            wtr.write_record(&row).map_err(|e| e.to_string())?;
        }
    }

    let bytes = wtr.into_inner().map_err(|e| e.to_string())?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

/// Parse CSV/TSV content into a JSON array of objects.
fn csv_to_json(content: &str, delimiter: u8) -> Result<serde_json::Value, String> {
    let mut rdr = csv::ReaderBuilder::new().delimiter(delimiter).from_reader(content.as_bytes());

    let headers: Vec<String> = rdr
        .headers()
        .map_err(|e| format!("CSV header error: {}", e))?
        .iter()
        .map(|h| h.to_string())
        .collect();

    let mut rows = Vec::new();
    for result in rdr.records() {
        let record = result.map_err(|e| format!("CSV record error: {}", e))?;
        let mut obj = serde_json::Map::new();
        for (i, field) in record.iter().enumerate() {
            if let Some(header) = headers.get(i) {
                // Try to parse as number or boolean, otherwise keep as string
                let value = if let Ok(n) = field.parse::<i64>() {
                    serde_json::Value::Number(n.into())
                } else if let Ok(n) = field.parse::<f64>() {
                    serde_json::json!(n)
                } else if field.eq_ignore_ascii_case("true") {
                    serde_json::Value::Bool(true)
                } else if field.eq_ignore_ascii_case("false") {
                    serde_json::Value::Bool(false)
                } else if field.is_empty() {
                    serde_json::Value::Null
                } else {
                    serde_json::Value::String(field.to_string())
                };
                obj.insert(header.clone(), value);
            }
        }
        rows.push(serde_json::Value::Object(obj));
    }

    Ok(serde_json::Value::Array(rows))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_json_to_toml_object() {
        let val = serde_json::json!({"name": "test", "version": "1.0"});
        let result = json_to_toml(&val);
        assert!(result.is_ok());
        let toml_str = result.unwrap();
        assert!(toml_str.contains("name"));
        assert!(toml_str.contains("test"));
    }

    #[test]
    fn test_json_to_toml_non_object() {
        let val = serde_json::json!([1, 2, 3]);
        let result = json_to_toml(&val);
        assert!(result.is_err());
    }

    #[test]
    fn test_json_to_csv_basic() {
        let val = serde_json::json!([
            {"name": "Alice", "age": 30},
            {"name": "Bob", "age": 25}
        ]);
        let result = json_to_csv(&val, b',').unwrap();
        assert!(result.contains("name"));
        assert!(result.contains("Alice"));
        assert!(result.contains("Bob"));
    }

    #[test]
    fn test_json_to_csv_empty_array() {
        let val = serde_json::json!([]);
        let result = json_to_csv(&val, b',').unwrap();
        assert_eq!(result, "");
    }

    #[test]
    fn test_json_to_csv_non_array() {
        let val = serde_json::json!({"key": "value"});
        let result = json_to_csv(&val, b',');
        assert!(result.is_err());
    }

    #[test]
    fn test_csv_to_json() {
        let csv_content = "name,age\nAlice,30\nBob,25\n";
        let result = csv_to_json(csv_content, b',').unwrap();
        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 2);
        assert_eq!(arr[0]["name"], "Alice");
        assert_eq!(arr[0]["age"], 30);
    }

    #[test]
    fn test_csv_to_json_tsv() {
        let tsv_content = "name\tage\nAlice\t30\n";
        let result = csv_to_json(tsv_content, b'\t').unwrap();
        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 1);
        assert_eq!(arr[0]["name"], "Alice");
    }
}
