// My Page: referral code, who used it, notifications.
(function () {
  const API_BASE = '/api';
  const TOKEN_KEY = 'vively_user_token';
  const USER_KEY = 'vively_user_data';

  const $ = (id) => document.getElementById(id);

  function toast(message) {
    const el = $('mp-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  async function copy(text, okMessage) {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMessage);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast(okMessage); } catch { toast('복사에 실패했어요'); }
      ta.remove();
    }
  }

  function formatDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function timeAgo(value) {
    const d = new Date(value);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
    return formatDate(value);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showGate() {
    $('mp-gate').hidden = false;
    $('mp-app').hidden = true;
    const btn = $('mp-login-btn');
    if (btn) btn.addEventListener('click', () => {
      if (window.vivelyOpenLoginModal) window.vivelyOpenLoginModal();
    });
  }

  function render(data) {
    const { user, referral, notifications, unreadCount } = data;
    $('mp-gate').hidden = true;
    $('mp-app').hidden = false;

    const avatar = $('mp-avatar');
    if (user.picture) {
      avatar.innerHTML = `<img src="${escapeHtml(user.picture)}" alt="" referrerpolicy="no-referrer">`;
    } else {
      avatar.textContent = (user.username || user.email || 'V').slice(0, 1).toUpperCase();
    }
    $('mp-username').textContent = `@${user.username || user.email}`;
    const metaBits = [];
    if (user.fullName) metaBits.push(`<b>${escapeHtml(user.fullName)}</b>`);
    if (user.createdAt) metaBits.push(`가입일 ${formatDate(user.createdAt)}`);
    if (user.referredByUsername) metaBits.push(`@${escapeHtml(user.referredByUsername)} 초대로 가입`);
    $('mp-meta').innerHTML = metaBits.join(' · ');

    $('mp-code').textContent = referral.code;
    const link = `${window.location.origin}/?ref=${encodeURIComponent(referral.code)}`;
    $('mp-link').textContent = link;
    $('mp-count').textContent = referral.count;
    $('mp-unread').textContent = unreadCount;
    $('mp-referred-count').textContent = `${referral.count} ${referral.count === 1 ? 'person' : 'people'}`;

    $('mp-copy-code').onclick = () => copy(referral.code, '코드를 복사했어요');
    $('mp-copy-link').onclick = () => copy(link, '링크를 복사했어요');
    const share = $('mp-share');
    if (navigator.share) {
      share.hidden = false;
      share.onclick = () => navigator.share({
        title: 'Vively',
        text: `Vively에 내 레퍼럴 코드 ${referral.code}로 가입해 보세요!`,
        url: link,
      }).catch(() => {});
    }

    const referredList = $('mp-referred');
    referredList.innerHTML = referral.referred.map((r) => `
      <li>
        <div class="who"><span class="dot">${escapeHtml((r.referredUsername || '?').slice(0, 2))}</span><b>@${escapeHtml(r.referredUsername)}</b></div>
        <time datetime="${escapeHtml(r.createdAt)}">${formatDate(r.createdAt)}</time>
      </li>`).join('');
    $('mp-referred-empty').hidden = referral.referred.length > 0;

    fillSettings(user);

    const notifList = $('mp-notifs');
    notifList.innerHTML = notifications.map((n) => `
      <li class="${n.read ? '' : 'unread'}">
        <span class="msg">${escapeHtml(n.message)}${n.data && n.data.link ? ` <a class="mp-notif-link" href="${escapeHtml(n.data.link)}">보기 →</a>` : ''}</span>
        <time datetime="${escapeHtml(n.createdAt)}">${timeAgo(n.createdAt)}</time>
      </li>`).join('');
    $('mp-notifs-empty').hidden = notifications.length > 0;
    const markBtn = $('mp-mark-read');
    markBtn.hidden = unreadCount === 0;
    markBtn.onclick = () => markRead();
  }

  async function markRead() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'mark-notifications-read' }),
      });
      if (!res.ok) return;
      document.querySelectorAll('#mp-notifs li.unread').forEach((li) => li.classList.remove('unread'));
      $('mp-unread').textContent = '0';
      $('mp-mark-read').hidden = true;
      ['notif-badge', 'mobile-notif-badge'].forEach((id) => { const b = $(id); if (b) b.hidden = true; });
    } catch { /* ignore */ }
  }

  // =========================
  // ACCOUNT SETTINGS (email-verified)
  // =========================
  const FIELDS = ['username', 'fullName', 'countryCode', 'phone', 'instagram', 'tiktok', 'youtube', 'instagramFollowers', 'tiktokFollowers', 'youtubeSubscribers', 'portfolioUrl', 'bio'];
  let original = {};

  function fieldEl(name) { return $(`mp-f-${name}`); }

  function fillSettings(user) {
    original = {};
    FIELDS.forEach((name) => {
      const el = fieldEl(name);
      if (!el) return;
      const value = user[name] == null ? '' : String(user[name]);
      el.value = name === 'countryCode' && !value ? '+82' : value;
      original[name] = el.value;
      el.classList.remove('is-changed', 'is-error');
    });
    $('mp-settings-email').textContent = user.email;
    updateChangeState();
  }

  function collectChanges() {
    const changes = {};
    FIELDS.forEach((name) => {
      const el = fieldEl(name);
      if (!el) return;
      const value = el.value.trim();
      const changed = value !== (original[name] || '');
      el.classList.toggle('is-changed', changed);
      if (changed) changes[name] = value;
    });
    return changes;
  }

  function updateChangeState() {
    const n = Object.keys(collectChanges()).length;
    const hint = $('mp-form-hint');
    hint.textContent = n ? `${n}개 항목 변경됨 · 저장 시 이메일 인증` : '변경된 항목이 없어요';
    hint.classList.toggle('has-changes', n > 0);
    $('mp-save').disabled = n === 0;
  }

  function apiPost(body) {
    const token = localStorage.getItem(TOKEN_KEY);
    return fetch(`${API_BASE}/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }).then(async (res) => ({ res, data: await res.json().catch(() => ({})) }));
  }

  // ---- verification modal ----
  const verify = {
    purpose: null,
    onVerified: null,
    cooldownTimer: null,
  };

  function codeInputs() { return [...document.querySelectorAll('#mp-code-inputs input')]; }
  function currentCode() { return codeInputs().map((i) => i.value).join(''); }

  function showVerifyError(msg) {
    const box = $('mp-verify-error');
    box.textContent = msg;
    box.hidden = !msg;
  }

  function openVerify({ purpose, title, desc, needsConfirm, onVerified }) {
    verify.purpose = purpose;
    verify.onVerified = onVerified;
    $('mp-verify-title').textContent = title;
    $('mp-verify-desc').textContent = desc;
    $('mp-verify-confirm-wrap').hidden = !needsConfirm;
    $('mp-verify-confirm').value = '';
    $('mp-verify-step-send').hidden = false;
    $('mp-verify-form').hidden = true;
    codeInputs().forEach((i) => { i.value = ''; });
    showVerifyError('');
    $('mp-verify').hidden = false;
    $('mp-verify-send').focus();
  }

  function closeVerify() {
    $('mp-verify').hidden = true;
    clearInterval(verify.cooldownTimer);
  }

  function startResendCooldown(seconds) {
    const btn = $('mp-verify-resend');
    clearInterval(verify.cooldownTimer);
    let left = seconds;
    const tick = () => {
      if (left <= 0) { btn.disabled = false; btn.textContent = '다시 보내기'; clearInterval(verify.cooldownTimer); return; }
      btn.disabled = true;
      btn.textContent = `다시 보내기 (${left}s)`;
      left -= 1;
    };
    tick();
    verify.cooldownTimer = setInterval(tick, 1000);
  }

  async function sendCode() {
    const sendBtn = $('mp-verify-send');
    sendBtn.disabled = true;
    showVerifyError('');
    try {
      const { res, data } = await apiPost({ action: 'request-code', purpose: verify.purpose });
      if (!res.ok) {
        showVerifyError(data.error || '코드를 보내지 못했어요');
        if (data.retryAfterSeconds) { $('mp-verify-step-send').hidden = true; $('mp-verify-form').hidden = false; startResendCooldown(data.retryAfterSeconds); }
        return;
      }
      $('mp-verify-email').textContent = data.email;
      $('mp-verify-step-send').hidden = true;
      $('mp-verify-form').hidden = false;
      codeInputs().forEach((i) => { i.value = ''; });
      codeInputs()[0].focus();
      startResendCooldown(60);
      if (data.devCode) console.info(`[dev] ${verify.purpose} code: ${data.devCode}`);
      if (data.emailSent === false) toast('이메일 발송이 설정되지 않았어요 (개발 모드)');
    } catch {
      showVerifyError('네트워크 오류. 다시 시도해 주세요.');
    } finally {
      sendBtn.disabled = false;
    }
  }

  function setupVerifyModal() {
    $('mp-verify-close').onclick = closeVerify;
    $('mp-verify').addEventListener('click', (e) => { if (e.target === $('mp-verify')) closeVerify(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('mp-verify').hidden) closeVerify(); });
    $('mp-verify-send').onclick = sendCode;
    $('mp-verify-resend').onclick = sendCode;

    const inputs = codeInputs();
    inputs.forEach((input, i) => {
      input.addEventListener('input', (e) => {
        const digits = e.target.value.replace(/\D/g, '');
        if (digits.length > 1) {
          digits.split('').slice(0, 6 - i).forEach((d, k) => { inputs[i + k].value = d; });
          inputs[Math.min(i + digits.length, 5)].focus();
          return;
        }
        e.target.value = digits;
        if (digits && i < 5) inputs[i + 1].focus();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && i > 0) inputs[i - 1].focus();
      });
      input.addEventListener('paste', (e) => {
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        if (!text) return;
        e.preventDefault();
        text.split('').forEach((d, k) => { if (inputs[k]) inputs[k].value = d; });
        inputs[Math.min(text.length, 5)].focus();
      });
    });

    $('mp-verify-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = currentCode();
      if (code.length !== 6) { showVerifyError('6자리 코드를 입력해 주세요'); return; }
      const submit = $('mp-verify-submit');
      submit.disabled = true;
      showVerifyError('');
      try {
        await verify.onVerified(code, $('mp-verify-confirm').value.trim());
      } finally {
        submit.disabled = false;
      }
    });
  }

  function setupSettings() {
    const form = $('mp-profile-form');
    FIELDS.forEach((name) => fieldEl(name)?.addEventListener('input', updateChangeState));
    fieldEl('countryCode')?.addEventListener('change', updateChangeState);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const changes = collectChanges();
      if (!Object.keys(changes).length) return;
      FIELDS.forEach((n) => fieldEl(n)?.classList.remove('is-error'));
      const labels = Object.keys(changes).map((k) => form.querySelector(`[name="${k}"]`)?.closest('.mp-field')?.querySelector('label')?.textContent.replace('*', '').trim() || k);
      openVerify({
        purpose: 'update-profile',
        title: '변경 사항 확인',
        desc: `${labels.join(', ')} 변경을 저장하려면 이메일 인증이 필요해요.`,
        needsConfirm: false,
        onVerified: async (code) => {
          const { res, data } = await apiPost({ action: 'update-profile', code, changes });
          if (!res.ok) {
            if (data.field && data.field !== 'code') {
              closeVerify();
              fieldEl(data.field)?.classList.add('is-error');
              fieldEl(data.field)?.focus();
              toast(data.error || '저장하지 못했어요');
            } else {
              showVerifyError(data.error || '저장하지 못했어요');
              codeInputs().forEach((i) => { i.value = ''; });
              codeInputs()[0].focus();
            }
            return;
          }
          closeVerify();
          try {
            const stored = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
            localStorage.setItem(USER_KEY, JSON.stringify({ ...stored, username: data.user.username, profile: { ...(stored.profile || {}), fullName: data.user.fullName } }));
          } catch { /* ignore */ }
          toast('변경 사항을 저장했어요');
          load();
        },
      });
    });

    $('mp-delete-btn').onclick = () => {
      openVerify({
        purpose: 'delete-account',
        title: '정말 계정을 삭제할까요?',
        desc: '계정, 프로필, 지원 내역, 알림이 영구적으로 삭제되며 되돌릴 수 없어요. 계속하려면 이메일 인증을 진행해 주세요.',
        needsConfirm: true,
        onVerified: async (code, confirm) => {
          if (confirm !== 'DELETE') { showVerifyError('확인을 위해 DELETE를 정확히 입력해 주세요'); return; }
          const { res, data } = await apiPost({ action: 'delete-account', code, confirm });
          if (!res.ok) {
            showVerifyError(data.error || '삭제하지 못했어요');
            if (data.field === 'code') { codeInputs().forEach((i) => { i.value = ''; }); codeInputs()[0].focus(); }
            return;
          }
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          closeVerify();
          toast('계정이 삭제되었어요');
          setTimeout(() => { window.location.href = 'index.html'; }, 900);
        },
      });
    };
  }

  async function load() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return showGate();
    try {
      const res = await fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 404) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return showGate();
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      render(data);
      if (new URLSearchParams(window.location.search).get('welcome') === '1') {
        $('mp-welcome').hidden = false;
        window.history.replaceState({}, '', 'my-page.html');
      }
    } catch (error) {
      console.error('My Page load error:', error);
      $('mp-gate').hidden = false;
      $('mp-gate').querySelector('h1').textContent = '페이지를 불러오지 못했어요.';
      $('mp-gate').querySelector('p').textContent = '잠시 후 다시 시도해 주세요.';
      $('mp-login-btn').textContent = '다시 시도';
      $('mp-login-btn').onclick = () => window.location.reload();
    }
  }

  // When the user logs in from the gate, the modal stores the token and
  // updates the header; re-run load so the page fills in without a refresh.
  window.addEventListener('storage', (e) => { if (e.key === TOKEN_KEY) load(); });
  const origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    origSetItem(key, value);
    if (key === TOKEN_KEY) setTimeout(load, 0);
  };

  document.addEventListener('DOMContentLoaded', () => { setupVerifyModal(); setupSettings(); load(); });
})();
