import json

with open('.backup-dre-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

fatRealSum = 0.0
fatPadraoSum = 0.0
descontoApi = 0.0
descontoReal = 0.0

def parse_br_num(s):
    if not s: return 0.0
    try:
        limpo = str(s).replace('R$', '').replace('.', '').replace(',', '.').strip()
        return float(limpo)
    except:
        return 0.0

for row in data:
    marca = row.get('MARCA', '') or 'Desconhecida'
    if marca.upper() == 'METZELER':
        qtde = float(row.get('QTDE VENDA', 0) or 0)
        precoPadrao = parse_br_num(row.get('PRECO PADRAO', row.get('PREÇO PADRAO', 0)))
        
        fatReal = parse_br_num(row.get(' FATURAMENTO ', row.get('FATURAMENTO', 0)))
        precoMedioRaw = parse_br_num(row.get('PRECO MEDIO', row.get('PREÇO MEDIO', 0)))
        
        if fatReal == 0:
            fatReal = qtde * precoMedioRaw
            
        fatPadrao = qtde * precoPadrao
        
        precoMedio = precoMedioRaw
        if precoMedio == 0 and qtde > 0:
            precoMedio = fatReal / qtde
            
        # Api calculation
        descApi = (precoPadrao - precoMedio) * qtde
        
        # Real calculation
        descReal = fatPadrao - fatReal
        
        fatRealSum += fatReal
        fatPadraoSum += fatPadrao
        descontoApi += descApi
        descontoReal += descReal

print(f"METZELER TOTALS:")
print(f"Fat Real: {fatRealSum:.2f}")
print(f"Fat Padrao: {fatPadraoSum:.2f}")
print(f"Desconto API (Preco Medio): {descontoApi:.2f}")
print(f"Desconto REAL (Fat Padrao - Fat Real): {descontoReal:.2f}")
