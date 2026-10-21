# 蓝白阅读主题

## 参照与实际核对

2026-10-17实际通过HTTP读取[University of Glasgow主页](https://www.gla.ac.uk/)及主页链接的[main.css](https://www.gla.ac.uk/3t4/css/main.css)。当次主页使用的完整样式URL为`https://www.gla.ac.uk/3t4/css/main.css?_=1791540403`。源码明确包含：

```css
#header { background-color:#011451; /* 其余声明省略 */ }
#header #mobile-nav { background-color:#011451; /* 其余声明省略 */ }
#header #header-logo { background-color:#011451; /* 其余声明省略 */ }
```

同一CSS中另有大量`#005398`与`#fff`。这里借鉴深海军蓝与白色阅读面的关系，只引用颜色参照；没有复制大学标志、图片、字体、排版代码或品牌标识。课程使用自己的对象、内容与组件。新增CSS完全本地运行，不向参照网站或字体服务发送请求。

## 颜色变量

唯一主题文件为`zh/src/blue-theme.css`，应在所有当前中文页面的原CSS之后最后加载：课程、资料、来源、案例、审计等。原`style.css`、`object-visuals.css`和`tmle-trace.css`继续控制布局及数据对象尺寸。

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--theme-navy` | `#011451` | 课程侧栏、标题、当前步骤 |
| `--theme-blue` | `#005398` | 正文链接、操作、range、主要蓝色提示 |
| `--theme-ink` | `#172B4D` | 正文及代码 |
| `--theme-muted` | `#465B75` | 辅助文字与图注 |
| `--theme-white` | `#FFFFFF` | 主阅读区域、公式、白色卡片、浮窗 |
| `--theme-panel` | `#F2F7FC` | 实验、代码、表达式与浅面板 |
| `--theme-panel-strong` | `#E5EFF9` | 表头、当前导航、次级浅蓝区域 |
| `--theme-border` | `#B8CCE0` | 装饰性分隔线、面板及表格细线 |
| `--theme-control-border` | `#6989A9` | 需要辨认的控件轮廓 |
| `--theme-rail-text` | `#CCDDF2` | 深侧栏上的辅助文字 |
| `--theme-focus` | `#005398` | 白/浅蓝面上的键盘焦点 |
| `--theme-focus-on-navy` | `#8DD5FF` | 深侧栏上的键盘焦点 |
| `--theme-error` | `#A12B24` | 计算失败等错误文字 |

`--ink,--muted,--green,--bg,--paper,--line`是旧组件的兼容别名，统一映射到上述主题变量。`--green`保留旧名称以免改写原组件，其实际值已是蓝色。新增组件应直接使用`--theme-*`，不要再增加绿色主题别名。

整体面积以白和浅蓝为主。矩阵/向量的既有`ov-*`语义色、q0/q1来源色、小型AIPW/TMLE标记、错误/警告与链接定位高亮继续保留；它们表达对象身份而非页面主题。不能为了让每一小格也变蓝而破坏跨章对象对应。

## 选择器与层叠边界

- `:root`只提供颜色token及兼容别名；正文、文档、通用控件使用这些token。
- `.shell > aside`明确限定深色导航，不将对象内部的header/footer或资料页内容染成深色。
- 实验、旧图示、Julia卡片、公式、代码、表格、浮窗与公共资料卡片按组件类覆盖大面积绿/米白背景。
- `.object-figure`及`.trace-*`只改变中性框架、控件、图注与表格轮廓；语义对象的`--ov-ink/--ov-tint/--ov-line`保留。
- 主题不改grid/flex、宽高、间距、字体、行高或患者行尺寸；不依赖滤镜，不添加外部字体或图片，没有`!important`声明。
- 焦点覆盖匹配既有组件选择器，并在最后加载时胜出；普通深底侧栏链接采用浅色焦点。导航链接处于hover或当前页时背景变为浅蓝，使用更具体的`:is(:hover,[aria-current="page"]):focus-visible`切换为深蓝焦点，避免浅蓝轮廓落在浅蓝背景上。此处复用已有蓝色/浅蓝配色及其对比记录，不新增静态检查数量；集成浏览器另需验证实际焦点样式。

代码面板使用浅蓝，面板内部普通`pre code`透明以免重复叠底。公式面为白色。主题不改KaTeX隐藏的MathML节点、不改公式的横向滚动或浮窗开闭逻辑，也不让语义色只靠颜色表达；原有变量名、来源字样和维度仍需保留。

## 移动、打印与系统偏好

移动断点沿用800px，侧栏在现有移动布局中仍使用深蓝和白字；本主题只补足边界色，不修改原断点布局。选择器适用于服务端/构建时渲染的页面，不需要JavaScript激活主题。

打印时将浅面板token设为白色，将侧栏变为白底深字，去掉导航与浮窗阴影，避免大面积深底耗墨；数学与对象的内容保持原样。未增加任何动画；`prefers-reduced-motion`还显式关闭相关控件/浮窗的transition与animation，并保持滚动为auto。`forced-colors`不禁用系统强制颜色，当前导航增加系统Highlight轮廓。

## 实际对比检查

以下为读取新增CSS首个`:root`块后计算的WCAG sRGB相对亮度对比，不是截图估计。普通文字按4.5:1，控件/焦点轮廓按3:1检查。

| 前景 / 背景 | 对比 | 阈值 | 结果 |
| --- | ---: | ---: | --- |
| 白字 / 海军蓝 | 17.211 | 4.5 | PASS |
| 侧栏辅助字 / 海军蓝 | 12.451 | 4.5 | PASS |
| 海军蓝 / 较深浅蓝 | 14.790 | 4.5 | PASS |
| 正文 / 白 | 14.102 | 4.5 | PASS |
| 辅助字 / 白 | 6.968 | 4.5 | PASS |
| 辅助字 / 浅蓝 | 6.466 | 4.5 | PASS |
| 蓝链接 / 白 | 7.805 | 4.5 | PASS |
| 蓝链接 / 较深浅蓝 | 6.707 | 4.5 | PASS |
| 白字 / 操作蓝 | 7.805 | 4.5 | PASS |
| 控件轮廓 / 白 | 3.651 | 3 | PASS |
| 控件轮廓 / 浅蓝 | 3.388 | 3 | PASS |
| 侧栏焦点 / 海军蓝 | 10.731 | 3 | PASS |
| 错误文字 / 浅蓝 | 6.751 | 4.5 | PASS |

`--theme-border`是装饰线而非控件可辨识性的唯一线索，因此没有将它假充达到3:1的控件轮廓。禁用控件沿用原有禁用状态，未列为普通活动文字的对比通过项。

可在项目根目录用现有Node包装器运行以下可重现检查；读取首个`:root`可避免误把打印媒体中的白色token当成屏幕主题：

```sh
sh scripts/node.sh --input-type=module <<'NODE'
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const css = readFileSync('zh/src/blue-theme.css', 'utf8');
const root = css.match(/:root\s*\{([^}]+)/)[1];
const palette = Object.fromEntries(
  [...root.matchAll(/--theme-([a-z-]+):\s*(#[0-9a-f]{6})\s*;/gi)]
    .map(match => [match[1], match[2]])
);
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
const pairs = [
  ['white', 'navy', 4.5], ['rail-text', 'navy', 4.5],
  ['navy', 'panel-strong', 4.5], ['ink', 'white', 4.5],
  ['muted', 'white', 4.5], ['muted', 'panel', 4.5],
  ['blue', 'white', 4.5], ['blue', 'panel-strong', 4.5],
  ['white', 'blue', 4.5], ['control-border', 'white', 3],
  ['control-border', 'panel', 3], ['focus-on-navy', 'navy', 3],
  ['error', 'panel', 4.5],
];
for (const [foreground, background, minimum] of pairs) {
  const a = luminance(palette[foreground]), b = luminance(palette[background]);
  const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  assert.ok(ratio >= minimum, `${foreground}/${background}: ${ratio}`);
  console.log(`${foreground}/${background}: ${ratio.toFixed(3)} PASS`);
}
assert.equal(/!important\s*[;}]/.test(css), false);
assert.equal(/url\(|@import/.test(css), false);
assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
NODE
```

已实际完成：参照页面/CSS的HTTP读取、上述13组对比断言、无外部资源及无important声明的静态检查、花括号平衡检查。尚未在此主题子任务中实际完成：集成后的桌面/移动浏览器截图、焦点逐项操作、MathML读屏、实际打印或打印预览。因此不能将这些静态结果记为浏览器/读屏/打印通过；集成方需在最后CSS链接进入全部页面后另行记录。
