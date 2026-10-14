const fs = require('fs');

const data = JSON.parse(fs.readFileSync('.backup-dre-data.json', 'utf8'));

let fatRealSum = 0;
let fatPadraoSum = 0;
let descontoCalculado = 0;

let linhasEstranhas = [];

const parseBrNum = (str) => {
  if (!str) return 0;
  let limpo = str.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(limpo) || 0;
};

data.forEach(row => {
  const marca = row['MARCA'] || 'Desconhecida';
  if (marca.toUpperCase() === 'METZELER') {
    const qtde = parseFloat(row['QTDE VENDA'] || '0');
    const precoPadrao = parseBrNum(row['PRECO PADRAO'] || row['PREÇO PADRAO']);
    
    let fatReal = parseBrNum(row[' FATURAMENTO '] || row['FATURAMENTO']);
    if (fatReal === 0) fatReal = qtde * parseBrNum(row['PRECO MEDIO'] || row['PREÇO MEDIO']); 
    
    let fatPadrao = qtde * precoPadrao;
    
    let precoMedio = parseBrNum(row['PRECO MEDIO'] || row['PREÇO MEDIO']);
    if (precoMedio === 0 && qtde > 0) precoMedio = fatReal / qtde;
    
    const descontoPositivoParaView = (precoPadrao - precoMedio) * qtde; 

    fatRealSum += fatReal;
    fatPadraoSum += fatPadrao;
    descontoCalculado += descontoPositivoParaView;
    
    // Log things that might cause anomalies
    if (qtde < 0 || fatReal < 0 || precoPadrao < 0 || descontoPositivoParaView < 0 || fatReal > fatPadrao) {
      linhasEstranhas.push({
        qtde, precoPadrao, precoMedio, fatReal, fatPadrao, desconto: descontoPositivoParaView, data: row['DATA VENDA'], produto: row['PRODUTO'], numNota: row['Nº NOTA']
      });
    }
  }
});

console.log(`METZELER TOTALS:`);
console.log(`Fat Real: ${fatRealSum}`);
console.log(`Fat Padrao: ${fatPadraoSum}`);
console.log(`Desconto Calculado: ${descontoCalculado}`);
console.log(`Linhas com desconto negativo: ${linhasEstranhas.length}`);
if (linhasEstranhas.length > 0) {
  console.log('Exemplo de anomalias (Fat Real > Padrao ou Devs):');
  console.table(linhasEstranhas.slice(0, 5));
}
