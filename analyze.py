import json

with open('.backup-dre-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

fatRealSum = 0.0
fatPadraoSum = 0.0
descontoCalculado = 0.0

linhasEstranhas = []

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
            
        descontoPositivoParaView = (precoPadrao - precoMedio) * qtde
        
        fatRealSum += fatReal
        fatPadraoSum += fatPadrao
        descontoCalculado += descontoPositivoParaView
        
        if qtde < 0 or fatReal < 0 or precoPadrao < 0 or descontoPositivoParaView < 0 or fatReal > fatPadrao:
            linhasEstranhas.append({
                'qtde': qtde,
                'precoPadrao': precoPadrao,
                'precoMedio': precoMedio,
                'fatReal': fatReal,
                'fatPadrao': fatPadrao,
                'desconto': descontoPositivoParaView,
                'data': row.get('DATA VENDA', ''),
                'produto': row.get('PRODUTO', ''),
                'numNota': row.get('Nº NOTA', '')
            })

print(f"METZELER TOTALS:")
print(f"Fat Real: {fatRealSum:.2f}")
print(f"Fat Padrao: {fatPadraoSum:.2f}")
print(f"Desconto Calculado: {descontoCalculado:.2f}")
print(f"Linhas estranhas (Devolucoes ou Acrescimos): {len(linhasEstranhas)}")

# Sort by most impact on discount (most negative discount)
linhasEstranhas.sort(key=lambda x: x['desconto'])

if len(linhasEstranhas) > 0:
    print("Exemplo de anomalias com maior acréscimo:")
    for l in linhasEstranhas[:10]:
        print(l)
