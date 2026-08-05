/* ============================================================
 *  内容配置 —— 只改这个文件就能换掉所有文案与业务
 *  结构：品牌 / 开场 / 7 项业务(描述+价格+第4步分支+第6步文案) / 成功页
 *  第4步 type 取值：significance | doit | qa | indicator | did | iv | other
 * ============================================================ */

window.APP_CONFIG = {
  brand: "StataBro 实证计量 · 服务引导",
  expertName: "statabro",

  // ★ 免费收数据的开关（Web3Forms，免费无限条，直接发到你邮箱）★
  // 1) formEndpoint 填 Web3Forms 固定接口地址（无需改）
  // 2) formAccessKey 填你在 web3forms.com 领取的免费 key（和你的邮箱绑定）
  //    领取步骤：打开 https://web3forms.com → 输入你的邮箱 → 复制 Access Key 发给我即可
  // 注意：Web3Forms 支持附件（单文件约 2MB、总约 8MB 内随邮件送达）；更大的数据文件仍建议客户微信发你（页面第6步已提示）
  formEndpoint: "https://api.web3forms.com/submit",
  formAccessKey: "768d979d-3246-41f2-b642-1753c87fa3bc",

  intro: {
    title: "你好，我是你的 Stata 实证计量专家",
    subtitle: "调显著性 · 实证代做 · DID / 工具变量专项 · 指标构建 · 疑问解答",
    body:
      "找我做事之前，先用下面 7 步搞清楚我们能怎么合作——每一步都有说明，" +
      "你跟着走完就能知道自己要选哪项、要准备什么。了解清楚后，在最后提交你的需求即可。",
    cta: "开始了解（约 3 分钟）",
  },

  // 7 项主营业务（顺序即第1步展示顺序）
  businesses: [
    {
      id: "significance",
      name: "调整显著性",
      emoji: "📈",
      desc:
        "当回归结果不显著、或显著方向不符合预期时，我通过剔除异常值的方式来调整，绝对符合学术规范，" +
        "<strong style='color:#d4380d'>绝不篡改数据！绝不篡改数据！！绝不篡改数据！！！</strong>" +
        "<br><br><br>" +
        "1. 程序筛选没有具体调整代码！" +
        "<br>" +
        "2. 可以在文章中汇报：本文经过剔除缺失值和异常值之后得到***样本！（知网有超多文献参考，C刊、SSCI超多学者都在使用）" +
        "<br>" +
        "3. 最终交付调整好的数据，可以直接复现显著结果！" +
        "<br>" +
        "4. 本人已服务3000+客户，助力高校教师、博士后、博士、硕士研究生等顺利发表期刊或毕业，质量绝对靠谱，值得信赖！",
      price: "价格面议 · 按工作量定价",
      step4: { type: "significance" },
      step6:
        "<div class=\"submit-guide\">" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">📊</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">一、数据文件（必交）</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">接受格式：<span class=\"hl\">dta</span> / <span class=\"hl\">Excel</span>（.xlsx/.xls） / <span class=\"hl\">CSV</span></div>" +
        "      <div class=\"submit-item\">数据中<span class=\"hl\">必须包含</span>代码里用到的所有变量，缺一不可</div>" +
        "      <div class=\"submit-item\"><span class=\"hl\">变量名称</span>必须与你的 Stata 代码<span class=\"hl\">完全一致</span>（含大小写、下划线）</div>" +
        "      <div class=\"submit-item\">数据确保<span class=\"hl\">可直接运行回归</span>，无需再做清洗或匹配</div>" +
        "      <div class=\"submit-item\">如有面板数据，请确认个体标识和时间变量已正确设置</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">💻</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">二、Stata 代码 / 命令（选交）</div>" +
        "    <div class=\"submit-note\">前面步骤中已填写的命令会自动一并提交。如果调整数量较多、需要补充代码或提供完整 do 文件，可在此处继续提交。</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">可提交 <span class=\"hl\">do 文件</span> 或 <span class=\"hl\">命令文本</span></div>" +
        "      <div class=\"submit-item\">如依赖外部宏/全局变量，请一并说明</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">📎</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">三、直接上传文件</div>" +
        "    <div class=\"submit-note\">可将数据文件、代码、文献资料等直接在此处上传，支持多文件。若通过演示链接提交，文件也可直接微信发给老师——文字需求会随提交一起送达。</div>" +
        "    <div id=\"step6_upload_area\"></div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">⚠️</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">四、注意事项</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">也可将数据和代码打包成压缩包（.zip / .rar）发送</div>" +
        "      <div class=\"submit-item\">如数据涉及敏感信息，可先做脱敏处理（替换变量名即可）</div>" +
        "      <div class=\"submit-item\">不确定数据是否合格？<span class=\"hl\">可先发给我预检</span>，确认无误后再正式开始</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "</div>",
    },
    {
      id: "doit",
      name: "实证代做",
      emoji: "🧮",
      desc:
        "你给出研究问题或粗框架，我全程帮你跑完实证：从数据清洗、描述性统计、基准回归，" +
        "到稳健性、机制、异质性等一整套分析，并交付可复现的代码与结果。" +
        "适合没时间或不会跑 Stata 的同学、老师与机构。",
      price: "价格面议 · 按工作量定价",
      step4: {
        type: "doit",
        items: [
          { key: "x", label: "自变量（X）个数" },
          { key: "y", label: "因变量（Y）个数" },
          { key: "corr", label: "相关性分析 个数" },
          { key: "desc", label: "描述性统计 个数" },
          { key: "base", label: "基准回归 个数" },
          { key: "robust", label: "稳健性检验 个数" },
          { key: "mech", label: "机制检验 个数" },
          { key: "hetero", label: "异质性检验 个数" },
          { key: "further", label: "进一步分析 / 拓展性分析 个数" },
          { key: "other", label: "其他 个数" },
        ],
      },
      step6:
        "需要自己去找齐相关的数据，找齐之后来找我做！" +
        "需要我单独找数据的请直接告知 statabro！",
    },
    {
      id: "qa",
      name: "疑问解答",
      emoji: "💡",
      desc:
        "你对实证方法、Stata 操作、结果解读有疑问，我一对一给你讲清楚——" +
        "为什么这么做、结果怎么看、哪里可能出错。按问题答疑，灵活高效。",
      price: "价格面议 · 按工作量定价",
      step4: { type: "qa" },
      step6: "如有相关材料（数据、文献、截图等）可一并说明或上传，方便我更快理解你的需求。",
    },
    {
      id: "indicator",
      name: "指标构建",
      emoji: "🛠️",
      desc:
        "你需要构造某个指标（如数字化转型、ESG、企业韧性、媒体报道等），" +
        "我根据文献或你的定义，设计构建思路、给出可执行的 Stata 代码，" +
        "并交付构建好的变量与说明文档。",
      price: "价格面议 · 按工作量定价",
      step4: { type: "indicator" },
      step6: "如有相关材料（文献、截图、样例数据等）可一并说明或上传，方便我更快理解你的需求。",
    },
    {
      id: "did",
      name: "双重差分专项服务",
      emoji: "⚖️",
      desc:
        "专注 DID 及延伸方法：平行趋势检验与调整、安慰剂检验、PSM-DID、" +
        "异质性处理效应（Goodman-Bacon / 事件研究法等）。让你的政策评估经得起审稿人推敲。",
      price: "价格面议 · 按工作量定价",
      step4: {
        type: "did",
        items: ["平行趋势调整", "安慰剂检验", "PSM-DID", "异质性处理效应检验", "其他"],
      },
      step6:
        "<div class=\"submit-guide\">" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">📊</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">一、数据文件（必交）</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">接受格式：<span class=\"hl\">dta</span> / <span class=\"hl\">Excel</span>（.xlsx/.xls） / <span class=\"hl\">CSV</span></div>" +
        "      <div class=\"submit-item\">数据中<span class=\"hl\">必须包含</span>代码里用到的所有变量，缺一不可</div>" +
        "      <div class=\"submit-item\"><span class=\"hl\">变量名称</span>必须与你的 Stata 代码<span class=\"hl\">完全一致</span>（含大小写、下划线）</div>" +
        "      <div class=\"submit-item\">数据确保<span class=\"hl\">可直接运行回归</span>，无需再做清洗或匹配</div>" +
        "      <div class=\"submit-item\">如有面板数据，请确认个体标识和时间变量已正确设置；DID 请确保<span class=\"hl\">处理组/时间变量</span>已明确</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">💻</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">二、Stata 代码 / 命令（选交）</div>" +
        "    <div class=\"submit-note\">如果已有 DID 相关代码（如 did_regress / xtdidregress / csdid 等），可在此处提交。前面步骤中填写的命令会自动一并提交。</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">可提交 <span class=\"hl\">do 文件</span> 或 <span class=\"hl\">命令文本</span></div>" +
        "      <div class=\"submit-item\">如依赖外部宏/全局变量，请一并说明</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">📎</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">三、直接上传文件</div>" +
        "    <div class=\"submit-note\">可将数据文件、代码、文献资料等直接在此处上传，支持多文件。若通过演示链接提交，文件也可直接微信发给老师——文字需求会随提交一起送达。</div>" +
        "    <div id=\"step6_upload_area\"></div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">⚠️</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">四、注意事项</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">也可将数据和代码打包成压缩包（.zip / .rar）发送</div>" +
        "      <div class=\"submit-item\">如数据涉及敏感信息，可先做脱敏处理（替换变量名即可）</div>" +
        "      <div class=\"submit-item\">不确定数据是否合格？<span class=\"hl\">可先发给我预检</span>，确认无误后再正式开始</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "</div>",
    },
    {
      id: "iv",
      name: "工具变量专项服务",
      emoji: "🔧",
      desc:
        "专注工具变量法：弱工具变量与识别不足检验与调整、两阶段最小二乘（2SLS）" +
        "第一 / 第二阶段显著性的处理与解读，帮你把内生性问题处理干净。",
      price: "价格面议 · 按工作量定价",
      step4: { type: "iv" },
      step6:
        "<div class=\"submit-guide\">" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">📊</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">一、数据文件（必交）</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">接受格式：<span class=\"hl\">dta</span> / <span class=\"hl\">Excel</span>（.xlsx/.xls） / <span class=\"hl\">CSV</span></div>" +
        "      <div class=\"submit-item\">数据中<span class=\"hl\">必须包含</span>代码里用到的所有变量，缺一不可</div>" +
        "      <div class=\"submit-item\"><span class=\"hl\">变量名称</span>必须与你的 Stata 代码<span class=\"hl\">完全一致</span>（含大小写、下划线）</div>" +
        "      <div class=\"submit-item\">数据确保<span class=\"hl\">可直接运行回归</span>，无需再做清洗或匹配</div>" +
        "      <div class=\"submit-item\">如有面板数据，请确认个体标识和时间变量已正确设置；IV 请确保<span class=\"hl\">工具变量</span>已在数据中</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">💻</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">二、Stata 代码 / 命令（选交）</div>" +
        "    <div class=\"submit-note\">如果已有 IV 相关代码（如 ivregress / ivreg2 / xtivreg 等），可在此处提交。前面步骤中填写的命令会自动一并提交。</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">可提交 <span class=\"hl\">do 文件</span> 或 <span class=\"hl\">命令文本</span></div>" +
        "      <div class=\"submit-item\">如依赖外部宏/全局变量，请一并说明</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">📎</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">三、直接上传文件</div>" +
        "    <div class=\"submit-note\">可将数据文件、代码、文献资料等直接在此处上传，支持多文件。若通过演示链接提交，文件也可直接微信发给老师——文字需求会随提交一起送达。</div>" +
        "    <div id=\"step6_upload_area\"></div>" +
        "  </div>" +
        "</div>" +
        "<div class=\"submit-section\">" +
        "  <div class=\"submit-icon\">⚠️</div>" +
        "  <div class=\"submit-body\">" +
        "    <div class=\"submit-title\">四、注意事项</div>" +
        "    <div class=\"submit-list\">" +
        "      <div class=\"submit-item\">也可将数据和代码打包成压缩包（.zip / .rar）发送</div>" +
        "      <div class=\"submit-item\">如数据涉及敏感信息，可先做脱敏处理（替换变量名即可）</div>" +
        "      <div class=\"submit-item\">不确定数据是否合格？<span class=\"hl\">可先发给我预检</span>，确认无误后再正式开始</div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "</div>",
    },
    {
      id: "other",
      name: "其他",
      emoji: "📝",
      desc:
        "上面没覆盖到的 Stata / 实证计量需求，告诉我具体情况，" +
        "我来评估能否帮上忙以及怎么做。",
      price: "价格面议 · 按工作量定价",
      step4: { type: "other" },
      step6: "如有相关材料可一并说明或上传，方便我更快理解你的需求。",
    },
  ],

  done: {
    title: "提交成功",
    body: "谢谢您的配合，已完成提交，请耐心等待！",
  },

  // 后台访问口令（与 server.js 中的 ADMIN_TOKEN 保持一致；生产请修改）
  adminTokenHint: "如需查看后台需求清单，请联系专家获取访问口令。",
};

// 显著性类型的中文映射（供汇总与后台展示）
window.SIG_LABELS = {
  pos: "正向显著",
  neg: "负向显著",
  none: "不显著",
  iv: "工具变量调显著",
  parallel: "平行趋势调显著",
  other: "其他调显著",
};
window.SIG_LEVEL_LABELS = { "1": "1%", "5": "5%", "10": "10%" };
// 显著性业务「其他调整项」的底部选项（工具变量 / 平行趋势 / 其他）
window.SIG_EXTRA_LABELS = { iv: "工具变量", parallel: "平行趋势", other: "其他" };
window.IV_TYPE_LABELS = {
  weak: "弱工具变量 / 识别不足检验调整",
  first: "第一阶段显著性",
  second: "第二阶段显著性",
  other: "其他",
};
window.IV_DIR_LABELS = { pos: "正向显著", neg: "负向显著" };
