import { parseISO, differenceInCalendarDays } from 'date-fns';

function norm(str = '') { 
  return (str || '').toString().trim(); 
}

function isCarrossel(arte = '') { 
  return /^\s*Carrossel:\s*/i.test(arte); 
}

function isEstatico(arte = '') { 
  return /^\s*Estático:\s*/i.test(arte) || /^\s*Estatico:\s*/i.test(arte); 
}

function arteHasPrefix(arte = '') { 
  return isCarrossel(arte) || isEstatico(arte); 
}

function classifyType(title = '', arte = '') {
  const t = (title || '').toLowerCase();
  const a = (arte || '').toLowerCase();
  
  if (/\bcampanha|outubro rosa|black friday|ação\b/.test(t) || /campanha/.test(a)) return 'campanha';
  if (/^\s*dica\b|\bdicas\b|\bcomo\b|\bguia\b|checklist/i.test(title)) return 'dica';
  if (/\bsobre a empresa\b|\binstitucional\b|quem somos/.test(t)) return 'institucional';
  if (/\bproduto\b|\blinha\b|\bmodelo\b|\bmarca\b/.test(t)) return 'produto';
  return 'outro';
}

function withinMonth(dateStr, month) { 
  return typeof dateStr === 'string' && dateStr.startsWith(month + '-'); 
}

function weekIndex(dateStr) {
  // Sem dependência de getWeekOfMonth: aprox por faixas (1-7, 8-14, 15-21, 22-28, 29-31)
  try { 
    const d = parseISO(dateStr); 
    const day = d.getDate(); 
    if (day <= 7) return 1; 
    if (day <= 14) return 2; 
    if (day <= 21) return 3; 
    if (day <= 28) return 4; 
    return 5; 
  } catch { 
    return 1; 
  }
}

