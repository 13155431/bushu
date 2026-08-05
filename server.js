/* ============================================================
 *  Stata 实证计量 · 客户引导小程序 后端
 *  纯 Node（零依赖）。启动： node server.js
 *  网页： http://localhost:PORT  (PORT 默认 3000，可用环境变量 PORT 覆盖)
 *  后台： http://localhost:PORT/admin  (输入 ADMIN_TOKEN 查看需求清单)
 *
 *  数据存放在 ./data 目录：
 *    data/index.json                —— 需求清单索引（不含大文件内容）
 *    data/submissions/<id>.json     —— 单条需求完整数据
 *    data/submissions/<id>/files/   —— 客户上传的附件（已解码）
 * ============================================================ */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
// 数据目录可被环境变量覆盖，方便在 Railway/Render 上挂载持久卷（如 DATA_DIR=/data）
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const SUB_DIR = path.join(DATA_DIR, "submissions");
const INDEX_FILE = path.join(DATA_DIR, "index.json");

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "statabro2026";

// 微信 JS-SDK 配置（从环境变量读取；留空则不启用 wx.chooseMessageFile）
// 开启后，微信内置浏览器里点「选择文件」会调起 wx.chooseMessageFile，
// 可直接从微信「聊天会话」里选文件（iOS/Android 均支持，不受标准 <input file> 限制）。
//
// 启用步骤（一次性）：
//   1) 准备一个【已认证】的公众号/服务号，拿到 AppID 和 AppSecret
//   2) 公众号后台 → 公众号设置 → 功能设置 → 填写「JS接口安全域名」= 你的部署域名（如 onb.example.com，不要带 http）
//   3) 服务器放行 80/443，用 https 部署（微信要求 JS 安全域名为 https）
//   4) 启动时注入环境变量： WX_APPID=xxx WX_APPSECRET=yyy node server.js
//   未配置时，前端自动降级为标准 <input type=file>（Android 微信仍可选聊天文件，iOS 仅图片）
const WX_APPID = process.env.WX_APPID || "";
const WX_APPSECRET = process.env.WX_APPSECRET || "";

// 内存缓存：access_token / jsapi_ticket（有效期 2 小时，提前 5 分钟过期）
let _tokenCache = { value: "", expire: 0 };
let _ticketCache = { value: "", expire: 0 };

