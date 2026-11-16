(function () {
  'use strict';
  var d = document;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  // footer year
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  // mobile menu
  var burger = $('.burger'), menu = $('#menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      d.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); d.body.style.overflow = ''; }); });
  }

  // header state
  var hdr = $('.site-header');
  window.addEventListener('scroll', function () { hdr.style.background = window.scrollY > 20 ? 'rgba(8,8,8,.98)' : ''; }, { passive: true });

  // scroll reveal
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    $$('.reveal').forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  } else { $$('.reveal').forEach(function (e) { e.classList.add('in'); }); }

  // parallax (hero)
  var pit = $('.hero-img') || $('.pit');
  if (pit && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY; if (y < 1200) $$('.pit,.hero-img').forEach(function (n) { n.style.transform = 'translate3d(0,' + (y * .25) + 'px,0)'; });
    }, { passive: true });
  }

  // page transitions
  $$('a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (!h || h.charAt(0) === '#' || /^(mailto:|tel:|https?:)/.test(h) || a.target) return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (h.split('#')[0] === '' ) return;
      e.preventDefault(); d.body.classList.add('leaving');
      setTimeout(function () { location.href = a.href; }, 220);
    });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) d.body.classList.remove('leaving'); });

  // product search + filter
  var search = $('#psearch');
  if (search) {
    var cards = $$('.pcard[data-cat]'), secs = $$('[data-cat-sec]'), chips = $$('.chip'), cat = 'all';
    var none = $('#pnone'), count = $('#pcount');
    var apply = function () {
      var q = search.value.trim().toLowerCase(), shown = 0;
      cards.forEach(function (c) {
        var ok = (cat === 'all' || c.dataset.cat === cat) && (!q || c.dataset.search.indexOf(q) > -1);
        c.hidden = !ok; if (ok) shown++;
      });
      secs.forEach(function (s) { s.hidden = !$$('.pcard:not([hidden])', s).length; });
      none.hidden = shown > 0;
      count.textContent = shown + (shown === 1 ? ' product' : ' products');
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { cat = c.dataset.cat; chips.forEach(function (x) { x.classList.toggle('is-on', x === c); }); apply(); }); });
    search.addEventListener('input', apply);
    var p = new URLSearchParams(location.search);
    if (p.get('cat')) { var m = chips.filter(function (c) { return c.dataset.cat === p.get('cat'); })[0]; if (m) m.click(); }
    apply();
  }

  // contact tabs
  $$('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.tab').forEach(function (x) { x.classList.toggle('is-on', x === t); });
      $$('.tabp').forEach(function (p) { p.hidden = p.id !== t.dataset.tab; });
    });
  });

  // quote: preselect product from ?product=
  var qf = $('#quoteform');
  if (qf) {
    var prod = new URLSearchParams(location.search).get('product');
    var sel = qf.elements.product;
    if (prod && sel) {
      var found = false;
      Array.prototype.forEach.call(sel.options, function (o) { if (o.value === prod) { o.selected = true; found = true; } });
      if (!found) { var o = new Option(prod, prod, true, true); sel.add(o); }
    }
  }

  // file name list
  $$('[data-filenames]').forEach(function (i) { i.addEventListener('change', function () { }); });

  // forms -> validated mailto
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  $$('form.form').forEach(function (form) {
    var status = $('.status', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'status'; status.textContent = '';
      if (form.elements.website && form.elements.website.value) return; // honeypot
      var bad = null;
      $$('input,select,textarea', form).forEach(function (f) {
        if (f.name === 'website' || f.type === 'file') return;
        var err = f.parentNode.querySelector('.err'); var msg = '';
        var v = (f.value || '').trim();
        if (f.required && !v) msg = 'This field is required.';
        else if (f.type === 'email' && v && !emailRe.test(v)) msg = 'Enter a valid email address.';
        else if (f.type === 'url' && v && !/^https?:\/\//i.test(v)) msg = 'Include https:// at the start.';
        if (err) err.textContent = msg;
        f.classList.toggle('invalid', !!msg);
        if (msg && !bad) bad = f;
      });
      if (bad) { bad.focus(); status.className = 'status bad'; status.textContent = 'Please correct the highlighted fields and try again.'; return; }

      var to = form.dataset.mailTo;
      if (form.dataset.deptField) to = form.elements[form.dataset.deptField].value;
      var lines = [], names = [];
      $$('input,select,textarea', form).forEach(function (f) {
        if (f.name === 'website' && f.closest('.hp')) return;
        if (f.type === 'file') { Array.prototype.forEach.call(f.files || [], function (x) { names.push(x.name); }); return; }
        var v = (f.value || '').trim(); if (!v) return;
        var lab = f.parentNode.querySelector('label'); var l = lab ? lab.textContent.replace('*', '').trim() : f.name;
        lines.push(l + ': ' + v);
      });
      if (form.dataset.product) lines.unshift('Product: ' + form.dataset.product);
      if (names.length) lines.push('Documents to attach: ' + names.join(', '));
      var subject = form.dataset.subject;
      if (form.elements.product && form.elements.product.value) subject += ' - ' + form.elements.product.value;
      var body = lines.join('\n') + '\n\n--\nSent from www.astrosupply.co.za';
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (href.length > 1900) { status.className = 'status bad'; status.textContent = 'Your message is too long to send this way. Please shorten it, or email ' + to + ' directly.'; return; }
      status.className = 'status ok';
      status.innerHTML = 'Thank you. Your email app should now open with your enquiry addressed to <strong>' + to + '</strong>. If nothing opens, please email us directly at <a href="mailto:' + to + '">' + to + '</a>.' + (names.length ? ' Remember to attach: ' + names.join(', ') + '.' : '');
      window.location.href = href;
    });
  });
})();
