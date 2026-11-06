<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="UTF-8" isELIgnored="false"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<%@ page import="java.util.*" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<html lang="pt-BR" data-tema="light">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TITULO DO COMPONENTE</title>
    <snk:load/>
    <style>
/* Guia visual - visual embutido para componente HTML5 Sankhya. */
:root {
  --bg:#ffffff;
  --surface:#f9f9f9;
  --panel:#ffffff;
  --text:#1f2937;
  --muted:#666666;
  --subtle:#858b97;
  --border:#e5e5e5;
  --primary:#fbbf24;
  --primary-hover:#f5b914;
  --success:#10b981;
  --warning:#f59e0b;
  --danger:#ef4444;
  --soft-yellow:#fffbeb;
  --soft-green:#ecfdf5;
  --soft-orange:#fff7ed;
  --soft-red:#fef2f2;
  --hover:#f9f9f9;
  --shadow:0 2px 8px rgba(0,0,0,.045);
}
html[data-tema="dark"] {
  --bg:#000000;
  --surface:#0a0a0a;
  --panel:#0a0a0a;
  --text:#f3f4f6;
  --muted:#9ca3af;
  --subtle:#9ca3af;
  --border:#1f2937;
  --primary:#fbbf24;
  --primary-hover:#facc49;
  --success:#10b981;
  --warning:#f59e0b;
  --danger:#ef4444;
  --soft-yellow:#28200b;
  --soft-green:#09261c;
  --soft-orange:#27190b;
  --soft-red:#2b1317;
  --hover:#12151a;
  --shadow:0 4px 12px rgba(0,0,0,.22);
}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{background:var(--bg);color:var(--text);font:14px/1.5 Inter,"Segoe UI",Arial,sans-serif;transition:background .2s,color .2s}
button,input,select{font:inherit}
button{cursor:pointer}
button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid rgba(251,191,36,.3);outline-offset:1px}
.app-shell{max-width:1650px;margin:0 auto;padding:26px clamp(14px,2.7vw,38px) 32px}
/* Header */
.report-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;padding:24px 28px;margin-bottom:22px;border:1px solid var(--border);border-bottom:3px solid var(--primary);background:var(--panel);border-radius:12px;box-shadow:var(--shadow)}
.brand-group{display:flex;align-items:center;gap:17px;min-width:0}
.brand-mark{height:82px;width:82px;flex:0 0 82px;border-radius:20px;display:block;object-fit:contain;box-shadow:var(--shadow)}
.eyebrow{display:block;font-size:10px;font-weight:700;letter-spacing:1.65px;text-transform:uppercase;color:var(--muted);margin:0 0 5px}
.report-header h1{font-size:clamp(19px,2vw,28px);font-weight:700;line-height:1.25;letter-spacing:-.65px;margin:0 0 4px}
.report-header p{font-size:12px;color:var(--muted);margin:0}
.header-right{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
.context-label{font-size:11px;color:var(--muted);padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);white-space:nowrap}
.theme-button{border:1px solid var(--border);border-radius:8px;padding:9px 13px;background:var(--surface);color:var(--text);font-weight:600;font-size:12px;white-space:nowrap;transition:background .2s,border-color .2s}
.theme-button:hover{border-color:var(--primary);background:var(--soft-yellow)}
/* Structure and titles */
.panel{padding:22px 23px;background:var(--panel);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow);min-width:0}
.filters-panel{margin-bottom:23px}
.section-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin:0 0 16px;flex-wrap:wrap}
.section-heading h2,.panel h2{font-size:17px;font-weight:700;line-height:1.3;letter-spacing:-.25px;color:var(--text);margin:0}
.section-hint{font-size:11px;color:var(--muted)}
.section-kicker{font-size:10px;font-weight:700;letter-spacing:1.45px;text-transform:uppercase;color:var(--muted);margin:0 0 4px}
/* Filters */
.filters{display:grid;grid-template-columns:repeat(6,minmax(125px,1fr));gap:13px;align-items:end}
.field{min-width:0}
.field label{display:block;font-size:12px;font-weight:600;color:var(--text);margin:0 0 7px}
.field input,.field select{width:100%;min-width:0;height:41px;padding:9px 11px;border:1px solid var(--border);background:var(--bg);color:var(--text);border-radius:8px;outline:0;transition:box-shadow .2s,border-color .2s}
.field input:focus,.field select:focus,.search-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(251,191,36,.15)}
.field input::-webkit-calendar-picker-indicator{cursor:pointer}
html[data-tema="dark"] .field input::-webkit-calendar-picker-indicator{filter:invert(1)}
.filter-actions{grid-column:1/-1;display:flex;align-items:center;flex-wrap:wrap;gap:9px;padding-top:4px}
.btn{min-height:39px;padding:9px 16px;border:1px solid var(--primary);border-radius:8px;color:#151515;background:var(--primary);font-weight:700;font-size:12px;transition:background .2s,border-color .2s,transform .2s;white-space:nowrap}
.btn:hover{background:var(--primary-hover);border-color:var(--primary-hover);transform:translateY(-1px)}
.btn.secondary{border-color:var(--border);color:var(--text);background:var(--panel)}
.btn.secondary:hover{border-color:var(--primary);background:var(--soft-yellow)}
.btn:active{transform:translateY(0)}
.status{display:flex;align-items:center;gap:9px;min-height:27px;padding:12px 1px 0;color:var(--muted);font-size:11px;overflow-wrap:anywhere}
.status:before{content:"";display:inline-block;width:7px;height:7px;background:var(--success);border-radius:100%;flex:0 0 7px}
.status.error{color:var(--danger)}
.status.error:before{background:var(--danger)}
/* Metric cards */
.dashboard-section{margin-bottom:23px}
.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.card{background:var(--panel);border:1px solid var(--border);border-left:4px solid var(--primary);border-radius:12px;padding:19px 21px;min-height:125px;box-shadow:var(--shadow);position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-2px);box-shadow:0 5px 18px rgba(0,0,0,.09)}
.card.green{border-left-color:var(--success)}
.card.orange{border-left-color:var(--warning)}
.card .k{font-size:12px;color:var(--muted);font-weight:500;margin:0 0 15px}
.card .v{font-size:clamp(23px,2.1vw,31px);font-weight:700;letter-spacing:-1px;line-height:1.2;color:var(--text);overflow-wrap:anywhere}
.card.green .v{color:var(--success)}
.card.orange .v{color:var(--warning)}
.card .card-foot{display:block;margin-top:11px;font-size:10px;color:var(--subtle)}
/* Charts, rendered in native SVG without CDN. */
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin-bottom:23px}
.chart-panel{min-height:302px}
.chart-head{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;padding-bottom:15px;border-bottom:1px solid var(--border);margin-bottom:17px}
.chart-overline{font-size:10px;letter-spacing:.7px;text-transform:uppercase;font-weight:600;color:var(--muted)}
.pizza-area{display:flex;align-items:center;gap:21px;min-height:202px}
.pizza-fig{width:190px;height:190px;flex:0 0 190px;max-width:100%}
.pizza-fig svg{display:block;width:100%;height:100%;filter:drop-shadow(0 3px 5px rgba(0,0,0,.05))}
.pizza-fig svg path{stroke:var(--panel)}
.pizza-legenda{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px}
.pizza-item{display:flex;align-items:flex-start;gap:8px;color:var(--muted);line-height:1.4;font-size:11px}
.pizza-cor{width:10px;height:10px;border-radius:3px;flex:0 0 10px;margin-top:3px}
.pizza-nome{flex:1;min-width:0;overflow-wrap:anywhere;color:var(--text)}
.pizza-dado{font-weight:600;color:var(--muted);text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.muted{color:var(--muted);font-size:12px}
/* Details */
.details-panel{padding-bottom:13px}
.toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:17px}
.toolbar-title{display:flex;flex-direction:column;gap:4px}
.toolbar-subtitle{color:var(--muted);font-size:11px}
.toolbar-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.search-input{width:min(340px,68vw);min-width:190px;height:39px;padding:9px 12px;color:var(--text);background:var(--bg);border:1px solid var(--border);border-radius:8px;outline:0;font-size:12px}
.search-input::placeholder{color:var(--muted)}
.tablewrap{overflow:auto;max-height:500px;border:1px solid var(--border);border-radius:8px;background:var(--panel)}
table{width:100%;border-spacing:0;border-collapse:separate;font-size:12px;white-space:nowrap;color:var(--text)}
th{position:sticky;top:0;z-index:2;background:var(--surface);text-align:left;padding:13px 14px;color:var(--text);font-weight:700;border-bottom:1px solid var(--border)}
td{padding:11px 14px;border-bottom:1px solid var(--border);color:var(--text);font-variant-numeric:tabular-nums}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover td{background:var(--hover)}
th:first-child,td:first-child{position:sticky;left:0;z-index:1;background:var(--panel);font-weight:600}
th:first-child{z-index:3;background:var(--surface)}
tbody tr:hover td:first-child{background:var(--hover)}
.tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;border:1px solid rgba(16,185,129,.22);background:var(--soft-green);color:var(--success);font-size:11px;font-weight:700}
.tag:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--success)}
.tag.no{background:var(--soft-red);border-color:rgba(239,68,68,.2);color:var(--danger)}
.tag.no:before{background:var(--danger)}
.table-footer{margin-top:2px;padding:8px 1px 0;font-size:11px;color:var(--muted)}
.report-footer{margin-top:16px;padding:15px 2px;text-align:center;border-top:1px solid var(--border);font-size:11px;color:var(--muted)}
@media(max-width:1250px){.filters{grid-template-columns:repeat(3,minmax(0,1fr))}.pizza-area{gap:13px}.pizza-fig{width:160px;height:160px;flex-basis:160px}}
@media(max-width:960px){.grid{grid-template-columns:1fr}.chart-panel{min-height:unset}.pizza-fig{width:180px;height:180px;flex-basis:180px}}
@media(max-width:700px){.app-shell{padding:14px}.report-header{padding:17px}.brand-group{align-items:flex-start}.brand-mark{width:64px;height:64px;flex-basis:64px}.filters{grid-template-columns:repeat(2,minmax(0,1fr))}.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.panel{padding:17px}.card{padding:16px;min-height:107px}.header-right{width:100%}}
@media(max-width:470px){.filters{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.pizza-area{flex-direction:column;align-items:center}.pizza-legenda{width:100%}.filter-actions .btn{flex:1 1 100%}.search-input{width:100%}.toolbar-actions{width:100%}.toolbar-actions .btn{flex:1}.report-header h1{font-size:19px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}

/* ===== CSS proprio deste componente (abaixo do Guia visual) ===== */
.card.red{border-left-color:var(--danger)}
.card.red .v{color:var(--danger)}
.toolbar-panel{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:23px}
.toolbar-panel .status{padding-top:0}
    </style>
</head>
<body>
<div class="app-shell">
    <!-- CABECALHO: trocar area, titulo e subtitulo. Logo opcional: <img class="brand-mark" src="data:image/png;base64,..."> antes do texto. -->
    <header class="report-header">
        <div class="brand-group">
            <div><span class="eyebrow">EMPRESA / AREA</span><h1>Título do Componente</h1><p>Uma linha dizendo o que a tela mostra</p></div>
        </div>
        <div class="header-right">
            <span class="context-label">Dashboard HTML5 · Sankhya</span>
            <button id="themeToggle" type="button" class="theme-button" aria-pressed="false" onclick="alternarTema()">Modo escuro</button>
        </div>
    </header>

    <!-- FILTROS: exemplo com periodo. Remover se nao precisar. -->
    <section class="panel filters-panel" aria-label="Filtros">
        <div class="section-heading"><div><p class="section-kicker">Consulta</p><h2>Filtros</h2></div></div>
        <div class="filters">
            <div class="field"><label for="dtIni">Data inicial</label><input type="date" id="dtIni"></div>
            <div class="field"><label for="dtFim">Data final</label><input type="date" id="dtFim"></div>
            <div class="filter-actions"><button type="button" class="btn" onclick="carregarDados()">Consultar dados</button></div>
        </div>
        <div id="status" class="status" role="status" aria-live="polite">Selecione os filtros e clique em Consultar dados.</div>
    </section>

    <!-- CARDS: um article por indicador. Classes: (padrao amarelo) green orange red. -->
    <section class="dashboard-section" aria-label="Indicadores">
        <div class="section-heading"><div><p class="section-kicker">Visão geral</p><h2>Indicadores</h2></div><span class="section-hint">Conforme os filtros</span></div>
        <div class="cards">
            <article class="card"><div class="k">Registros</div><div class="v" id="vQtd">-</div><span class="card-foot">Linhas retornadas</span></article>
            <article class="card green"><div class="k">Indicador 2</div><div class="v" id="vInd2">-</div><span class="card-foot">Explicação curta</span></article>
            <article class="card orange"><div class="k">Indicador 3</div><div class="v" id="vInd3">-</div><span class="card-foot">Explicação curta</span></article>
            <article class="card"><div class="k">Indicador 4</div><div class="v" id="vInd4">-</div><span class="card-foot">Explicação curta</span></article>
        </div>
    </section>

    <!-- GRADE: monta as colunas sozinha a partir do resultado do SQL. -->
    <section class="panel details-panel" aria-label="Detalhamento">
        <div class="toolbar">
            <div class="toolbar-title"><p class="section-kicker">Detalhamento</p><h2>Título da grade</h2><span class="toolbar-subtitle">O que cada linha representa</span></div>
            <div class="toolbar-actions"><input class="search-input" id="busca" type="search" placeholder="Pesquisar..." oninput="renderTabela()"><button type="button" class="btn secondary" onclick="exportarCSV()">Exportar CSV</button></div>
        </div>
        <div class="tablewrap"><table><thead id="cabecalho"></thead><tbody id="linhas"></tbody></table></div>
        <div class="table-footer" id="contagem">Nenhum resultado carregado.</div>
    </section>

    <footer class="report-footer">EMPRESA · Título do Componente · Sankhya</footer>
</div>
<script>
// ===== Integracao Sankhya (nao mexer): executeQuery(sql, params, callback) =====
function el(id){return document.getElementById(id)}
function txt(v){return v===null||v===undefined?'':String(v)}
// esc() em TODO dado que vai para innerHTML (evita injecao de HTML vinda do banco).
function esc(v){return txt(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function numero(v){if(typeof v==='number')return v;var s=txt(v).trim().replace(/R\$/g,'').replace(/\s/g,'');if(s.indexOf(',')>=0){s=s.replace(/\./g,'').replace(',','.');}return parseFloat(s)||0}
function moeda(v){return 'R$ '+numero(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
function inteiro(v){return Math.round(numero(v)).toLocaleString('pt-BR')}
function status(m,erro){el('status').textContent=m;el('status').className=erro?'status error':'status'}
function interpretarRetorno(v){
 var r=v;
 // O executeQuery pode devolver array, objeto ou texto JSON: normaliza para array de linhas.
 for(var tentativa=0;tentativa<5;tentativa++){
  if(Array.isArray(r))return r;
  if(r && typeof r==='object'){
   if(Array.isArray(r.rows))return r.rows;
   if(Array.isArray(r.data))return r.data;
   if(Array.isArray(r.result))return r.result;
   if(r.data && Array.isArray(r.data.rows))return r.data.rows;
   if(r.error)throw new Error(txt(r.error));
   if(r.message)throw new Error(txt(r.message));
  }
  var s=txt(r).trim();
  if(s && (s.charAt(0)==='[' || s.charAt(0)==='{' || s.charAt(0)==='"')){
   try{r=JSON.parse(s);continue}
   catch(e){throw new Error('JSON devolvido pelo Sankhya invalido: '+e.message)}
  }
  break;
 }
 throw new Error('Formato da resposta nao reconhecido: '+txt(v).substring(0,260));
}
function maiusculas(rows){return rows.map(function(d){var r={};Object.keys(d).forEach(function(k){r[k.toUpperCase()]=d[k]});return r})}
// Consulta paginada: o executeQuery pode cortar linhas por resposta. O SQL precisa de ORDER BY para a pagina ser estavel.
// params: [{value:..., type:'I'|'S'|'D'}] na ordem dos "?" do SQL. Nunca concatenar texto digitado no SQL.
function consultar(sql,params,ok,erro,etapa){
 var lote=400,pagina=0,acumulado=[];
 function falhou(m){status('Falha em '+etapa+': '+m,true);if(erro)erro(m)}
 function proxima(){
  if(pagina>=150){falhou('limite de 60.000 linhas');return}
  try{
   if(typeof executeQuery!=='function')throw new Error('executeQuery indisponivel no Sankhya');
   executeQuery(sql+' OFFSET '+(pagina*lote)+' ROWS FETCH NEXT '+lote+' ROWS ONLY',params||[],function(v){
    try{
     var regs=maiusculas(interpretarRetorno(v));
     if(regs.length>lote){falhou('o Sankhya ignorou a paginacao');return}
     Array.prototype.push.apply(acumulado,regs);
     if(regs.length===lote){pagina++;status('Carregando: '+acumulado.length+' registros...');proxima();return}
     ok(acumulado);
    }catch(e){falhou(e.message)}
   });
  }catch(e){falhou(e.message)}
 }
 proxima();
}

// ===== Daqui para baixo: o que muda em cada componente =====
// SQL: literais sem acento; datas como texto DD/MM/YYYY nos parametros ("?").
var SQL_PRINCIPAL="SELECT e.CODEMP, e.NOMEFANTASIA FROM TSIEMP e ORDER BY e.CODEMP";
var dados=[];

function carregarDados(){
 status('Consultando...');
 consultar(SQL_PRINCIPAL,[],function(regs){
  dados=regs;
  el('vQtd').textContent=inteiro(dados.length);
  renderTabela();
  status('Consulta concluída: '+dados.length+' registros.');
 },null,'consulta principal');
}
function filtrados(){
 var termo=el('busca').value.toLowerCase().trim();
 if(!termo)return dados;
 return dados.filter(function(r){return Object.keys(r).some(function(k){return txt(r[k]).toLowerCase().indexOf(termo)>=0})});
}
// Grade generica: colunas = campos do SQL. Para formatar uma coluna, trate pelo nome em celula().
function celula(coluna,valor){return esc(valor)}
function renderTabela(){
 var rows=filtrados(),cols=dados.length?Object.keys(dados[0]):[];
 el('cabecalho').innerHTML='<tr>'+cols.map(function(c){return '<th>'+esc(c)+'</th>'}).join('')+'</tr>';
 el('linhas').innerHTML=rows.length?rows.map(function(r){return '<tr>'+cols.map(function(c){return '<td>'+celula(c,r[c])+'</td>'}).join('')+'</tr>'}).join(''):'<tr><td>Nenhum registro.</td></tr>';
 el('contagem').textContent=rows.length+' de '+dados.length+' registros.';
}
function baixar(blob,nome){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=nome;a.style.display='none';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(url)},5000)}
function exportarCSV(){
 var rows=filtrados();if(!rows.length){status('Nenhum registro para exportar.',true);return}
 var cols=Object.keys(rows[0]);
 var csv='﻿sep=;\r\n'+[cols].concat(rows.map(function(r){return cols.map(function(c){return r[c]})})).map(function(l){return l.map(function(v){return '"'+txt(v).replace(/"/g,'""')+'"'}).join(';')}).join('\r\n');
 baixar(new Blob([csv],{type:'text/csv;charset=utf-8'}),'Exportacao_'+new Date().toISOString().substring(0,10)+'.csv');
}
function alternarTema(){var raiz=document.documentElement,botao=el('themeToggle'),escuro=raiz.getAttribute('data-tema')==='dark';raiz.setAttribute('data-tema',escuro?'light':'dark');botao.setAttribute('aria-pressed',escuro?'false':'true');botao.textContent=escuro?'Modo escuro':'Modo claro'}
carregarDados();
</script>
</body>
</html>
