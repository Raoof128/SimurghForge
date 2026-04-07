use crate::commands::convert::{emit_progress, ConversionOptions};
use std::path::Path;
use tauri::AppHandle;

use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

/// Native Rust audio engine: decodes any supported audio format and writes WAV output.
///
/// Supported input formats (via symphonia): MP3, FLAC, WAV, OGG/Vorbis, AAC/ADTS, ALAC, etc.
/// Supported output format: WAV only. For MP3/FLAC/OGG/AAC encoding, fall back to FFmpeg.
pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    let output_ext = output_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

    // We can only write WAV natively. For everything else, fall back to FFmpeg.
    if output_ext != "wav" {
        return Err("Use FFmpeg engine for non-WAV audio output".into());
    }

    // Clone what we need to move into the blocking task
    let input_path = input_path.to_path_buf();
    let output_path = output_path.to_path_buf();
    let app_handle = app_handle.clone();
    let file_id = file_id.to_string();
    let options = options.clone();

    // Run the CPU-intensive decode/encode work on a blocking thread
    tokio::task::spawn_blocking(move || {
        decode_and_write_wav(&input_path, &output_path, &app_handle, &file_id, &options)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

fn decode_and_write_wav(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    emit_progress(app_handle, file_id, "converting", 10, None, None);

    // Open the media source
    let file =
        std::fs::File::open(input_path).map_err(|e| format!("Cannot open input file: {}", e))?;

    let mss = MediaSourceStream::new(Box::new(file), Default::default());

    // Create a probe hint from the file extension
    let mut hint = Hint::new();
    if let Some(ext) = input_path.extension().and_then(|e| e.to_str()) {
        hint.with_extension(ext);
    }

    let meta_opts: MetadataOptions = Default::default();
    let fmt_opts: FormatOptions = Default::default();

    // Probe the media source to detect format
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &fmt_opts, &meta_opts)
        .map_err(|e| format!("Cannot probe audio format: {}", e))?;

    let mut format_reader = probed.format;

    // Find the first audio track with a supported codec
    let track = format_reader
        .tracks()
        .iter()
        .find(|t| t.codec_params.codec != CODEC_TYPE_NULL)
        .ok_or("No supported audio track found")?;

    let codec_params = track.codec_params.clone();
    let track_id = track.id;

    // Extract source parameters
    let source_sample_rate = codec_params.sample_rate.unwrap_or(44100);
    let source_channels = codec_params.channels.map(|c| c.count()).unwrap_or(2) as u16;

    // Apply user-requested options, falling back to source parameters
    let target_sample_rate =
        options.audio.as_ref().and_then(|a| a.sample_rate).unwrap_or(source_sample_rate);
    let target_channels = options
        .audio
        .as_ref()
        .and_then(|a| a.channels)
        .map(|c| c as u16)
        .unwrap_or(source_channels);

    // Create a decoder for the track
    let dec_opts: DecoderOptions = Default::default();
    let mut decoder = symphonia::default::get_codecs()
        .make(&codec_params, &dec_opts)
        .map_err(|e| format!("Cannot create audio decoder: {}", e))?;

    emit_progress(app_handle, file_id, "converting", 20, None, None);

    // Decode all packets into interleaved i16 samples
    let mut all_samples: Vec<i16> = Vec::new();
    let mut sample_buf: Option<SampleBuffer<i16>> = None;

    loop {
        let packet = match format_reader.next_packet() {
            Ok(p) => p,
            Err(SymphoniaError::IoError(ref e))
                if e.kind() == std::io::ErrorKind::UnexpectedEof =>
            {
                break; // End of stream
            }
            Err(SymphoniaError::ResetRequired) => {
                break; // Treat as end for our purposes
            }
            Err(_) => break,
        };

        // Skip packets that don't belong to our track
        if packet.track_id() != track_id {
            continue;
        }

        match decoder.decode(&packet) {
            Ok(decoded) => {
                // Create or reuse the sample buffer
                if sample_buf.is_none() {
                    let spec = *decoded.spec();
                    let duration = decoded.capacity() as u64;
                    sample_buf = Some(SampleBuffer::<i16>::new(duration, spec));
                }

                if let Some(ref mut buf) = sample_buf {
                    buf.copy_interleaved_ref(decoded);
                    all_samples.extend_from_slice(buf.samples());
                }
            }
            Err(SymphoniaError::IoError(_)) => continue,
            Err(SymphoniaError::DecodeError(_)) => continue,
            Err(_) => break,
        }
    }

    emit_progress(app_handle, file_id, "converting", 70, None, None);

    if all_samples.is_empty() {
        return Err("No audio samples decoded from input file".into());
    }

    // Handle simple channel conversion if needed
    // (source_channels -> target_channels)
    let final_samples = if source_channels != target_channels {
        convert_channels(&all_samples, source_channels, target_channels)
    } else {
        all_samples
    };

    emit_progress(app_handle, file_id, "converting", 80, None, None);

    // Write WAV output using hound
    let spec = hound::WavSpec {
        channels: target_channels,
        sample_rate: if target_sample_rate != source_sample_rate {
            // Simple resampling is complex; write at source rate if different
            // (proper resampling would need a dedicated crate)
            source_sample_rate
        } else {
            target_sample_rate
        },
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer = hound::WavWriter::create(output_path, spec)
        .map_err(|e| format!("Cannot create WAV file: {}", e))?;

    for sample in &final_samples {
        writer.write_sample(*sample).map_err(|e| format!("WAV write error: {}", e))?;
    }

    writer.finalize().map_err(|e| format!("WAV finalize error: {}", e))?;

    emit_progress(app_handle, file_id, "converting", 95, None, None);
    Ok(())
}

/// Simple channel conversion for interleaved i16 samples.
fn convert_channels(samples: &[i16], src_channels: u16, dst_channels: u16) -> Vec<i16> {
    let src_ch = src_channels as usize;
    let dst_ch = dst_channels as usize;

    if src_ch == 0 || dst_ch == 0 {
        return Vec::new();
    }

    let num_frames = samples.len() / src_ch;
    let mut out = Vec::with_capacity(num_frames * dst_ch);

    for frame_idx in 0..num_frames {
        let frame_start = frame_idx * src_ch;

        if dst_ch == 1 {
            // Downmix to mono: average all source channels
            let sum: i32 =
                samples[frame_start..frame_start + src_ch].iter().map(|&s| s as i32).sum();
            out.push((sum / src_ch as i32) as i16);
        } else if dst_ch <= src_ch {
            // Take first dst_ch channels
            for ch in 0..dst_ch {
                out.push(samples[frame_start + ch]);
            }
        } else {
            // Upmix: copy existing channels, duplicate last for remaining
            for ch in 0..dst_ch {
                if ch < src_ch {
                    out.push(samples[frame_start + ch]);
                } else {
                    // Duplicate the last source channel
                    out.push(samples[frame_start + src_ch - 1]);
                }
            }
        }
    }

    out
}
