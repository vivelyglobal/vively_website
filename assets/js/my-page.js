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

    const notifList = $('mp-notifs');
    notifList.innerHTML = notifications.map((n) => `
      <li class="${n.read ? '' : 'unread'}">
        <span class="msg">${escapeHtml(n.message)}</span>
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

  document.addEventListener('DOMContentLoaded', load);
})();
