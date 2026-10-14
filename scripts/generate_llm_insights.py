import json
import os
import time
from datetime import datetime

ANALYTICS_PATH = os.path.join('data', 'supermarket', 'advanced_analytics.json')
OUTPUT_PATH = os.path.join('data', 'supermarket', 'executive_summary.json')

def generate_llm_prompt(analytics_data):
    """
    Constrói o prompt estruturado para enviar ao LLM, condensando a matemática
    em instruções claras para geração de linguagem natural.
    """
    forecast = analytics_data.get('forecast', {})
    next_7 = forecast.get('next_7_days', [])
    if next_7:
        projecao = next_7[-1]['faturamento_predito']
    else:
        projecao = 0
        
    prompt = f"""
    Atue como um analista executivo de varejo.
    Baseado nos seguintes dados processados pelo nosso motor matemático:
    - O modelo ARIMA projetou um faturamento de R$ {projecao:,.2f} no final da próxima semana.
    - O número de pares altamente correlacionados (r > 0.8) entre departamentos é alto.
    
    Escreva um 'Diagnóstico Executivo' resumido de 1 parágrafo abordando a saúde da projeção,
    os gargalos potenciais de margem (se houver), e a sinergia entre os departamentos líderes.
    O tom deve ser direto, corporativo e preditivo.
    """
    return prompt

def mock_llm_api_call(prompt):
    """
    Simula a chamada a uma API de LLM (OpenAI/Anthropic) para não onerar
    tokens e manter a arquitetura pronta para plugar a chave real.
    """
    print("Enviando payload para a API do LLM...")
    time.sleep(2) # Simulando latência de rede
    
    # Resposta gerada (mockada baseada no prompt matemático)
    response = (
        "O motor preditivo sinaliza forte sustentação da receita para os próximos 7 dias, "
        "ancorada pela alta sinergia entre Açougue e Bebidas (r = 0.89). No entanto, "
        "alertamos para uma compressão de margem no setor de Frios, cujo Z-Score cruzou o "
        "limiar negativo nas últimas 48h. A recomendação tática é alavancar promoções cruzadas "
        "nos quadrantes líderes para compensar a deflação na margem bruta global."
    )
    return response

def run_daily_cron():
    print(f"[{datetime.now()}] Iniciando Job Gerador de Insights (NLG)...")
    
    if not os.path.exists(ANALYTICS_PATH):
        print("Erro: Arquivo advanced_analytics.json não encontrado. Execute a Fase 1 primeiro.")
        return

    with open(ANALYTICS_PATH, 'r', encoding='utf-8') as f:
        analytics = json.load(f)
        
    prompt = generate_llm_prompt(analytics)
    llm_response = mock_llm_api_call(prompt)
    
    # Estrutura do payload para o Frontend consumir (sem chamadas de API repetidas no client)
    summary_payload = {
        "generated_at": datetime.now().isoformat(),
        "model": "gpt-4-turbo-preview (simulated)",
        "diagnostico_executivo": llm_response,
        "tags_estrategicas": ["Risco de Margem: Frios", "Sinergia Alta", "Projeção Estável"]
    }
    
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(summary_payload, f, ensure_ascii=False, indent=2)
        
    print(f"[{datetime.now()}] Diagnóstico Executivo salvo com sucesso em {OUTPUT_PATH}")

if __name__ == '__main__':
    run_daily_cron()
