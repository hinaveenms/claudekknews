// Static site generator: data/*.json -> dist/*.html (flat, relative links, works on any host or subpath)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';

const site = JSON.parse(readFileSync('data/site.json', 'utf8'));
const articles = JSON.parse(readFileSync('data/articles.json', 'utf8'))
  .sort((a, b) => b.date.localeCompare(a.date));
const catName = Object.fromEntries(site.categories.map(c => [c.slug, c.name]));
const COLORS = ['#c2410c', '#0f766e', '#1d4ed8', '#7c3aed', '#b45309', '#be123c', '#4d7c0f', '#0369a1'];
const catColor = Object.fromEntries(site.categories.map((c, i) => [c.slug, COLORS[i % COLORS.length]]));

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = { home: p => (p === 1 ? 'index.html' : `page-${p}.html`), cat: s => `c-${s}.html`, art: id => `a-${id}.html` };

const thumb = (a, cls = 'thumb') =>
  `<div class="${cls}" style="background:${catColor[a.cat]}" aria-hidden="true">${esc(catName[a.cat])}</div>`;

const card = a => `<article>
  <a href="${url.art(a.id)}">${thumb(a)}</a>
  <div><h2><a href="${url.art(a.id)}">${esc(a.title)}</a></h2>
  <div class="meta"><a class="tag" href="${url.cat(a.cat)}">${esc(catName[a.cat])}</a>${a.date}</div>
  <p>${esc(a.summary)}</p></div></article>`;

const sidebar = () => `<aside>
  <div class="box"><h3>熱門排行</h3><ol>${articles.slice(0, 8).map(a => `<li><a href="${url.art(a.id)}">${esc(a.title)}</a></li>`).join('')}</ol></div>
  <div class="box"><h3>關於本站</h3><p class="meta">${esc(site.name)}是一個示範新聞網站，所有文章皆為原創範例內容。</p></div>
</aside>`;

const page = ({ title, active = '', body, desc = site.tagline }) => `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title ? `${title} - ${site.name}` : `${site.name} - ${site.tagline}`)}</title>
<meta name="description" content="${esc(desc)}"><link rel="stylesheet" href="style.css"></head><body>
<header class="top"><div class="wrap">
  <a class="brand" href="index.html"><span class="dot"></span><b>${esc(site.name)}</b><small>${esc(site.nameEn)} · ${esc(site.tagline)}</small></a>
  <form class="search" action="search.html" role="search"><input name="q" type="search" placeholder="搜尋文章…" aria-label="搜尋"></form>
</div></header>
<nav class="cats"><div class="wrap"><a href="index.html"${active === 'home' ? ' class="on"' : ''}>首頁</a>${site.categories.map(c => `<a href="${url.cat(c.slug)}"${active === c.slug ? ' class="on"' : ''}>${esc(c.name)}</a>`).join('')}</div></nav>
<main class="wrap">${body}${sidebar()}</main>
<footer>© ${new Date().getFullYear()} ${esc(site.name)} ${esc(site.nameEn)} · 原創示範內容</footer>
</body></html>`;

const pager = (cur, total, link) => total < 2 ? '' :
  `<div class="pager">${Array.from({ length: total }, (_, i) => i + 1).map(p => p === cur ? `<span>${p}</span>` : `<a href="${link(p)}">${p}</a>`).join('')}</div>`;

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
const out = (f, html) => writeFileSync(`dist/${f}`, html);

// Home (paginated)
const pages = Math.ceil(articles.length / site.perPage);
for (let p = 1; p <= pages; p++) {
  const list = articles.slice((p - 1) * site.perPage, p * site.perPage);
  out(url.home(p), page({ title: p > 1 ? `第 ${p} 頁` : '', active: 'home', body: `<section class="feed">${list.map(card).join('')}${pager(p, pages, url.home)}</section>` }));
}

// Categories
for (const c of site.categories) {
  const list = articles.filter(a => a.cat === c.slug);
  out(url.cat(c.slug), page({ title: c.name, active: c.slug, body: `<section class="feed">${list.length ? list.map(card).join('') : '<p class="empty">此分類暫無文章。</p>'}</section>` }));
}

// Articles
for (const a of articles) {
  const related = articles.filter(x => x.cat === a.cat && x.id !== a.id).slice(0, 3);
  out(url.art(a.id), page({ title: a.title, desc: a.summary, active: a.cat, body: `<section><article class="story">
  <h1>${esc(a.title)}</h1><div class="meta"><a class="tag" href="${url.cat(a.cat)}">${esc(catName[a.cat])}</a>${a.date}</div>
  ${thumb(a, 'thumb hero')}
  ${a.body.map(p => `<p>${esc(p)}</p>`).join('\n  ')}
  <div class="share"><button style="background:#1877f2" data-share="fb">Facebook</button><button style="background:#06c755" data-share="line">LINE</button><button style="background:#555" data-share="copy">複製連結</button></div>
  </article>${related.length ? `<div class="feed" style="margin-top:20px"><h3>相關閱讀</h3>${related.map(card).join('')}</div>` : ''}</section>
<script>document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>{const u=encodeURIComponent(location.href);const t=b.dataset.share;
if(t==='copy'){navigator.clipboard&&navigator.clipboard.writeText(location.href).then(()=>b.textContent='已複製');return}
open(t==='fb'?'https://www.facebook.com/sharer/sharer.php?u='+u:'https://social-plugins.line.me/lineit/share?url='+u,'_blank','noopener')})</script>`}));
}

// Search (client-side over a small JSON index)
writeFileSync('dist/search-index.json', JSON.stringify(articles.map(({ id, cat, date, title, summary }) => ({ id, cat: catName[cat], date, title, summary }))));
out('search.html', page({ title: '搜尋', body: `<section class="feed" id="results"><p class="empty">搜尋中…</p></section>
<script>(async()=>{const q=(new URLSearchParams(location.search).get('q')||'').trim();const box=document.getElementById('results');
document.querySelector('form.search input').value=q;box.textContent='';
const h=document.createElement('p');h.className='meta';box.append(h);if(!q){h.textContent='請輸入關鍵字。';return}
const data=await (await fetch('search-index.json')).json();const hits=data.filter(a=>(a.title+a.summary+a.cat).includes(q));
h.textContent='「'+q+'」共 '+hits.length+' 篇結果';
for(const a of hits){const el=document.createElement('article');el.style.display='block';
const t=document.createElement('h2');const l=document.createElement('a');l.href='a-'+a.id+'.html';l.textContent=a.title;t.append(l);
const m=document.createElement('div');m.className='meta';m.textContent=a.cat+' · '+a.date;
const p=document.createElement('p');p.textContent=a.summary;el.append(t,m,p);box.append(el)}})()</script>` }));

out('404.html', page({ title: '找不到頁面', body: `<section class="feed"><p class="empty">找不到這個頁面，<a href="index.html" style="color:var(--accent)">回到首頁</a>。</p></section>` }));
copyFileSync('src/style.css', 'dist/style.css');
console.log(`Built ${articles.length} articles, ${pages} home pages, ${site.categories.length} categories.`);