function wxGetAccessToken() {
  return new Promise((resolve, reject) => {
    if (WX_APPID && Date.now() < _tokenCache.expire) return resolve(_tokenCache.value);
    const url =
      "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" +
      WX_APPID +
      "&secret=" +
      WX_APPSECRET;
    http
      .get(url, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => {
          try {
            const j = JSON.parse(d);
            if (j.access_token) {
              _tokenCache = { value: j.access_token, expire: Date.now() + 115 * 1000 };
              resolve(j.access_token);
            } else reject(new Error(j.errmsg || "get access_token failed"));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function wxGetJsapiTicket(token) {
  return new Promise((resolve, reject) => {
    if (Date.now() < _ticketCache.expire) return resolve(_ticketCache.value);
    const url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=" + token + "&type=jsapi";
    http
      .get(url, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => {
          try {
            const j = JSON.parse(d);
            if (j.ticket) {
              _ticketCache = { value: j.ticket, expire: Date.now() + 115 * 1000 };
              resolve(j.ticket);
            } else reject(new Error(j.errmsg || "get ticket failed"));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function wxJssdkConfig(req, res) {
  if (!WX_APPID || !WX_APPSECRET) {
    return sendJson(res, 200, { ok: false, enabled: false, error: "未配置 WX_APPID / WX_APPSECRET" });
  }
  const u = new URL(req.url, "http://localhost");
  const pageUrl = u.searchParams.get("url") || "";
  const noncestr = crypto.randomBytes(8).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000);
  wxGetAccessToken()
    .then(wxGetJsapiTicket)
    .then((ticket) => {
      const raw = "jsapi_ticket=" + ticket + "&noncestr=" + noncestr + "&timestamp=" + timestamp + "&url=" + pageUrl;
      const signature = crypto.createHash("sha1").update(raw).digest("hex");
      sendJson(res, 200, {
        ok: true,
        enabled: true,
        appId: WX_APPID,
        timestamp,
        nonceStr: noncestr,
        signature,
      });
    })
    .catch((e) => sendJson(res, 200, { ok: false, enabled: false, error: String(e.message || e) }));
}

fs.mkdirSync(SUB_DIR, { recursive: true });
if (!fs.existsSync(INDEX_FILE)) fs.writeFileSync(INDEX_FILE, "[]", "utf8");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}
function authOk(token) {
  return typeof token === "string" && token.length > 0 && token === ADMIN_TOKEN;
}
function safeName(name) {
  return path.basename(String(name || "file")).replace(/[^一-龥a-zA-Z0-9._-]/g, "_");
}
function readIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  } catch {
    return [];
  }
}
function writeIndex(arr) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(arr, null, 2), "utf8");
}

/* ---------- 处理提交 ---------- */
function handleSubmit(req, res) {
  let raw = "";
  let tooBig = false;
  req.on("data", (c) => {
    raw += c;
    if (raw.length > 40 * 1024 * 1024) {
      tooBig = true;
      req.destroy();
    }
  });
  req.on("end", () => {
    if (tooBig) return sendJson(res, 413, { ok: false, error: "payload too large" });
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return sendJson(res, 400, { ok: false, error: "invalid json" });
    }
    const id = Date.now().toString(36) + crypto.randomBytes(3).toString("hex");
    const files = Array.isArray(payload.files) ? payload.files : [];
    const savedFiles = [];
    if (files.length) {
      const fdir = path.join(SUB_DIR, id, "files");
      fs.mkdirSync(fdir, { recursive: true });
      files.forEach((f) => {
        if (!f || !f.data) return;
        const b64 = String(f.data).split(",")[1];
        if (!b64) return;
        const fname = safeName(f.name);
        try {
          fs.writeFileSync(path.join(fdir, fname), Buffer.from(b64, "base64"));
          savedFiles.push({ name: fname, size: f.size, type: f.type });
        } catch (e) {
          /* 忽略单个文件写入失败 */
        }
      });
    }
    const record = {
      id,
      submittedAt: payload.submittedAt || new Date().toISOString(),
      business: payload.business || "",
      businessId: payload.businessId || "",
      price: payload.price || "",
      demand: payload.demand || {},
      demandSummary: payload.demandSummary || [],
      review: payload.review || {},
      step6: payload.step6 || "",
      files: savedFiles,
    };
    fs.writeFileSync(path.join(SUB_DIR, id + ".json"), JSON.stringify(record, null, 2), "utf8");
    const index = readIndex();
    index.unshift({
      id,
      submittedAt: record.submittedAt,
      business: record.business,
      review: record.review.choice || "",
      fileCount: savedFiles.length,
    });
    writeIndex(index);
    sendJson(res, 200, { ok: true, id });
  });
}

/* ---------- 处理后台读取 ---------- */
function handleList(token, res) {
  if (!authOk(token)) return sendJson(res, 401, { ok: false, error: "unauthorized" });
  const index = readIndex();
  const full = index.map((m) => {
    try {
      const rec = JSON.parse(fs.readFileSync(path.join(SUB_DIR, m.id + ".json"), "utf8"));
      return rec;
    } catch {
      return m;
    }
  });
  sendJson(res, 200, { ok: true, items: full });
}

function handleFile(id, name, token, res) {
  if (!authOk(token)) return sendJson(res, 401, { ok: false, error: "unauthorized" });
  const fpath = path.join(SUB_DIR, safeName(id), "files", safeName(name));
  if (!fpath.startsWith(SUB_DIR)) return sendJson(res, 400, { ok: false, error: "bad path" });
  if (!fs.existsSync(fpath)) return sendJson(res, 404, { ok: false, error: "not found" });
  const ext = path.extname(fpath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Disposition": "attachment; filename=" + safeName(name),
  });
  fs.createReadStream(fpath).pipe(res);
}

/* ---------- 静态文件 ---------- */
function serveStatic(urlPath, res) {
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  if (rel === "/admin") rel = "/admin.html";
  const filePath = path.join(ROOT, path.normalize(rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("forbidden");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

/* ---------- 路由 ---------- */
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");
  const p = u.pathname;
  const token = u.searchParams.get("token");

  if (req.method === "POST" && p === "/api/submit") return handleSubmit(req, res);
  if (req.method === "GET" && p === "/api/submissions") return handleList(token, res);
  if (req.method === "GET" && p === "/api/wx/jssdk-config") return wxJssdkConfig(req, res);
  if (req.method === "GET" && p.startsWith("/api/file/")) {
    const parts = p.split("/"); // /api/file/:id/:name
    return handleFile(parts[3], parts.slice(4).join("/"), token, res);
  }
  if (req.method === "GET") return serveStatic(p, res);
  res.writeHead(405);
  res.end("method not allowed");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Stata 引导小程序已启动：");
  console.log("  客户页  http://localhost:" + PORT);
  console.log("  后台页  http://localhost:" + PORT + "/admin");
  console.log("  后台口令：" + ADMIN_TOKEN + "（可在 server.js 顶部的 ADMIN_TOKEN 修改）");
});
