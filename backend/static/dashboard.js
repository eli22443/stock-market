(function () {
  "use strict";

  const TICKER_RE = /^[A-Za-z]{1,5}$/;
  const STALE_MS = 30_000;
  const POLL_MS = 5_000;
  const WS_RECONNECT_BASE_MS = 2_000;
  const WS_RECONNECT_MAX_MS = 30_000;

  const subscriptions = new Map();
  let socket = null;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let intentionalClose = false;
  let chatLines = [];
  let chatLoading = false;

  const wsStatusEl = document.getElementById("ws-status");
  const globalLastUpdateEl = document.getElementById("global-last-update");
  const subscribeForm = document.getElementById("subscribe-form");
  const tickerInput = document.getElementById("ticker-input");
  const subscribeError = document.getElementById("subscribe-error");
  const stocksTbody = document.getElementById("stocks-tbody");
  const emptyRow = document.getElementById("empty-row");
  const healthList = document.getElementById("health-list");
  const metricsList = document.getElementById("metrics-list");
  const healthRefreshed = document.getElementById("health-refreshed");
  const metricsRefreshed = document.getElementById("metrics-refreshed");
  const chatHistory = document.getElementById("chat-history");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatError = document.getElementById("chat-error");
  const chatLoadingEl = document.getElementById("chat-loading");

  function wsUrl() {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    return proto + "//" + location.host + "/ws";
  }

  function formatTime(date) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatPrice(price) {
    if (price == null || Number.isNaN(price)) return "—";
    return "$" + Number(price).toFixed(2);
  }

  function setWsStatus(state) {
    wsStatusEl.textContent = state;
    wsStatusEl.className = "badge badge-" + state;
  }

  function showSubscribeError(msg) {
    if (msg) {
      subscribeError.textContent = msg;
      subscribeError.hidden = false;
    } else {
      subscribeError.hidden = true;
      subscribeError.textContent = "";
    }
  }

  function updateEmptyRow() {
    emptyRow.hidden = subscriptions.size > 0;
  }

  function getRow(symbol) {
    return document.getElementById("row-" + symbol);
  }

  function renderRow(symbol) {
    const sub = subscriptions.get(symbol);
    if (!sub) return;

    let row = getRow(symbol);
    if (!row) {
      row = document.createElement("tr");
      row.id = "row-" + symbol;
      row.innerHTML =
        '<td class="mono">' +
        symbol +
        '</td><td class="mono price-cell">—</td>' +
        '<td class="mono update-cell">—</td>' +
        '<td class="status-cell status-waiting">waiting</td>' +
        '<td><button type="button" class="btn-remove" data-symbol="' +
        symbol +
        '" aria-label="Remove ' +
        symbol +
        '">Remove</button></td>';
      row.querySelector(".btn-remove").addEventListener("click", function () {
        unsubscribeSymbol(symbol);
      });
      stocksTbody.appendChild(row);
    }

    row.querySelector(".price-cell").textContent = formatPrice(sub.price);
    row.querySelector(".update-cell").textContent = sub.lastUpdate
      ? formatTime(sub.lastUpdate)
      : "—";
    const statusCell = row.querySelector(".status-cell");
    statusCell.textContent = sub.status;
    statusCell.className = "status-cell status-" + sub.status;
    updateEmptyRow();
  }

  function subscribeSymbol(symbol) {
    symbol = symbol.toUpperCase();
    if (subscriptions.has(symbol)) {
      showSubscribeError(symbol + " is already subscribed");
      return;
    }
    showSubscribeError("");

    subscriptions.set(symbol, {
      price: null,
      lastUpdate: null,
      status: "waiting",
    });
    renderRow(symbol);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ action: "subscribe", symbols: [symbol] })
      );
    }
  }

  function unsubscribeSymbol(symbol) {
    symbol = symbol.toUpperCase();
    if (!subscriptions.has(symbol)) return;

    subscriptions.delete(symbol);
    const row = getRow(symbol);
    if (row) row.remove();
    updateEmptyRow();

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ action: "unsubscribe", symbols: [symbol] })
      );
    }
  }

  function resubscribeAll() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const symbols = Array.from(subscriptions.keys());
    if (symbols.length === 0) return;
    socket.send(JSON.stringify({ action: "subscribe", symbols: symbols }));
  }

  function handlePriceUpdate(data) {
    const symbol = data.symbol;
    if (!symbol || !subscriptions.has(symbol)) return;

    const sub = subscriptions.get(symbol);
    const price = data.data && data.data.price;
    sub.price = price;
    sub.lastUpdate = new Date();
    sub.status = "live";
    subscriptions.set(symbol, sub);
    renderRow(symbol);
    globalLastUpdateEl.textContent = formatTime(sub.lastUpdate);
  }

  function connectWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    intentionalClose = false;
    setWsStatus("reconnecting");
    socket = new WebSocket(wsUrl());

    socket.onopen = function () {
      reconnectAttempt = 0;
      setWsStatus("connected");
      resubscribeAll();
    };

    socket.onmessage = function (event) {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === "price_update") {
        handlePriceUpdate(data);
      }
    };

    socket.onerror = function () {
      setWsStatus("disconnected");
    };

    socket.onclose = function () {
      setWsStatus("disconnected");
      socket = null;
      if (!intentionalClose) {
        scheduleReconnect();
      }
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    const delay = Math.min(
      WS_RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt),
      WS_RECONNECT_MAX_MS
    );
    reconnectAttempt += 1;
    setWsStatus("reconnecting");
    reconnectTimer = setTimeout(function () {
      reconnectTimer = null;
      connectWebSocket();
    }, delay);
  }

  function checkStale() {
    const now = Date.now();
    subscriptions.forEach(function (sub, symbol) {
      if (sub.status === "live" && sub.lastUpdate && now - sub.lastUpdate.getTime() > STALE_MS) {
        sub.status = "stale";
        subscriptions.set(symbol, sub);
        renderRow(symbol);
      }
    });
  }

  subscribeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const raw = tickerInput.value.trim();
    if (!raw) {
      showSubscribeError("Enter a ticker symbol");
      return;
    }
    if (!TICKER_RE.test(raw)) {
      showSubscribeError("Enter a valid ticker like AAPL (1–5 letters)");
      return;
    }
    subscribeSymbol(raw);
    tickerInput.value = "";
    tickerInput.focus();
  });

  function renderKvList(el, entries) {
    el.innerHTML = "";
    entries.forEach(function (pair) {
      const dt = document.createElement("dt");
      dt.textContent = pair[0];
      const dd = document.createElement("dd");
      if (pair[2]) {
        const span = document.createElement("span");
        span.className = "badge badge-" + pair[2];
        span.textContent = String(pair[1]);
        dd.appendChild(span);
      } else {
        dd.textContent = String(pair[1]);
      }
      el.appendChild(dt);
      el.appendChild(dd);
    });
  }

  function statusBadge(val, okValues) {
    const s = String(val).toLowerCase();
    if (okValues.indexOf(s) >= 0) return "ok";
    if (s === "degraded" || s === "disconnected") return "warn";
    return "error";
  }

  async function refreshHealth() {
    try {
      const res = await fetch("/health");
      const data = await res.json();
      renderKvList(healthList, [
        ["Status", data.status, statusBadge(data.status, ["healthy"])],
        ["Version", data.version || "—"],
        ["Server time", data.server_time || "—"],
        ["Uptime", formatUptime(data.uptime_seconds)],
        ["API", data.api || "—", statusBadge(data.api || "", ["ok"])],
        ["WebSocket", data.websocket || "—", statusBadge(data.websocket || "", ["ok"])],
        ["Finnhub", data.finnhub_connection || "—", statusBadge(data.finnhub_connection || "", ["connected"])],
        ["AI chat", data.ai_chat_enabled ? "enabled" : "disabled", data.ai_chat_enabled ? "ok" : "warn"],
        ["Clients", data.clients ?? "—"],
        ["Subscriptions", data.subscriptions ?? "—"],
      ]);
      healthRefreshed.textContent = formatTime(new Date());
      chatSend.disabled = chatLoading;
    } catch {
      healthRefreshed.textContent = "error";
    }
  }

  async function refreshMetrics() {
    try {
      const res = await fetch("/metrics");
      const data = await res.json();
      renderKvList(metricsList, [
        ["Connected clients", data.connected_clients ?? "—"],
        ["Active subscriptions", data.active_subscriptions ?? "—"],
        ["WS messages sent", data.ws_messages_sent ?? "—"],
        ["WS messages received", data.ws_messages_received ?? "—"],
        ["Finnhub messages", data.finnhub_messages_received ?? "—"],
        ["HTTP requests", data.http_requests_total ?? "—"],
        ["CPU", (data.cpu_percent ?? "—") + "%"],
        ["Memory", (data.memory_percent ?? "—") + "% (" + (data.memory_used_mb ?? "—") + " MB)"],
        ["Uptime", formatUptime(data.uptime_seconds)],
        ["Server time", data.server_time || "—"],
      ]);
      metricsRefreshed.textContent = formatTime(new Date());
    } catch {
      metricsRefreshed.textContent = "error";
    }
  }

  function formatUptime(sec) {
    if (sec == null) return "—";
    const s = Math.floor(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return h + "h " + m + "m " + r + "s";
    if (m > 0) return m + "m " + r + "s";
    return r + "s";
  }

  function renderChat() {
    chatHistory.innerHTML = "";
    if (chatLines.length === 0) {
      const p = document.createElement("p");
      p.className = "empty-cell";
      p.style.margin = "0";
      p.textContent = "No messages yet.";
      chatHistory.appendChild(p);
      return;
    }
    chatLines.forEach(function (line) {
      const div = document.createElement("div");
      div.className = "chat-line chat-line-" + line.role;
      div.innerHTML =
        '<div class="chat-role">' +
        line.role +
        '</div><p class="chat-content"></p>';
      div.querySelector(".chat-content").textContent = line.content;
      chatHistory.appendChild(div);
    });
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function showChatError(msg) {
    if (msg) {
      chatError.textContent = msg;
      chatError.hidden = false;
    } else {
      chatError.hidden = true;
    }
  }

  function setChatLoading(loading) {
    chatLoading = loading;
    chatLoadingEl.hidden = !loading;
    chatSend.disabled = loading;
    chatInput.disabled = loading;
  }

  chatForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const trimmed = chatInput.value.trim();
    if (!trimmed || chatLoading) return;

    const userLine = { role: "user", content: trimmed };
    chatLines.push(userLine);
    renderChat();
    chatInput.value = "";
    showChatError("");
    setChatLoading(true);

    const messages = chatLines.map(function (m) {
      return { role: m.role, content: m.content };
    });

    try {
      const res = await fetch("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages }),
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const detail =
          payload && (payload.detail || payload.error)
            ? payload.detail || payload.error
            : "Request failed (" + res.status + ")";
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
      }

      const content =
        payload && payload.message && payload.message.content
          ? payload.message.content
          : "No response content.";
      chatLines.push({ role: "assistant", content: content });
      renderChat();
    } catch (err) {
      showChatError(err.message || "Something went wrong.");
    } finally {
      setChatLoading(false);
    }
  });

  connectWebSocket();
  refreshHealth();
  refreshMetrics();
  setInterval(refreshHealth, POLL_MS);
  setInterval(refreshMetrics, POLL_MS);
  setInterval(checkStale, 5_000);
})();
