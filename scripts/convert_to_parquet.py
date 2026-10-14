import json
import os
import time
import duckdb
import pandas as pd

def convert_all():
    base_dir = os.path.join(os.getcwd(), 'data', 'supermarket')
    files = [
        'daily_sales.json',
        'products_monthly.json',
        'clients_daily.json'
    ]

    print("Iniciando conversao para Apache Parquet...")
    con = duckdb.connect()

    for fname in files:
        fpath = os.path.join(base_dir, fname)
        if not os.path.exists(fpath):
            print(f"Arquivo nao encontrado: {fpath}")
            continue

        out_name = fname.replace('.json', '.parquet')
        out_path = os.path.join(base_dir, out_name)

        orig_size = os.path.getsize(fpath) / (1024 * 1024)
        print(f"\nConvertendo {fname} ({orig_size:.2f} MB)...")
        start = time.time()

        # Usando DuckDB para ler o JSON e gravar em Parquet diretamente em C/C++
        con.execute(f"""
            COPY (SELECT * FROM read_json_auto('{fpath.replace('\\', '/')}'))
            TO '{out_path.replace('\\', '/')}' (FORMAT PARQUET, COMPRESSION 'ZSTD');
        """)

        duration = time.time() - start
        new_size = os.path.getsize(out_path) / (1024 * 1024)
        economy = (1 - (new_size / orig_size)) * 100

        print(f"-> Concluido em {duration:.2f}s!")
        print(f"-> Tamanho original: {orig_size:.2f} MB | Novo tamanho Parquet: {new_size:.2f} MB (Reducao de {economy:.1f}%)")

    # Teste de consulta rapida no DuckDB
    print("\n--- Testando velocidade de consulta no DuckDB com Parquet ---")
    parquet_prod = os.path.join(base_dir, 'products_monthly.parquet').replace('\\', '/')
    start_query = time.time()
    res = con.execute(f"""
        SELECT depto, SUM(faturamento) as total_fat, COUNT(*) as qtd_linhas
        FROM '{parquet_prod}'
        GROUP BY depto
        ORDER BY total_fat DESC
        LIMIT 5;
    """).fetchall()
    query_time = (time.time() - start_query) * 1000
    print(f"Consulta analitica sobre quase 1 milhao de linhas concluida em {query_time:.1f} ms!")
    for row in res:
        print(" ", row)

if __name__ == '__main__':
    convert_all()
