/* ============================================================
 *  分支向导引擎（一般无需改动）
 *  主流程：1 选业务 → 2 业务说明 → 3 价格 → 4 需求(分支)
 *         → 5 清单确认 → 6 文件说明 → 7 最终确认 → 提交 → 后台
 * ============================================================ */

(function () {
  const C = window.APP_CONFIG;
  const SIG = window.SIG_LABELS;
  const SIGL = window.SIG_LEVEL_LABELS;
  const IVT = window.IV_TYPE_LABELS;
  const IVD = window.IV_DIR_LABELS;
  const API = ""; // 相对路径：由 server.js 同源托管时直接可用

  const $app = document.getElementById("app");
  const $bar = document.getElementById("bar");
  const $count = document.getElementById("count");

  const TOTAL = 7;
  const state = {
    step: 1,
    biz: null,
    s4: {},
    files: [],
    review: { choice: null, fix: "" },
  };

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }
  /* 页面内提示横幅（替代 alert，兼容内嵌预览环境） */
  function showTip(msg) {
    let tip = document.getElementById("inpage_tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "inpage_tip";
      tip.className = "inpage-tip";
      document.body.appendChild(tip);
    }
    tip.textContent = msg;
    tip.classList.add("show");
    clearTimeout(tip._t);
    tip._t = setTimeout(() => tip.classList.remove("show"), 3500);
  }
  function val(sel) {
    const el = document.querySelector(sel);
    return el ? el.value.trim() : "";
  }
  function checkedVal(sel) {
    const el = document.querySelector(sel + ":checked");
    return el ? el.value : "";
  }
  function optRadio(name, value, label) {
    return `<label class="opt"><input type="radio" name="${name}" value="${value}"><span>${esc(label)}</span></label>`;
  }
  function optCheck(name, value, label) {
    return `<label class="opt"><input type="checkbox" name="${name}" value="${value}"><span>${esc(label)}</span></label>`;
  }
  function updateProgress() {
    const pct = Math.round((state.step / TOTAL) * 100);
    $bar.style.width = pct + "%";
    $count.textContent = `第 ${state.step} / ${TOTAL} 步`;
  }
  function setNav({ back, next }) {
    const $nav = document.getElementById("nav");
    $nav.innerHTML = `<div class="nav-inner">
      ${back ? `<button class="btn btn-ghost" id="backBtn">${esc(back.text)}</button>` : ""}
      ${
        next
          ? `<button class="btn btn-primary ${next.disabled ? "disabled" : ""}" id="nextBtn">${esc(next.text)}</button>`
          : ""
      }
    </div>`;
    if (back) $nav.querySelector("#backBtn").addEventListener("click", back.fn);
    if (next && !next.disabled)
      $nav.querySelector("#nextBtn").addEventListener("click", next.fn);
  }
  function go(step) {
    state.step = Math.max(1, Math.min(TOTAL, step));
    render();
    saveProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- 汇总（供回顾与后台展示） ---------- */
  function summarize() {
    const s4 = state.s4;
    const out = [];
    // Show commands if any were entered on step 3
    if (state.s3Commands && state.s3Commands.length) {
      out.push({ label: "要调整的命令", value: state.s3Commands.join("\n") });
    }
    // Show selected variables if any
    if (state.s3SelectedVars && state.s3SelectedVars.length) {
      out.push({ label: "要调整的变量", value: state.s3SelectedVars.join("、") });
    }
    if (s4.type === "significance") {
      const cfgMap = new Map((s4.vars || []).map((v) => [v.name, v]));
      const selectedVars = state.s3SelectedVars || [];
      if (selectedVars.length) {
        selectedVars.forEach((name) => {
          const v = cfgMap.get(name) || { name, dir: "" };
          let txt = SIG[v.dir] || "【未填写显著性方向】";
          if (v.dir === "pos" || v.dir === "neg") {
            txt += v.level ? "（" + SIGL[v.level] + "）" : "【未填写显著性水平】";
          }
          out.push({ label: "变量 " + name, value: txt });
        });
      } else {
        out.push({ label: "已选变量", value: "无" });
      }
      const extraLabels = (s4.extras || []).map((e) => window.SIG_EXTRA_LABELS[e]).filter(Boolean);
      if (extraLabels.length)
        out.push({ label: "其他调整项", value: extraLabels.join("、") + (s4.extraOther ? "；" + s4.extraOther : "") });
      if (s4.note && s4.note.trim()) out.push({ label: "补充说明", value: s4.note.trim() });
    } else if (s4.type === "doit") {
      state.biz.step4.items.forEach((it) => {
        const d = s4.items && s4.items[it.key];
        if (d && (d.count || d.extra)) {
          out.push({
            label: it.label,
            value:
              (d.count ? "个数 " + d.count : "") +
              (d.extra ? (d.count ? "；额外：" + d.extra : d.extra) : ""),
          });
        }
      });
    } else if (s4.type === "qa") {
      out.push({ label: "疑问", value: s4.qaText || "" });
    } else if (s4.type === "indicator") {
      out.push({ label: "需求说明", value: s4.indText || "" });
      if (state.files.length)
        out.push({ label: "上传文件", value: state.files.map((f) => f.name).join("、") });
    } else if (s4.type === "did") {
      out.push({ label: "选择项", value: (s4.selected || []).join("、") });
      if (s4.other) out.push({ label: "其他说明", value: s4.other });
    } else if (s4.type === "iv") {
      out.push({ label: "服务类型", value: (s4.ivTypes || []).map((v) => IVT[v] || v).join("、") });
      if ((s4.ivTypes || []).includes("first")) {
        out.push({ label: "第一阶段方向", value: IVD[s4.firstDir] || "" });
        out.push({ label: "第一阶段水平", value: SIGL[s4.firstLevel] || "" });
      }
      if ((s4.ivTypes || []).includes("second")) {
        out.push({ label: "第二阶段方向", value: IVD[s4.secondDir] || "" });
        out.push({ label: "第二阶段水平", value: SIGL[s4.secondLevel] || "" });
      }
      if ((s4.ivTypes || []).includes("other") && s4.ivOther)
        out.push({ label: "其他说明", value: s4.ivOther });
    } else if (s4.type === "other") {
      out.push({ label: "需求", value: s4.otherText || "" });
    }
    return out;
  }

  /* ---------- 渲染 ---------- */
  function render() {
    updateProgress();
    switch (state.step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
    }
  }

  function renderStep1() {
    const cards = C.businesses
      .map(
        (b) => `<div class="biz-card" data-id="${b.id}">
          <div class="biz-emoji">${b.emoji}</div>
          <div class="biz-name">${esc(b.name)}</div>
        </div>`
      )
      .join("");
    $app.innerHTML = `<div class="stage">
      <div class="card">
        <h1 class="title">${esc(C.intro.title)}</h1>
        <p class="lead">${esc(C.intro.body)}</p>
      </div>
      <div class="card">
        <div class="section-label">第 1 步 · 选择你要办理的业务</div>
        <div class="biz-grid">${cards}</div>
      </div>
    </div>`;
    $app.querySelectorAll(".biz-card").forEach((el) =>
      el.addEventListener("click", () => {
        state.biz = C.businesses.find((b) => b.id === el.dataset.id);
        state.s4 = {};
        state.files = [];
        state.review = { choice: null, fix: "" };
        go(2);
      })
    );
    setNav({ back: null, next: { text: "请选择上方一项业务", disabled: true } });
  }

  function header(b, kicker) {
    return `<div class="step-emoji">${b.emoji}</div>
      <div class="step-kicker">${esc(kicker)}</div>
      <div class="step-title">${esc(b.name)}</div>`;
  }

  function renderStep2() {
    const b = state.biz;
    $app.innerHTML = `<div class="stage"><div class="card">
      ${header(b, "第 2 步 / 共 7 步 · 这项业务具体做什么")}
      <div class="step-detail">${b.desc}</div>
    </div></div>`;
    setNav({ back: { text: "返回", fn: () => go(1) }, next: { text: "确定", fn: () => go(3) } });
  }

  function renderStep3() {
    const b = state.biz;
    let extra = "";
    if (b.id === "significance") {
      const cmds = (state.s3Commands || [""]).map((c, i) =>
        `<div class="cmd-row" data-idx="${i}">
          <textarea class="cmd-input" placeholder="请输入要调整的 Stata 命令（如：reg y x1 x2, r）" rows="2">${esc(c)}</textarea>
          ${i > 0 ? `<button type="button" class="cmd-remove" data-idx="${i}" title="删除此行">✕</button>` : ""}
        </div>`
      ).join("");
      extra = `
        <div class="cmd-section">
          <div class="section-label">📝 请输入你要调整的代码（命令）</div>
          <div class="cmd-hint">如需调整多行代码，请分开填写，<strong>一行只填一个命令</strong>。可点击下方按钮添加更多输入框。</div>
          <div id="cmd_list">${cmds}</div>
          <button type="button" id="cmd_add" class="btn-add-cmd">＋ 添加另一个命令</button>

          <div style="margin-top:16px">
            <button type="button" id="parse_vars_btn" class="btn-add-cmd" style="border-color:#10b981;color:#059669">🔍 解析命令中的变量</button>
          </div>
          <div id="var_section" style="display:none">
            <div class="section-label" style="margin-top:16px">🎯 请点击选择要调整的变量</div>
            <div class="var-hint">系统已从你的命令中解析出以下变量，<strong>点击变量标签即可选中/取消</strong>。选中的变量会高亮显示。</div>
            <div id="var_groups"></div>
            <div style="margin-top:14px;padding:12px;background:#f8f9fc;border-radius:10px;border:1.5px dashed #d0d7e3">
              <div style="font-size:13.5px;color:var(--ink-soft);margin-bottom:8px">✏️ 未识别到变量？可手动添加（每行一个，回车确认）：</div>
              <input type="text" id="manual_var_input" placeholder="输入变量名后按回车，如：企业创新、ln_patent" style="width:100%;border:1.5px solid var(--line);border-radius:8px;padding:9px 12px;font-size:14px;font-family:'Consolas',monospace;outline:none;box-sizing:border-box">
              <div id="manual_var_chips" class="var-chips" style="margin-top:8px"></div>
            </div>
          </div>
        </div>`;
    }
    $app.innerHTML = `<div class="stage"><div class="card">
      ${header(b, "第 3 步 / 共 7 步 · 这项业务怎么收费")}
      <div class="price-box">${esc(b.price)}</div>
      ${extra}
    </div></div>`;
    setNav({ back: { text: "返回", fn: () => go(2) }, next: { text: "确定", fn: () => {
      // Collect commands if significance
      if (b.id === "significance") {
        const inputs = document.querySelectorAll(".cmd-input");
        state.s3Commands = Array.from(inputs).map(el => el.value.trim()).filter(v => v);

        // 校验：填了命令就必须解析并选择变量
        if (state.s3Commands.length > 0) {
          if (!state.s3VarsParsed) {
            showTip("请点击「解析命令中的变量」，选择您要调整的变量");
            const pb = document.getElementById("parse_vars_btn");
            if (pb) pb.classList.add("pulse");
            return; // 未解析，不跳转
          }
          // 已解析且解析出了变量，则必须至少选一个
          const hasChips = document.querySelectorAll(".var-chip").length > 0;
          const selectedCount = document.querySelectorAll(".var-chip.selected").length;
          if (hasChips && selectedCount === 0) {
            showTip("请点击解析出的变量标签，选择您要调整的变量");
            return; // 有变量但未选，不跳转
          }
        }

        // Collect selected variables
        state.s3SelectedVars = [];
        document.querySelectorAll(".var-chip.selected").forEach(chip => {
          state.s3SelectedVars.push(chip.dataset.varName);
        });
      }
      go(4);
    } } });

    // Wire command & variable interactions (only for significance)
    if (b.id === "significance") {
      // --- Add command row ---
      document.getElementById("cmd_add").addEventListener("click", () => {
        const list = document.getElementById("cmd_list");
        const idx = list.children.length;
        const row = document.createElement("div");
        row.className = "cmd-row";
        row.dataset.idx = idx;
        row.innerHTML = `<textarea class="cmd-input" placeholder="请输入要调整的 Stata 命令（如：reg y x1 x2, r）" rows="2"></textarea>` +
          `<button type="button" class="cmd-remove" data-idx="${idx}" title="删除此行">✕</button>`;
        list.appendChild(row);
        wireCmdRemove(row.querySelector(".cmd-remove"));
      });
      document.querySelectorAll(".cmd-remove").forEach(wireCmdRemove);

      // --- Parse variables from commands ---
      document.getElementById("parse_vars_btn").addEventListener("click", () => {
        state.s3VarsParsed = true;
        const pb = document.getElementById("parse_vars_btn");
        if (pb) pb.classList.remove("pulse");
        const inputs = document.querySelectorAll(".cmd-input");
        const rawCmds = Array.from(inputs).map(el => el.value.trim()).filter(v => v);
        if (!rawCmds.length) { showTip("请先输入至少一条命令"); return; }

        const results = rawCmds.map(cmd => ({ cmd, vars: parseStataVars(cmd) }));
        const hasAnyVars = results.some(r => r.vars.length > 0);

        const container = document.getElementById("var_groups");
        if (!hasAnyVars) {
          container.innerHTML = `<div class="var-empty">未能从命令中识别出变量名。请检查命令格式是否正确（如 reg y x1 x2, r），或手动在第4步说明要调整的变量。</div>`;
          document.getElementById("var_section").style.display = "";
          return;
        }

        container.innerHTML = results.map((r, i) => {
          if (!r.vars.length) return "";
          const prevSel = state.s3SelectedVars || [];
          const chips = r.vars.map(v => {
            const sel = prevSel.includes(v) ? " selected" : "";
            return `<span class="var-chip${sel}" data-var-name="${esc(v)}" data-cmd-idx="${i}">${esc(v)}</span>`;
          }).join("");
          return `<div class="var-group">
            <div class="var-cmd-label">命令 ${i + 1}：<code>${esc(truncateCmd(r.cmd))}</code></div>
            <div class="var-chips">${chips}</div>
          </div>`;
        }).join("");

        document.getElementById("var_section").style.display = "";

        // Wire chip click toggles
        container.querySelectorAll(".var-chip").forEach(chip => {
          chip.addEventListener("click", () => {
            chip.classList.toggle("selected");
          });
        });

        // --- 手动添加变量 ---
        const manualInput = document.getElementById("manual_var_input");
        const manualChipsEl = document.getElementById("manual_var_chips");
        function renderManualChips() {
          const mv = state.s3ManualVars || [];
          if (!mv.length) { manualChipsEl.innerHTML = ""; return; }
          manualChipsEl.innerHTML = mv.map((v, i) =>
            `<span class="var-chip selected" data-var-name="${esc(v)}" data-manual-idx="${i}">${esc(v)}</span>`
          ).join("");
          manualChipsEl.querySelectorAll(".var-chip").forEach(chip => {
            chip.addEventListener("click", () => {
              const idx = +chip.dataset.manualIdx;
              (state.s3ManualVars = state.s3ManualVars || []).splice(idx, 1);
              // Also remove from s3SelectedVars
              const vn = chip.dataset.varName;
              state.s3SelectedVars = (state.s3SelectedVars || []).filter(x => x !== vn);
              renderManualChips();
            });
          });
        }
        // 恢复已有的手动变量
        renderManualChips();
        manualInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const val = manualInput.value.trim();
            if (!val) return;
            state.s3ManualVars = state.s3ManualVars || [];
            if (!state.s3ManualVars.includes(val)) {
              state.s3ManualVars.push(val);
              state.s3SelectedVars = state.s3SelectedVars || [];
              if (!state.s3SelectedVars.includes(val)) state.s3SelectedVars.push(val);
            }
            manualInput.value = "";
            renderManualChips();
          }
        });
      });
      // 返回第3步时，自动恢复已解析的变量选择状态
      if (state.s3VarsParsed) {
        document.getElementById("parse_vars_btn").click();
      }
    }
  }

  /* ---------- Stata variable parser ---------- */
  function parseStataVars(cmd) {
    // Remove leading/trailing whitespace
    cmd = cmd.trim();
    if (!cmd) return [];

    // Strip options after comma (but preserve if inside quotes)
    let body = cmd;
    const commaIdx = findOptionComma(cmd);
    if (commaIdx >= 0) body = cmd.substring(0, commaIdx);

    // Known Stata estimation commands
    const estCmds = /^(reg|regress|logit|probit|ologit|mlogit|tobit|pnorm|qreg|rreg|xtreg|xtlogit|xtprobit|xttobit|reghdfe|areg|ivregr?|ivregress|ivreg2|xtivreg|xtivreg2|ppmlhdfe|poisson|nbreg|zip|zinb|glm|mixed|melogit|meprobit|meqrlogit|manova|anova|mvreg|sureg|system|cmp|etregre|teffects?|rdrobust|did\_regress|csdid|xtdidregress)\b/i;

    const m = body.match(estCmds);
    if (!m) return [];

    // Get the part after the command name
    const afterCmd = body.substring(m[0].length).trim();
    if (!afterCmd) return [];

    // Split by space, filter out empty and known non-variable tokens
    const tokens = afterCmd.split(/\s+/)
      .map(t => t.replace(/[,;]$/, ""))   // trailing punctuation
      .filter(t => t && !/^i\.|^c\.#/.test(t)); // remove factor notation prefix but keep var name

    // Filter out common Stata keywords / operators that aren't variables
    const skip = new Set([
      "if","in","for","by","bysort","sort","replace","generate","gen",
      "drop","keep","rename","label","format","merge","append","reshape",
      "collapse","expand","fillin","split","destring","encode","decode",
      "noconstant","noc","robust","r","cluster","vce","level","beta",
      "fe","re","be","mle","absorb","partial","partiall","kernel",
      "weight","pweights","fweights","aweights","iweights","aw","fw","iw","pw",
      "predict","estat","test","lincom","nlcom","margins","marginal",
      "quietly","capture","preserve","restore","version","set","local",
      "global","macro","syntax","program","end","foreach","forvalues","while",
      "return","ereturn","scalar","matrix","tempname","tempfile",
      "using","clear","first","last","unique","sort","stable"
    ]);

    return tokens.filter(t => !skip.has(t.toLowerCase()) && /^[a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*$/.test(t));
  }

  function findOptionComma(s) {
    // Find first comma not inside parentheses or quotes
    let depth = 0, inQ = false;
    for (let i = 0; i < s.length; i++) {
      switch (s[i]) {
        case '"': case "'": inQ = !inQ; break;
        case '(': depth++; break;
        case ')': depth--; break;
        case ',': if (!inQ && depth === 0) return i;
      }
    }
    return -1;
  }

  function truncateCmd(s, maxLen) {
    maxLen = maxLen || 50;
    return s.length > maxLen ? s.substring(0, maxLen) + "…" : s;
  }

  function wireCmdRemove(btn) {
    btn.addEventListener("click", () => {
      btn.parentElement.remove();
    });
  }

  function renderStep4() {
    const b = state.biz;
    let html = `<div class="stage"><div class="card">
      ${header(b, "第 4 步 / 共 7 步 · 描述你的需求")}`;
    const t = b.step4.type;

    if (t === "significance") {
      const vars = state.s3SelectedVars || [];
      if (vars.length) {
        html += `<div class="section-label">请为你选择的每个变量指定要调整的显著性<span style="color:#d4380d">（必填）</span></div>`;
        html += vars.map((v, i) => `
          <div class="sig-var-block" data-var="${esc(v)}" data-i="${i}">
            <div class="sig-var-name">变量：<code>${esc(v)}</code></div>
            <div class="section-label">显著性方向</div>
            <label class="opt sig-dir-opt"><input type="radio" class="sig-dir" name="sig_dir_${i}" value="pos"><span>调整为正向显著</span></label>
            <label class="opt sig-dir-opt"><input type="radio" class="sig-dir" name="sig_dir_${i}" value="neg"><span>调整为负向显著</span></label>
            <label class="opt sig-dir-opt"><input type="radio" class="sig-dir" name="sig_dir_${i}" value="none"><span>调整为不显著</span></label>
            <div class="sig-level-wrap" data-i="${i}"></div>
          </div>`).join("");
      } else {
        html += `<div class="var-empty">未检测到已选变量。你可在第 3 步解析并选择变量后返回本步，或直接在下方的其他调整项中说明需求。</div>`;
      }
      html += `<div class="section-label" style="margin-top:18px">其他调整项（可多选）</div>
        <div class="sig-hint">如果还需要调整工具变量、平行趋势，或有其他额外需求，请在下方勾选并注明。</div>
        <label class="opt"><input type="checkbox" name="sig_extra" value="iv"><span>工具变量</span></label>
        <label class="opt"><input type="checkbox" name="sig_extra" value="parallel"><span>平行趋势</span></label>
        <label class="opt"><input type="checkbox" name="sig_extra" value="other"><span>其他（可备注额外需求）</span></label>
        <div id="sig_extra_other_wrap"></div>
        <div class="section-label" style="margin-top:18px">补充说明（选填，但强烈建议填写）</div>
        <textarea name="sig_note" placeholder="例如：希望 y 对 x 的系数正向显著在 5% 水平；目前回归结果 t 值约 1.2；数据为面板数据等。"></textarea>`;
    } else if (t === "doit") {
      html += `<div class="section-label">勾选你要做的工作量，并填写个数（可补充额外需求）</div>`;
      b.step4.items.forEach((it) => {
        html += `<div class="doit-row">
          <label class="opt inline"><input type="checkbox" name="doit_sel" value="${it.key}"><span>${esc(it.label)}</span></label>
          <div class="doit-inputs">
            <input type="number" min="0" class="num-input" data-count="${it.key}" placeholder="个数" />
            <input type="text" class="extra-input" data-extra="${it.key}" placeholder="额外需求（选填）" />
          </div>
        </div>`;
      });
    } else if (t === "qa") {
      html += `<div class="section-label">请输入你的疑问</div>
        <textarea name="qa_text" placeholder="请描述你的疑问或想确认的点..."></textarea>`;
    } else if (t === "indicator") {
      html += `<div class="section-label">上传材料（图片 / PDF / Word 等，可多选）或描述需求</div>
        <div class="file-drop" id="drop">点击上传文件，可多选</div>
        <input type="file" id="fileInput" multiple hidden />
        <div class="file-list" id="fileList"></div>
        <textarea name="ind_text" placeholder="或在此描述你要构建的指标..."></textarea>`;
    } else if (t === "did") {
      html += `<div class="section-label">请选择你需要的双重差分项目</div>` +
        b.step4.items.map((it) => optCheck("did_opt", it, it)).join("") +
        `<div id="did_other_wrap"></div>`;
    } else if (t === "iv") {
      const ivs = [["weak",IVT.weak],["first",IVT.first],["second",IVT.second],["other",IVT.other]];
      html += `<div class="section-label">请选择工具变量服务类型（可多选）</div>` +
        ivs.map((p) => optCheck("iv_type", p[0], p[1])).join("") +
        `<div id="iv_first_wrap"></div><div id="iv_second_wrap"></div><div id="iv_other_wrap"></div>`;
    } else if (t === "other") {
      html += `<div class="section-label">请描述你的需求</div>
        <textarea name="other_text" placeholder="请描述你的具体需求..."></textarea>`;
    }

    html += `</div></div>`;
    $app.innerHTML = html;
    wireStep4(t);
    setNav({ back: { text: "返回", fn: () => go(3) }, next: { text: "确定", fn: () => { gatherS4(); if (validateS4()) go(5); } } });
  }

  function wireStep4(t) {
    if (t === "significance") {
      // 每个变量的方向选择 → 正向/负向后展开显著性水平
      $app.querySelectorAll('.sig-var-block').forEach((block) => {
        const i = block.dataset.i;
        block.querySelectorAll('.sig-dir').forEach((r) =>
          r.addEventListener("change", () => {
            const lw = block.querySelector('.sig-level-wrap');
            if (r.value === "pos" || r.value === "neg") {
              lw.innerHTML = `<div class="section-label">显著性水平</div>` +
                ["1", "5", "10"].map((l) =>
                  `<label class="opt"><input type="radio" class="sig-level" name="sig_level_${i}" value="${l}"><span>${SIGL[l]}</span></label>`
                ).join("");
            } else {
              lw.innerHTML = "";
            }
          })
        );
      });
      // 底部其他调整项：勾选「其他」时展开备注框
      const extraOtherWrap = document.getElementById("sig_extra_other_wrap");
      $app.querySelectorAll('input[name="sig_extra"]').forEach((c) =>
        c.addEventListener("change", () => {
          const hasOther = !!$app.querySelector('input[name="sig_extra"][value="other"]:checked');
          extraOtherWrap.innerHTML = hasOther
            ? `<div class="section-label">请补充其他额外需求</div><textarea name="sig_extra_other" placeholder="请描述你的其他调整需求..."></textarea>`
            : "";
        })
      );
    } else if (t === "indicator") {
      const drop = $app.querySelector("#drop");
      const input = $app.querySelector("#fileInput");
      const list = $app.querySelector("#fileList");
      drop.addEventListener("click", () => input.click());
      input.addEventListener("change", () => {
        Array.from(input.files).forEach((f) => {
          const rd = new FileReader();
          rd.onload = () => {
            state.files.push({ name: f.name, size: f.size, type: f.type, data: rd.result });
            renderFileList(list);
          };
          rd.readAsDataURL(f);
        });
        input.value = "";
      });
    } else if (t === "did") {
      $app.querySelector('input[name="did_opt"][value="其他"]').addEventListener("change", (e) => {
        const ow = document.getElementById("did_other_wrap");
        ow.innerHTML = e.target.checked
          ? `<div class="section-label">请说明</div><textarea name="did_other" placeholder="请描述其他双重差分需求..."></textarea>`
          : "";
      });
    } else if (t === "iv") {
      function renderIvDetails() {
        const fw = document.getElementById("iv_first_wrap");
        const sw = document.getElementById("iv_second_wrap");
        const ow = document.getElementById("iv_other_wrap");
        const hasFirst = !!$app.querySelector('input[name="iv_type"][value="first"]:checked');
        const hasSecond = !!$app.querySelector('input[name="iv_type"][value="second"]:checked');
        const hasOther = !!$app.querySelector('input[name="iv_type"][value="other"]:checked');
        if (hasFirst) {
          fw.innerHTML = `<div class="iv-sub"><div class="section-label">第一阶段显著性</div>` +
            `<div class="section-label" style="margin-top:10px">显著性方向</div>` +
            [["pos",IVD.pos],["neg",IVD.neg]].map((p) => optRadio("iv_dir_first", p[0], p[1])).join("") +
            `<div class="section-label" style="margin-top:10px">显著性水平</div>` +
            ["1", "5", "10"].map((l) => optRadio("iv_level_first", l, SIGL[l])).join("") + `</div>`;
        } else { fw.innerHTML = ""; }
        if (hasSecond) {
          sw.innerHTML = `<div class="iv-sub"><div class="section-label">第二阶段显著性</div>` +
            `<div class="section-label" style="margin-top:10px">显著性方向</div>` +
            [["pos",IVD.pos],["neg",IVD.neg]].map((p) => optRadio("iv_dir_second", p[0], p[1])).join("") +
            `<div class="section-label" style="margin-top:10px">显著性水平</div>` +
            ["1", "5", "10"].map((l) => optRadio("iv_level_second", l, SIGL[l])).join("") + `</div>`;
        } else { sw.innerHTML = ""; }
        if (hasOther) {
          ow.innerHTML = `<div class="section-label">请说明其他工具变量需求</div>
            <textarea name="iv_other_text" placeholder="请描述..."></textarea>`;
        } else { ow.innerHTML = ""; }
      }
      $app.querySelectorAll('input[name="iv_type"]').forEach((r) =>
        r.addEventListener("change", renderIvDetails)
      );
    }
  }

  function renderFileList(list) {
    if (!list) return;
    list.innerHTML = state.files
      .map((f, i) => `<div class="file-chip">${esc(f.name)}<span class="x" data-i="${i}">✕</span></div>`)
      .join("");
    list.querySelectorAll(".x").forEach((x) =>
      x.addEventListener("click", () => {
        state.files.splice(Number(x.dataset.i), 1);
        renderFileList(list);
      })
    );
  }

  function renderStep5() {
    const lines = summarize();
    let html = `<div class="stage"><div class="card">
      <div class="step-kicker">第 5 步 / 共 7 步</div>
      <div class="step-title">确认你的需求</div>
      <div class="section-label">需求清单</div>
      <div class="review-list">` +
      (lines.length
        ? lines.map((l) => `<div class="review-item"><span class="rl">${esc(l.label)}</span><span class="rv">${esc(l.value)}</span></div>`).join("")
        : `<div class="review-item"><span class="rv">（暂无内容）</span></div>`) +
      `</div>
      <div class="section-label">以上需求是否正确？</div>` +
      [["correct","正确"],["wrong","错误"],["other","其他"]].map((p) => optRadio("review_choice", p[0], p[1])).join("") +
      `<div id="review_fix_wrap"></div>
    </div></div>`;
    $app.innerHTML = html;
    $app.querySelectorAll('input[name="review_choice"]').forEach((r) =>
      r.addEventListener("change", (e) => {
        const fw = document.getElementById("review_fix_wrap");
        fw.innerHTML = e.target.value !== "correct"
          ? `<div class="section-label">请说明需要修正的地方</div><textarea name="review_fix" placeholder="请说明哪里需要修改..."></textarea>`
          : "";
      })
    );
    setNav({ back: { text: "返回", fn: () => go(4) }, next: { text: "确定", fn: () => {
      gatherReview();
      if (!state.review.choice) { showTip("请先确认上方需求清单是否正确"); return; }
      go(6);
    } } });
  }

  function renderStep6() {
    const b = state.biz;
    $app.innerHTML = `<div class="stage"><div class="card">
      <div class="step-kicker">第 6 步 / 共 7 步</div>
      <div class="step-title">你需要提交什么文件</div>
      <div class="step-detail">${b.step6}</div>
      <div class="thanks">感谢您的配合！</div>
    </div></div>`;
    setNav({ back: { text: "返回", fn: () => go(5) }, next: { text: "确定", fn: () => {
      // state.s6Files 已统一为 {name,size,type,data(base64)}，直接下一步
      go(7);
    } } });

    // Wire step 6 file upload area
    const uploadArea = document.getElementById("step6_upload_area");
    if (uploadArea) {
      state.s6Files = state.s6Files || [];
      uploadArea.innerHTML =
        `<div class="s6-upload-area">` +
        `<button type="button" class="s6-upload-btn" id="s6_upload_btn">📎 选择文件${window.__WX_READY__ ? "（从微信聊天）" : ""}</button>` +
        `<input type="file" id="s6_file_input" multiple accept=".dta,.xlsx,.xls,.csv,.do,.pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar" style="display:none">` +
        `<div class="s6-file-list" id="s6_file_list"></div>` +
        `</div>`;

      const btn = document.getElementById("s6_upload_btn");
      const input = document.getElementById("s6_file_input");
      const listEl = document.getElementById("s6_file_list");

      // Render existing files (when returning from step 7)
      function renderS6Files() {
        if (!state.s6Files || !state.s6Files.length) { listEl.innerHTML = ""; return; }
        listEl.innerHTML = state.s6Files.map((f, i) =>
          `<div class="s6-file-item">` +
          `<span class="s6-file-name" title="${esc(f.name)}">${esc(f.name)}</span>` +
          `<span class="s6-file-size">${formatSize(f.size)}</span>` +
          `<button type="button" class="s6-file-del" data-idx="${i}" title="移除">✕</button>` +
          `</div>`
        ).join("");
        listEl.querySelectorAll(".s6-file-del").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = +btn.dataset.idx;
            state.s6Files.splice(idx, 1);
            renderS6Files();
          });
        });
      }

      // 把 File 对象转 base64 存入 state.s6Files
      function pushFileAsBase64(f) {
        const reader = new FileReader();
        reader.onload = () => {
          state.s6Files.push({ name: f.name, size: f.size, type: f.type, data: reader.result });
          renderS6Files();
        };
        reader.readAsDataURL(f);
      }

      // 点击「选择文件」：微信环境走 wx.chooseMessageFile，否则走标准 input
      btn.addEventListener("click", () => {
        if (window.__WX_READY__ && typeof wx !== "undefined" && wx.chooseMessageFile) {
          wx.chooseMessageFile({
            count: 20,
            type: "file",
            success: (res) => {
              (res.tempFiles || []).forEach((tf) => {
                const fp = tf.path || tf.tempFilePath;
                wx.getFileSystemManager().readFile({
                  filePath: fp,
                  encoding: "base64",
                  success: (r) => {
                    state.s6Files.push({
                      name: tf.name,
                      size: tf.size,
                      type: "",
                      data: "data:application/octet-stream;base64," + r.data,
                    });
                    renderS6Files();
                  },
                  fail: () => showTip("该文件读取失败，请重试或改用其他文件"),
                });
              });
            },
            fail: () => { /* 用户取消，忽略 */ },
          });
        } else {
          input.click();
        }
      });

      input.addEventListener("change", () => {
        Array.from(input.files).forEach(pushFileAsBase64);
        input.value = ""; // reset so same file can be re-added if removed
      });

      renderS6Files();
    }
  }

  function renderStep7() {
    const b = state.biz;
    $app.innerHTML = `<div class="stage"><div class="card">
      <div class="step-kicker">第 7 步 / 共 7 步</div>
      <div class="step-title">最后一步</div>
      <div class="step-detail">你已了解大致流程。确认后，我会收到你的需求清单并尽快联系你。</div>
      <div class="final-card">
        <div class="final-biz">${b.emoji} ${esc(b.name)}</div>
      </div>
    </div></div>`;
    setNav({
      back: { text: "再看看", fn: () => go(2) },
      next: { text: "我已知晓，确认做！", fn: submit },
    });
  }

  /* ---------- 校验 ---------- */
  function validateS4() {
    const t = state.biz.step4.type;
    if (t === "significance") {
      const vars = state.s3SelectedVars || [];
      const s4vars = state.s4.vars || [];
      if (vars.length) {
        for (const v of vars) {
          const cfg = s4vars.find((x) => x.name === v);
          if (!cfg || !cfg.dir) {
            showTip("请为变量 " + v + " 选择显著性方向（正向/负向/不显著）");
            return false;
          }
          if ((cfg.dir === "pos" || cfg.dir === "neg") && !cfg.level) {
            showTip("请为变量 " + v + " 选择显著性水平（1% / 5% / 10%）");
            return false;
          }
        }
      }
    }
    return true;
  }

  /* ---------- 收集与提交 ---------- */
  function gatherS4() {
    // 仅在第4步表单存在时收集，避免提交（第7步）时 DOM 已不存在，把已保存的需求清空
    if (state.step !== 4) return;
    const t = state.biz.step4.type;
    if (t === "significance") {
      const vars = [];
      $app.querySelectorAll('.sig-var-block').forEach((block) => {
        const dirEl = block.querySelector('.sig-dir:checked');
        const dir = dirEl ? dirEl.value : "";
        const o = { name: block.dataset.var, dir };
        if (dir === "pos" || dir === "neg") {
          const lvl = block.querySelector('.sig-level:checked');
          o.level = lvl ? lvl.value : "";
        }
        vars.push(o);
      });
      const extras = [];
      $app.querySelectorAll('input[name="sig_extra"]:checked').forEach((c) => extras.push(c.value));
      const o = { type: "significance", vars, extras };
      if (extras.includes("other")) o.extraOther = val('textarea[name="sig_extra_other"]');
      o.note = val('textarea[name="sig_note"]');
      state.s4 = o;
    } else if (t === "doit") {
      const items = {};
      state.biz.step4.items.forEach((it) => {
        const sel = document.querySelector(`input[name="doit_sel"][value="${it.key}"]`).checked;
        if (sel) items[it.key] = { count: val(`input[data-count="${it.key}"]`), extra: val(`input[data-extra="${it.key}"]`) };
      });
      state.s4 = { type: "doit", items };
    } else if (t === "qa") {
      state.s4 = { type: "qa", qaText: val('textarea[name="qa_text"]') };
    } else if (t === "indicator") {
      state.s4 = { type: "indicator", indText: val('textarea[name="ind_text"]') };
    } else if (t === "did") {
      const sel = [];
      $app.querySelectorAll('input[name="did_opt"]:checked').forEach((c) => sel.push(c.value));
      const o = { type: "did", selected: sel };
      if (sel.includes("其他")) o.other = val('textarea[name="did_other"]');
      state.s4 = o;
    } else if (t === "iv") {
      const ivTypes = [];
      $app.querySelectorAll('input[name="iv_type"]:checked').forEach((c) => ivTypes.push(c.value));
      const o = { type: "iv", ivTypes };
      if (ivTypes.includes("first")) {
        o.firstDir = checkedVal('input[name="iv_dir_first"]');
        o.firstLevel = checkedVal('input[name="iv_level_first"]');
      }
      if (ivTypes.includes("second")) {
        o.secondDir = checkedVal('input[name="iv_dir_second"]');
        o.secondLevel = checkedVal('input[name="iv_level_second"]');
      }
      if (ivTypes.includes("other")) o.ivOther = val('textarea[name="iv_other_text"]');
      state.s4 = o;
    } else if (t === "other") {
      state.s4 = { type: "other", otherText: val('textarea[name="other_text"]') };
    }
  }

  function gatherReview() {
    // 仅在第5步表单存在时收集，避免提交（第7步）时 DOM 已不存在，把已保存的确认清空
    if (state.step !== 5 || !document.querySelector('input[name="review_choice"]')) return;
    const choice = checkedVal('input[name="review_choice"]');
    const o = { choice };
    if (choice && choice !== "correct") o.fix = val('textarea[name="review_fix"]');
    state.review = o;
  }

  function buildPayload() {
    const lines = summarize();
    // Merge step4 files + step6 files
    const allFiles = [...(state.files || []), ...(state.s6Files || [])];
    return {
      businessId: state.biz.id,
      business: state.biz.name,
      price: state.biz.price,
      commands: state.s3Commands || [],
      selectedVars: state.s3SelectedVars || [],
      demand: state.s4,
      demandSummary: lines.map((l) => l.label + "：" + l.value),
      review: state.review,
      step6: state.biz.step6,
      files: allFiles,
      submittedAt: new Date().toISOString(),
    };
  }

  // 把 base64（dataURL）转回 Blob，用于随表单真实上传文件
  function dataUrlToBlob(dataUrl) {
    try {
      const m = String(dataUrl).match(/^data:([^;]+);base64,(.*)$/);
      const mime = m ? m[1] : "application/octet-stream";
      const b64 = m ? m[2] : dataUrl;
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) {
      return null;
    }
  }

  function submit() {
    try {
      gatherS4();
      gatherReview();
    } catch(e) { /* 步骤4/5 DOM已不存在时忽略 */ }
    if (!state.review || !state.review.choice) {
      showTip("请先返回第 5 步，确认需求清单是否正确");
      return;
    }
    const payload = buildPayload();

    const done = () => showDone();

    // 方案A：配置了第三方表单服务（Web3Forms）→ 直接 POST 文字需求 + 真实文件过去，无需自建后端
    const endpoint = (window.APP_CONFIG && window.APP_CONFIG.formEndpoint) || "";
    if (endpoint) {
      const lines = payload.demandSummary || [];
      const review = payload.review || {};
      const reviewMap = { correct: "正确", wrong: "错误，需修改", other: "其他" };
      const reviewSummary = (reviewMap[review.choice] || "未确认") + (review.choice && review.choice !== "correct" && review.fix ? "：" + review.fix : "");

      // 收集所有文件（第4步指标构建 + 第6步），并真实上传
      const allFiles = [...(state.files || []), ...(state.s6Files || [])];
      const MAX_FILE = 2 * 1024 * 1024;   // 单文件上限（Web3Forms 免费档约 2MB/文件）
      const MAX_TOTAL = 8 * 1024 * 1024;  // 附件总大小上限
      let used = 0;
      const bigFiles = [];

      const fd = new FormData();
      fd.append("access_key", (window.APP_CONFIG && window.APP_CONFIG.formAccessKey) || "");
      fd.append("from_name", (window.APP_CONFIG && window.APP_CONFIG.brand) || "StataBro 服务引导");
      fd.append("botcheck", "");
      fd.append("_subject", "新需求提交：" + (payload.business || ""));
      fd.append("business", payload.business || "");
      fd.append("price", payload.price || "");
      fd.append("commands", (payload.commands || []).join("\n"));
      fd.append("selectedVars", (payload.selectedVars || []).join("、"));
      fd.append("demand", JSON.stringify(payload.demand || {}, null, 2));
      fd.append("review", JSON.stringify(payload.review || {}, null, 2));
      fd.append("reviewSummary", reviewSummary);
      fd.append("demandSummary", lines.join("\n"));

      (allFiles || []).forEach((f) => {
        if (!f || !f.data) { bigFiles.push(f); return; }
        const blob = dataUrlToBlob(f.data);
        if (blob && f.size <= MAX_FILE && used + f.size <= MAX_TOTAL) {
          fd.append("attachment", blob, f.name || "file");
          used += f.size;
        } else {
          bigFiles.push(f);
        }
      });

      if (allFiles.length) {
        const smallNote = allFiles.filter((f) => !bigFiles.includes(f))
          .map((f) => f.name + " (" + formatSize(f.size) + ")").join("、");
        const bigNote = bigFiles.length
          ? "以下大文件请通过微信发送：" + bigFiles.map((f) => f.name + " (" + formatSize(f.size) + ")").join("、")
          : "";
        fd.append("files", (smallNote ? "已上传：" + smallNote + "\n" : "") + bigNote);
      } else {
        fd.append("files", "无（文件请客户直接微信发）");
      }
      fd.append("submittedAt", payload.submittedAt);

      fetch(endpoint, { method: "POST", body: fd })
        .then((r) => (r.ok ? r.json() : { success: false }))
        .then((j) => { if (!j.success) console.warn("Web3Forms 提交返回：", j.message || "未知错误"); })
        .catch((e) => console.warn("Web3Forms 提交失败：", e))
        .finally(done);
      return;
    }

    // 方案B：自带 Node 后端（含完整文件 base64）
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(API + "/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
      .then((r) => {
        clearTimeout(timer);
        if (!r.ok) throw new Error("submit failed");
        return r.json();
      })
      .catch((err) => {
        clearTimeout(timer);
        console.warn("提交说明:", err.message || err);
      })
      .finally(done);
  }

  function showDone() {
    clearProgress();
    const d = C.done;
    state.step = TOTAL + 1;
    $bar.style.width = "100%";
    $count.textContent = "已完成";
    $app.innerHTML = `<div class="stage"><div class="card done-box">
      <div class="done-icon">✓</div>
      <h1>${esc(d.title)}</h1>
      <p>${esc(d.body)}</p>
    </div></div>`;
    setNav({ back: null, next: { text: "返回首页", fn: () => { state.step = 1; render(); window.scrollTo(0, 0); } } });
  }

  /* ---------- 进度持久化（localStorage，切出/重进自动恢复） ---------- */
  const STORAGE_KEY = "statabro_onboarding_v1";
  function saveProgress() {
    if (state.step === 1 && !state.biz) { clearProgress(); return; } // 尚未开始，不留草稿
    try {
      const snap = {
        step: state.step,
        bizId: state.biz ? state.biz.id : null,
        s4: state.s4,
        files: state.files,
        review: state.review,
        s3Commands: state.s3Commands,
        s3SelectedVars: state.s3SelectedVars,
        s3VarsParsed: state.s3VarsParsed,
        s3ManualVars: state.s3ManualVars,
        s6Files: state.s6Files,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch (e) {
      // 容量超限（多为大文件 base64）：去掉文件字段后重试，至少保留表单进度
      try {
        const snap = {
          step: state.step,
          bizId: state.biz ? state.biz.id : null,
          s4: state.s4,
          review: state.review,
          s3Commands: state.s3Commands,
          s3SelectedVars: state.s3SelectedVars,
          s3VarsParsed: state.s3VarsParsed,
          s3ManualVars: state.s3ManualVars,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
      } catch (_) { /* 放弃保存 */ }
    }
  }
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const snap = JSON.parse(raw);
      if (!snap || typeof snap.step !== "number") return null;
      if (snap.bizId) {
        const b = C.businesses.find((x) => x.id === snap.bizId);
        if (!b) return null; // 业务配置已变更，放弃恢复
        state.biz = b;
      }
      state.step = Math.min(TOTAL, Math.max(1, snap.step));
      state.s4 = snap.s4 || {};
      state.files = snap.files || [];
      state.review = snap.review || { choice: null, fix: "" };
      state.s3Commands = snap.s3Commands || [];
      state.s3SelectedVars = snap.s3SelectedVars || [];
      state.s3VarsParsed = !!snap.s3VarsParsed;
      state.s3ManualVars = snap.s3ManualVars || [];
      state.s6Files = snap.s6Files || [];
      return snap;
    } catch (_) { return null; }
  }
  function clearProgress() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }
  function showRestoreBanner(savedStep) {
    let bar = document.getElementById("restore_bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "restore_bar";
      bar.className = "restore-bar";
      document.body.appendChild(bar);
    }
    bar.innerHTML =
      '<div class="restore-inner">' +
      '<span class="restore-text">已为您恢复上次填写的进度（第 ' + savedStep + ' 步），无需从头开始。</span>' +
      '<button type="button" class="restore-btn restore-cont" id="restoreCont">继续填写</button>' +
      '<button type="button" class="restore-btn restore-reset" id="restoreReset">重新开始</button>' +
      '</div>';
    bar.classList.add("show");
    bar.querySelector("#restoreCont").addEventListener("click", () => bar.classList.remove("show"));
    bar.querySelector("#restoreReset").addEventListener("click", () => {
      clearProgress();
      state.step = 1;
      state.biz = null;
      state.s4 = {};
      state.files = [];
      state.s6Files = [];
      state.review = { choice: null, fix: "" };
      state.s3Commands = [];
      state.s3SelectedVars = [];
      state.s3VarsParsed = false;
      state.s3ManualVars = [];
      bar.classList.remove("show");
      go(1);
    });
  }

  /* ---------- 微信 JS-SDK 初始化（用于 wx.chooseMessageFile 从会话选文件） ---------- */
  // 页面初始时向后端取签名并 wx.config；成功后置 window.__WX_READY__ = true
  // 仅在微信环境、且进入第6步前按需异步加载微信 JS-SDK，避免非微信环境首屏被阻塞
  function loadWxScript() {
    return new Promise((resolve) => {
      if (typeof wx !== "undefined") { resolve(true); return; }
      const s = document.createElement("script");
      s.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false); // 加载失败也不阻塞，走标准 input
      document.head.appendChild(s);
    });
  }

  function initWx() {
    if (!/micromessenger/i.test(navigator.userAgent)) return; // 非微信环境直接跳过，绝不加载 jweixin
    loadWxScript().then((ok) => {
      if (!ok || typeof wx === "undefined") return; // 加载失败，降级为标准 input
      const pageUrl = location.href.split("#")[0];
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000); // 5 秒超时，避免请求挂起
      fetch(API + "/api/wx/jssdk-config?url=" + encodeURIComponent(pageUrl), { signal: ctrl.signal })
        .then((r) => r.json())
        .then((cfg) => {
          clearTimeout(timer);
          if (!cfg || !cfg.ok || !cfg.enabled) return; // 后端未配置，走标准 input
          wx.config({
            debug: false,
            appId: cfg.appId,
            timestamp: cfg.timestamp,
            nonceStr: cfg.nonceStr,
            signature: cfg.signature,
            jsApiList: ["chooseMessageFile"],
          });
          wx.ready(() => { window.__WX_READY__ = true; });
          wx.error(() => { window.__WX_READY__ = false; });
        })
        .catch(() => { clearTimeout(timer); }); // 忽略，走标准 input
    });
  }
  initWx();

  const savedState = loadProgress();
  if (savedState && savedState.step >= 2) {
    showRestoreBanner(savedState.step);
  }
  render();
})();
