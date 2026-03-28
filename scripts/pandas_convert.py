#!/usr/bin/env python3
"""Standalone data format converter using Pandas.
Called by Simurgh Forge Rust backend.
Usage: python3 pandas_convert.py <input_path> <output_path>
"""

import sys
import os
import pandas as pd


def read_data(input_path: str) -> pd.DataFrame:
    ext = os.path.splitext(input_path)[1].lower()
    match ext:
        case ".csv":
            return pd.read_csv(input_path)
        case ".tsv":
            return pd.read_csv(input_path, sep="\t")
        case ".xlsx":
            return pd.read_excel(input_path)
        case ".json":
            return pd.read_json(input_path)
        case ".parquet":
            return pd.read_parquet(input_path)
        case ".sqlite" | ".db":
            import sqlite3
            conn = sqlite3.connect(input_path)
            # Get the first table name
            tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table'", conn)
            if tables.empty:
                raise ValueError("No tables found in SQLite database")
            table_name = tables.iloc[0]['name']
            df = pd.read_sql(f"SELECT * FROM [{table_name}]", conn)
            conn.close()
            return df
        case _:
            raise ValueError(f"Unsupported input format: {ext}")


def write_data(df: pd.DataFrame, output_path: str) -> None:
    ext = os.path.splitext(output_path)[1].lower()
    match ext:
        case ".csv":
            df.to_csv(output_path, index=False)
        case ".tsv":
            df.to_csv(output_path, sep="\t", index=False)
        case ".xlsx":
            df.to_excel(output_path, index=False)
        case ".json":
            df.to_json(output_path, orient="records", indent=2)
        case ".parquet":
            df.to_parquet(output_path, index=False)
        case ".sqlite" | ".db":
            import sqlite3
            conn = sqlite3.connect(output_path)
            df.to_sql("data", conn, index=False, if_exists="replace")
            conn.close()
        case _:
            raise ValueError(f"Unsupported output format: {ext}")


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    try:
        df = read_data(input_path)
        write_data(df, output_path)
        print(f"OK: Converted {input_path} -> {output_path}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
