import { Clock } from 'lucide-react';

export default function LastUpdateBadge({ lastUpdate, onRefresh }) {
  let formattedTime = '';
  const isOffline = String(lastUpdate || '').includes('OFFLINE');
  const cleanDateStr = String(lastUpdate || '').replace(' | OFFLINE', '').trim();
  
  if (!cleanDateStr || cleanDateStr === 'null' || cleanDateStr === 'undefined') {
    formattedTime = '';
  } else {
    const parsedDate = new Date(cleanDateStr);
    let timeExtracted = '';
    if (!isNaN(parsedDate)) {
      timeExtracted = parsedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      const timeMatch = cleanDateStr.match(/\d{2}:\d{2}/);
      timeExtracted = timeMatch ? timeMatch[0] : '';
    }
    
    if (timeExtracted) {
      formattedTime = isOffline ? `às ${timeExtracted} ⚠️ (Backup Offline)` : `às ${timeExtracted}`;
    }
  }

  if (!formattedTime) return null;

  return (
    <div 
      onClick={onRefresh}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', 
        color: 'hsl(var(--muted-foreground))', backgroundColor: 'hsl(var(--card))', 
        padding: '6px 12px', borderRadius: '20px', border: '1px solid hsl(var(--border))',
        cursor: onRefresh ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        userSelect: 'none'
      }}
      title={onRefresh ? "Clique para forçar a atualização dos dados do Google Sheets" : ""}
      onMouseOver={(e) => onRefresh && (e.currentTarget.style.backgroundColor = 'hsl(var(--muted))')}
      onMouseOut={(e) => onRefresh && (e.currentTarget.style.backgroundColor = 'hsl(var(--card))')}
    >
      <Clock size={14} /> Dados atualizados {formattedTime}
      {onRefresh && <span style={{ marginLeft: '4px', textDecoration: 'underline' }}>(Forçar)</span>}
    </div>
  );
}

