/* Dialog dalam halaman (ganti alert/confirm pelayar) — dikongsi oleh portal dan semua aplikasi */
(function () {
  const CSS = `
.ppdd-ov{position:fixed;inset:0;z-index:100000;background:rgba(7,28,51,.55);display:flex;align-items:center;justify-content:center;
  padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px));
  font-family:var(--ppd-font,'Public Sans','Segoe UI',system-ui,sans-serif);animation:ppdd-f .15s both}
.ppdd-box{width:100%;max-width:400px;background:var(--ppd-surface,var(--surface,#fff));color:var(--ppd-t1,var(--t1,#1a2433));
  border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;animation:ppdd-r .2s cubic-bezier(.2,.7,.2,1) both}
.ppdd-body{display:flex;gap:14px;padding:20px 20px 16px}
.ppdd-ic{width:40px;height:40px;border-radius:10px;flex-shrink:0;display:grid;place-items:center;
  background:color-mix(in srgb,var(--ppdd-c) 14%,transparent);color:var(--ppdd-c)}
.ppdd-ic svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.ppdd-t{font-size:15px;font-weight:800;line-height:1.3}
.ppdd-m{font-size:13px;line-height:1.55;color:var(--ppd-t2,var(--t2,#475467));margin-top:4px;white-space:pre-line;overflow-wrap:anywhere}
.ppdd-act{display:flex;justify-content:flex-end;gap:8px;padding:12px 20px 16px;flex-wrap:wrap}
.ppdd-b{min-height:40px;padding:0 16px;border-radius:8px;font:700 13px/1 inherit;font-family:inherit;cursor:pointer;
  border:1px solid var(--ppd-border,var(--border,#dde3eb));background:var(--ppd-surface,var(--surface,#fff));color:var(--ppd-t1,var(--t1,#1a2433))}
.ppdd-b:hover{background:var(--ppd-surface-2,var(--surface-2,#f8fafc))}
.ppdd-b.p{background:var(--ppdd-c);border-color:var(--ppdd-c);color:#fff}
.ppdd-b.p:hover{filter:brightness(1.1)}
.ppdd-b:focus-visible{outline:3px solid var(--ppd-gold,#c8962a);outline-offset:2px}
@keyframes ppdd-f{from{opacity:0}}
@keyframes ppdd-r{from{opacity:0;transform:translateY(8px) scale(.98)}}
@media (max-width:560px){.ppdd-ov{align-items:flex-end}.ppdd-box{max-width:none}.ppdd-act .ppdd-b{flex:1;min-height:44px}}
@media (prefers-reduced-motion:reduce){.ppdd-ov,.ppdd-box{animation:none}}`;

  const ICONS = {
    danger: '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    warn:   '<svg viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  const COLORS = { danger: '#b42318', warn: '#b54708', info: '#13406e' };

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function open({ title, message, tone = 'info', ok = 'OK', cancel = null }) {
    if (!document.getElementById('ppdd-css')) {
      const st = document.createElement('style');
      st.id = 'ppdd-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const prev = document.activeElement;
    return new Promise(resolve => {
      const ov = document.createElement('div');
      ov.className = 'ppdd-ov';
      ov.style.setProperty('--ppdd-c', COLORS[tone] || COLORS.info);
      ov.innerHTML = `<div class="ppdd-box" role="${cancel ? 'alertdialog' : 'dialog'}" aria-modal="true" aria-labelledby="ppdd-t" aria-describedby="ppdd-m">
        <div class="ppdd-body"><div class="ppdd-ic">${ICONS[tone] || ICONS.info}</div>
          <div style="min-width:0"><div class="ppdd-t" id="ppdd-t">${esc(title)}</div>${message ? `<div class="ppdd-m" id="ppdd-m">${esc(message)}</div>` : ''}</div></div>
        <div class="ppdd-act">${cancel ? `<button type="button" class="ppdd-b" data-v="0">${esc(cancel)}</button>` : ''}<button type="button" class="ppdd-b p" data-v="1">${esc(ok)}</button></div>
      </div>`;
      document.body.appendChild(ov);
      const btns = [...ov.querySelectorAll('.ppdd-b')];
      (cancel && tone === 'danger' ? btns[0] : btns[btns.length - 1]).focus();

      function done(v) {
        document.removeEventListener('keydown', onKey, true);
        ov.remove();
        if (prev && prev.focus) prev.focus();
        resolve(v);
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); }
        if (e.key === 'Tab') {
          const i = btns.indexOf(document.activeElement);
          e.preventDefault();
          btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
        }
      }
      document.addEventListener('keydown', onKey, true);
      ov.addEventListener('click', e => {
        const b = e.target.closest('.ppdd-b');
        if (b) done(b.dataset.v === '1');
        else if (e.target === ov) done(false);
      });
    });
  }

  window.PPDUI = {
    confirm: (title, message, opts = {}) => open({ title, message, tone: opts.tone || 'danger', ok: opts.ok || 'Padam', cancel: opts.cancel || 'Batal' }),
    alert: (title, message, opts = {}) => open({ title, message, tone: opts.tone || 'warn', ok: opts.ok || 'Faham' }),
  };
})();
