(function () {
  const FACEIT_API_KEY = "d2d8e7b5-60c8-424f-aad3-e5d66d1b87ac";
  const FACEIT_API_BASE = "https://open.faceit.com/data/v4";

  async function fetchJson(url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${FACEIT_API_KEY}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Faceit API ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  async function getPlayerCs2Stats(playerId) {
    const url = `${FACEIT_API_BASE}/players/${playerId}/stats/cs2`;
    return fetchJson(url);
  }

  // Progi Elo dla CS2 (Faceit 2024): Level 1 = 100–500, 2 = 501–750, …, 8 = 1531–1750, 10 = 2001+
  function eloToLevel(elo) {
    if (elo == null || elo < 100) return "?";
    const boundaries = [
      [1, 500], [2, 750], [3, 900], [4, 1050], [5, 1200], [6, 1350], [7, 1530],
      [8, 1750], [9, 2000], [10, 1e9],
    ];
    for (let i = 0; i < boundaries.length; i++) {
      if (elo <= boundaries[i][1]) return String(boundaries[i][0]);
    }
    return "10";
  }

  function parseStatsFromResponse(statsResponse, playerData, nickname) {
    let kd = null;
    let winrate = null;
    let level = null;
    let rawKdSource = null;

    const games = playerData?.games || {};
    let csGame = games.cs2 || games.csgo;
    if (csGame == null && typeof games === "object") {
      csGame = games["cs2"] || games["csgo"] || Object.values(games).find((g) => g && (g.faceit_elo != null || g.skill_level != null));
    }
    if (csGame != null) {
      if (csGame.skill_level != null) level = String(csGame.skill_level);
      const faceitElo = Number(csGame.faceit_elo);
      if (level == null && Number.isFinite(faceitElo)) level = eloToLevel(faceitElo);
    }

    function num(v) {
      if (v == null) return NaN;
      const n = parseFloat(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : NaN;
    }

    // ─── Skąd bierzemy K/D (bez przekłamań) ─────────────────────────────────────────────
    // 1. Źródło: odpowiedź API GET /players/{id}/stats/cs2 → obiekt "lifetime".
    // 2. Pole: tylko "Average K/D Ratio" (NIE "K/D Ratio" – w API bywa błędny, np. 399.57).
    // 3. Wartość: dokładnie to, co API zwraca; my tylko parseFloat i .toFixed(2) do wyświetlenia.
    // 4. Gdy brak: ewentualnie K/D = Kills/Deaths z lifetime. Surowa wartość trafia do title i data-faceit-source.
    let stats = statsResponse?.lifetime || {};
    if (typeof stats !== "object" || Array.isArray(stats)) stats = {};

    if (Object.keys(stats).length === 0) {
      const segments = statsResponse?.segments;
      if (Array.isArray(segments) && segments.length > 0) {
        const seg = segments.find((s) => (s.label || "").toLowerCase().includes("lifetime")) || segments[0];
        stats = seg?.stats || seg || {};
        if (Array.isArray(stats)) {
          stats = stats.reduce((acc, item) => {
            const k = item?.label ?? item?.name ?? item?.key;
            if (k != null) acc[String(k)] = item?.value ?? item?.val;
            return acc;
          }, {});
        }
      }
    }

    if (Object.keys(stats).length > 0) {
      if (typeof window !== "undefined" && window.group221FaceitDebugEnabled && nickname) {
        console.log("[Faceit] Raw stats dla " + nickname + ":", { statsKeys: Object.keys(stats), stats });
      }

      // Jedyna używana wartość K/D: "Average K/D Ratio" z obiektu lifetime (cała historia).
      // "K/D Ratio" z API nie używamy – bywa błędny (np. 399.57).
      const rawKdFromApi = stats["Average K/D Ratio"];
      rawKdSource = rawKdFromApi != null ? String(rawKdFromApi) : null;
      const kdVal = num(rawKdFromApi);
      if (Number.isFinite(kdVal) && kdVal >= 0.01 && kdVal <= 15) kd = kdVal;

      if (kd == null) {
        const k = num(stats["Kills"] ?? stats["k"]);
        const d = num(stats["Deaths"] ?? stats["d"]);
        if (Number.isFinite(k) && Number.isFinite(d) && d > 0) {
          kd = k / d;
          rawKdSource = "Kills/Deaths (" + k + "/" + d + ")";
        }
      }

      const wrPct = stats["Win Rate %"] ?? stats["Winrate %"] ?? stats["Win Rate"] ?? stats["Winrate"] ?? stats["Wins %"];
      const wrNum = num(wrPct);
      if (Number.isFinite(wrNum) && wrNum >= 0 && wrNum <= 100) winrate = String(Math.round(wrNum));
      if (winrate == null) {
        const w = num(stats["Wins"] ?? stats["w"]);
        const m = num(stats["Matches"] ?? stats["m"]);
        if (Number.isFinite(w) && Number.isFinite(m) && m > 0) winrate = String(Math.round((w / m) * 100));
      }
    }

    return {
      kd: kd != null ? kd.toFixed(2) : null,
      winrate: winrate != null ? (String(winrate).includes("%") ? winrate : winrate + "%") : null,
      elo: level != null ? level : (kd != null || winrate != null ? "?" : null),
      rawKdSource: rawKdSource,
    };
  }

  function updateCardElement(card, stats) {
    const set = (field, value, title, attrs) => {
      const el = card.querySelector(`[data-faceit-field="${field}"]`);
      if (el && value != null) {
        el.textContent = value;
        if (title) el.setAttribute("title", title);
        if (attrs) Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
      }
    };
    const kdSourceLabel = stats.rawKdSource != null && stats.rawKdSource.startsWith("Kills/Deaths")
      ? "lifetime.Kills/Deaths"
      : "lifetime.Average K/D Ratio";
    const kdTitle = stats.rawKdSource != null
      ? "K/D z Faceit API: " + kdSourceLabel + " = " + stats.rawKdSource + ". Wyświetlamy toFixed(2), bez dopisywania."
      : "K/D z Faceit API (lifetime).";
    set("kd", stats.kd, kdTitle, stats.rawKdSource != null ? { "data-faceit-source": kdSourceLabel } : null);
    set("winrate", stats.winrate);
    set("elo", stats.elo);
  }

  async function updateCardForNickname(nickname, card) {
    try {
      const playerData = await fetchJson(
        `${FACEIT_API_BASE}/players?nickname=${encodeURIComponent(nickname)}`
      );
      const playerId = playerData?.player_id;
      if (!playerId) {
        console.warn(`[Faceit] Nie znaleziono gracza: ${nickname}`);
        updateCardElement(card, { kd: "—", winrate: "—", elo: "—" });
        return;
      }

      let statsResponse = {};
      try {
        statsResponse = await getPlayerCs2Stats(playerId);
      } catch (e) {
        console.warn(`[Faceit] Brak statystyk CS2 dla ${nickname}:`, e.message);
      }

      if (typeof window !== "undefined" && !window.group221FaceitConsoleLoggedOnce) {
        window.group221FaceitConsoleLoggedOnce = true;
        console.log("[Faceit] Odpowiedź API (player):", playerData);
        console.log("[Faceit] Odpowiedź API (stats/cs2):", statsResponse);
      }

      const nicknameForParse = card.getAttribute("data-faceit-nickname") || "";
      const stats = parseStatsFromResponse(statsResponse, playerData, nicknameForParse);
      updateCardElement(card, stats);
    } catch (err) {
      console.error(`[Faceit] Błąd dla ${nickname}:`, err);
      updateCardElement(card, { kd: "Brak danych", winrate: "Brak danych", elo: "—" });
    }
  }

  function init() {
    const faceitBlocks = document.querySelectorAll("[data-faceit-nickname]");
    faceitBlocks.forEach((block) => {
      const nickname = block.getAttribute("data-faceit-nickname");
      if (nickname) {
        const link = block.querySelector(".faceit-link");
        if (link && !link.getAttribute("href")) {
          link.href = `https://www.faceit.com/pl/players/${encodeURIComponent(nickname)}`;
        }
        updateCardForNickname(nickname, block);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
