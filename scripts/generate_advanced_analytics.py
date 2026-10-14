import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from statsmodels.tsa.arima.model import ARIMA
except ImportError:
    ARIMA = None

DATA_PATH = os.path.join('data', 'supermarket', 'daily_sales.parquet')
JSON_PATH = os.path.join('data', 'supermarket', 'daily_sales.json')
OUTPUT_PATH = os.path.join('data', 'supermarket', 'advanced_analytics.json')

def run_analytics():
    print("Carregando dados...")
    if os.path.exists(DATA_PATH):
        df = pd.read_parquet(DATA_PATH)
    else:
        df = pd.read_json(JSON_PATH)
        
    df['data'] = pd.to_datetime(df['data'])
    
    # Ordenar por data
    df = df.sort_values('data')
    
    # Última data do dataset
    max_date = df['data'].max()
    print(f"Data máxima no dataset: {max_date.strftime('%Y-%m-%d')}")
    
    # 1. Z-Score por Departamento (Últimos 30 dias para heatmap)
    print("Calculando Z-Scores...")
    last_30_days = df[df['data'] > (max_date - timedelta(days=30))]
    
    # Agrupar por data e depto
    daily_depto = last_30_days.groupby(['data', 'depto'])[['faturamento', 'margem']].sum().reset_index()
    
    # Calcular média e desvio padrão por depto
    stats_depto = daily_depto.groupby('depto')[['faturamento', 'margem']].agg(['mean', 'std']).reset_index()
    stats_depto.columns = ['depto', 'fat_mean', 'fat_std', 'mar_mean', 'mar_std']
    
    # Merge para calcular o Z-Score
    daily_depto = pd.merge(daily_depto, stats_depto, on='depto')
    daily_depto['z_faturamento'] = np.where(daily_depto['fat_std'] > 0, 
                                            (daily_depto['faturamento'] - daily_depto['fat_mean']) / daily_depto['fat_std'], 
                                            0)
    daily_depto['z_margem'] = np.where(daily_depto['mar_std'] > 0, 
                                       (daily_depto['margem'] - daily_depto['mar_mean']) / daily_depto['mar_std'], 
                                       0)
    
    z_scores = []
    for depto in daily_depto['depto'].unique():
        depto_data = daily_depto[daily_depto['depto'] == depto]
        z_scores.append({
            'depto': depto,
            'history': [
                {
                    'data': row['data'].strftime('%Y-%m-%d'),
                    'z_faturamento': round(row['z_faturamento'], 2),
                    'z_margem': round(row['z_margem'], 2)
                } for _, row in depto_data.iterrows()
            ]
        })

    # 2. Quadrantes de Dispersão (Lojas vs Volume x Margem) - Últimos 30 dias
    print("Calculando Linhas Medianas (Quadrantes)...")
    loja_agg = last_30_days.groupby('loja')[['quantidade', 'margem']].sum().reset_index()
    
    # Medianas
    median_volume = loja_agg['quantidade'].median()
    median_margem = loja_agg['margem'].median()
    
    quadrants = {
        'median_volume': float(median_volume),
        'median_margem': float(median_margem),
        'lojas': loja_agg.to_dict('records')
    }
    
    # 3. Matriz de Correlação de Pearson (Sinergia) - Volume entre departamentos (Últimos 90 dias)
    print("Calculando Matriz de Correlação...")
    last_90_days = df[df['data'] > (max_date - timedelta(days=90))]
    pivot_corr = last_90_days.pivot_table(index='data', columns='depto', values='quantidade', aggfunc='sum').fillna(0)
    
    corr_matrix = pivot_corr.corr(method='pearson')
    
    # Formatar para JSON: Lista de dicts { source, target, value }
    links = []
    depto_names = corr_matrix.columns.tolist()
    
    for i in range(len(depto_names)):
        for j in range(i+1, len(depto_names)):
            r_val = corr_matrix.iloc[i, j]
            if pd.notna(r_val):
                links.append({
                    'source': depto_names[i],
                    'target': depto_names[j],
                    'r': round(float(r_val), 3)
                })
                
    # 4. Machine Learning (Forecasting e Médias Móveis)
    print("Calculando Forecasting e Médias Móveis...")
    daily_total = df.groupby('data')['faturamento'].sum().reset_index()
    daily_total = daily_total.set_index('data').asfreq('D', fill_value=0)
    
    # Médias Móveis
    daily_total['ma_3'] = daily_total['faturamento'].rolling(window=3).mean()
    daily_total['ma_7'] = daily_total['faturamento'].rolling(window=7).mean()
    
    forecast_results = []
    
    if ARIMA is not None:
        try:
            # Pegar os últimos 365 dias para treino
            train_data = daily_total['faturamento'].tail(365)
            
            # Ajustar modelo ARIMA simples (p=7, d=1, q=2) para capturar sazonalidade semanal
            model = ARIMA(train_data, order=(7,1,2))
            model_fit = model.fit()
            
            # Prever os próximos 7 dias
            forecast = model_fit.forecast(steps=7)
            
            for i, val in enumerate(forecast):
                target_date = max_date + timedelta(days=i+1)
                forecast_results.append({
                    'data': target_date.strftime('%Y-%m-%d'),
                    'faturamento_predito': round(float(val), 2)
                })
        except Exception as e:
            print(f"Erro no ARIMA: {e}")
            
    # Extrair os últimos 14 dias para o frontend
    recent_history = daily_total.tail(14).reset_index()
    recent_formatted = []
    for _, row in recent_history.iterrows():
        recent_formatted.append({
            'data': row['data'].strftime('%Y-%m-%d'),
            'faturamento': round(float(row['faturamento']), 2),
            'ma_3': round(float(row['ma_3']) if pd.notna(row['ma_3']) else 0, 2),
            'ma_7': round(float(row['ma_7']) if pd.notna(row['ma_7']) else 0, 2)
        })

    # Consolidar tudo
    analytics_payload = {
        'last_update': datetime.now().isoformat(),
        'z_scores': z_scores,
        'quadrants': quadrants,
        'correlation_network': {
            'nodes': [{'id': n} for n in depto_names],
            'links': links
        },
        'forecast': {
            'recent_history': recent_formatted,
            'next_7_days': forecast_results
        }
    }
    
    # Salvar
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(analytics_payload, f, ensure_ascii=False, indent=2)
        
    print(f"Análise avançada salva em {OUTPUT_PATH}")

if __name__ == '__main__':
    run_analytics()