export function computeQuality({ schedule, clientWebsite = '', approvedHolidays = [], freqPerWeek = 3 }) {
  const month = schedule?.month || '';
  const site = norm(clientWebsite);
  const posts = Array.isArray(schedule?.posts) ? [...schedule.posts] : [];
  posts.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const issues = [];

  // --- Rules checks ---
  let ruleOk = 100;
  const dateSet = new Set();
  
  posts.forEach((p, idx) => {
    const t = norm(p.title), a = norm(p.arte), l = norm(p.legenda), cta = norm(p.cta);
    
    if (!(p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date))) { 
      ruleOk -= 5; 
      issues.push({ postIndex: idx, type: 'date', message: 'Data inválida. Use YYYY-MM-DD.' }); 
    } else if (!withinMonth(p.date, month)) { 
      ruleOk -= 5; 
      issues.push({ postIndex: idx, type: 'date', message: `Data ${p.date} fora do mês ${month}.` }); 
    }
    
    if (t.length < 5 || t.length > 90) { 
      ruleOk -= 4; 
      issues.push({ postIndex: idx, type: 'length', field: 'title', message: `Título com ${t.length} caracteres (5–90).` }); 
    }
    
    if (a.length === 0 || a.length > 200) { 
      ruleOk -= 4; 
      issues.push({ postIndex: idx, type: 'length', field: 'arte', message: `Arte vazia ou >200 (${a.length}).` }); 
    }
    
    if (!arteHasPrefix(a)) { 
      ruleOk -= 4; 
      issues.push({ postIndex: idx, type: 'arte', message: "Arte deve começar com 'Carrossel:' ou 'Estático:'." }); 
    }
    
    if (l.length === 0 || l.length > 500) { 
      ruleOk -= 4; 
      issues.push({ postIndex: idx, type: 'length', field: 'legenda', message: `Legenda vazia ou >500 (${l.length}).` }); 
    }
    
    if (cta && cta.length > 150) { 
      ruleOk -= 3; 
      issues.push({ postIndex: idx, type: 'length', field: 'cta', message: `CTA >150 (${cta.length}).` }); 
    }
    
    if (dateSet.has(p.date)) { 
      ruleOk -= 3; 
      issues.push({ postIndex: idx, type: 'duplicate', field: 'date', message: `Data repetida ${p.date}.` }); 
    }
    dateSet.add(p.date);
  });
  
  if (ruleOk < 0) ruleOk = 0;

  // --- Variety ---
  let carrossel = 0, estatico = 0; 
  const typesCount = { produto: 0, dica: 0, institucional: 0, campanha: 0, outro: 0 };
  const ctas = []; 
  const titles = [];
  
  posts.forEach(p => {
    if (isCarrossel(p.arte)) carrossel++; 
    else if (isEstatico(p.arte)) estatico++;
    
    const t = classifyType(p.title, p.arte); 
    typesCount[t] = (typesCount[t] || 0) + 1;
    
    if (norm(p.cta)) ctas.push(norm(p.cta).toLowerCase());
    if (norm(p.title)) titles.push(norm(p.title).toLowerCase());
  });
  
  const uniqueCtas = new Set(ctas).size; 
  const ctaUniqueRate = ctas.length ? uniqueCtas / ctas.length : 1;
  const uniqueTitles = new Set(titles).size; 
  const titleUniqueRate = titles.length ? uniqueTitles / titles.length : 1;
  
  let consecutiveCtaRepeats = 0; 
  for (let i = 1; i < posts.length; i++) { 
    const prev = norm(posts[i - 1].cta).toLowerCase(), cur = norm(posts[i].cta).toLowerCase(); 
    if (prev && cur && prev === cur) consecutiveCtaRepeats++; 
  }

  // Heurística de tipo -> exigir frase em dica na ARTE
  posts.forEach((p, idx) => {
    const tp = classifyType(p.title, p.arte);
    
    if (tp === 'dica') {
      const ok = /temos\s+(este|esse)?\s*(material|item|produtos?)/i.test(p.arte || '');
      if (!ok) issues.push({ postIndex: idx, type: 'dica', message: "Post de dica sem variação de 'Temos este material' na ARTE." });
    }
    
    if (tp === 'institucional' && site) {
      const inText = (p.legenda || '').includes(site) || (p.cta || '').includes(site);
      if (!inText) issues.push({ postIndex: idx, type: 'institucional', message: 'Institucional não cita o site do cliente.' });
    }
  });

  // Pontuação de variedade
  let varietyOk = 100;
  if (ctaUniqueRate < 0.7) varietyOk -= Math.round((0.7 - ctaUniqueRate) * 40); // até -40
  varietyOk -= consecutiveCtaRepeats * 5; // penaliza repetições consecutivas
  if (titleUniqueRate < 0.85) varietyOk -= Math.round((0.85 - titleUniqueRate) * 40); // até -40
  if (varietyOk < 0) varietyOk = 0;

  // --- Distribution ---
  const byWeek = [0, 0, 0, 0, 0];
  posts.forEach(p => { 
    const w = weekIndex(p.date); 
    byWeek[w - 1]++; 
  });
  
  // Gaps e clusters
  const dates = posts.map(p => parseISO(p.date)).filter(Boolean);
  let minGapDays = Infinity; 
  let clusters = [];
  
  for (let i = 1; i < dates.length; i++) { 
    const gap = differenceInCalendarDays(dates[i], dates[i - 1]); 
    if (gap < minGapDays) minGapDays = gap; 
  }
  if (!isFinite(minGapDays)) minGapDays = null;
  
  // cluster: 3 posts em janela de 3 dias (end-start <=2)
  for (let i = 0; i < dates.length; i++) {
    for (let j = i + 2; j < dates.length; j++) {
      const span = differenceInCalendarDays(dates[j], dates[i]);
      if (span <= 2) { 
        clusters.push({ start: posts[i].date, end: posts[j].date, count: j - i + 1 }); 
        break; 
      }
      if (span > 2) break;
    }
  }
  
  // Pontuação distribuição
  let distOk = 100;
  // proximidade à meta por semana
  byWeek.forEach(cnt => { 
    const diff = Math.abs((freqPerWeek || 3) - cnt); 
    distOk -= Math.min(diff * 6, 18); 
  });
  if (clusters.length) distOk -= Math.min(clusters.length * 10, 30);
  if (distOk < 0) distOk = 0;

  // --- Holidays ---
  const suggested = Array.isArray(schedule?.suggested_holidays) ? schedule.suggested_holidays : [];
  const approvedDates = new Set((approvedHolidays || []).map(h => h.date));
  const usedInPosts = posts.map(p => p.date).filter(d => approvedDates.has(d));
  
  let holOk = 50; // base
  if (suggested.length) holOk += 25; // sugeriu
  if (approvedDates.size) holOk += 10; // há aprovados
  if (usedInPosts.length) holOk += 15; // usou
  if (holOk > 100) holOk = 100;

  // --- Score final ---
  const score = Math.round(0.30 * ruleOk + 0.30 * varietyOk + 0.25 * distOk + 0.15 * holOk);
  const grade = score >= 85 ? 'Excelente' : score >= 70 ? 'Bom' : score >= 50 ? 'Ajustes leves' : 'Precisa de revisão';

  // Stats agregados
  const stats = {
    totalPosts: posts.length,
    formatMix: { carrossel, estatico },
    ctaUniqueRate: Number(ctaUniqueRate.toFixed(2)),
    consecutiveCtaRepeats,
    titleUniqueRate: Number(titleUniqueRate.toFixed(2)),
    byType: typesCount,
    byWeek,
    minGapDays,
    clusters
  };

  const buckets = { 
    rules: Math.round(ruleOk), 
    variety: Math.round(varietyOk), 
    distribution: Math.round(distOk), 
    holidays: Math.round(holOk) 
  };

  return {
    score, 
    grade, 
    buckets, 
    stats,
    holidays: { suggested, approved: approvedHolidays || [], usedInPosts },
    issues
  };
}
