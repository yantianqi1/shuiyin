# Claude Code 项目说明

本文档为 Claude Code 提供项目上下文，帮助 AI 理解项目结构和开发规范。

## 项目概述

**我的水印** 是一个基于 Web 的图片水印处理工具，支持去水印和加水印功能。

- **项目类型**：Web 应用（Flask + 前端）
- **主要语言**：Python (后端), JavaScript (前端), HTML/CSS
- **设计风格**：Glassmorphism 玻璃拟态

## 项目结构

```
去水印/
├── app.py                 # Flask 主应用，API 路由
├── backend/
│   └── watermark_remover.py  # 核心图像处理逻辑
├── static/
│   ├── app.js             # 前端 JavaScript 逻辑
│   └── style.css          # CSS 样式（玻璃拟态设计）
├── templates/
│   └── index.html         # HTML 模板
├── requirements.txt       # Python 依赖
├── README.md              # 项目说明
├── ROADMAP.md             # 功能规划文档
└── CLAUDE.md              # 本文档
```

## 核心模块说明

### backend/watermark_remover.py

图像处理核心函数：

- `remove_watermark_auto()` - 自动检测去水印
- `remove_watermark_region()` - 指定区域去水印
- `remove_watermark_color()` - 按颜色去水印
- `remove_watermark_frequency()` - 频域滤波去水印
- `add_text_watermark()` - 添加文字水印
- `add_image_watermark()` - 添加图片水印
- `add_qrcode_watermark()` - 添加二维码水印
- `add_datetime_watermark()` - 添加日期时间水印

### app.py

Flask API 路由：

- `POST /api/remove-watermark` - 单图去水印
- `POST /api/add-watermark` - 单图加水印
- `POST /api/batch-remove-watermark` - 批量去水印
- `POST /api/batch-add-watermark` - 批量加水印

### static/app.js

前端核心功能：

- 主题切换（暗色/亮色模式）
- 模式切换（单图/批量处理）
- 水印类型切换（文字/图片/二维码/日期时间）
- 区域选择（canvas 绘制）
- 模板保存/加载（localStorage）
- API 请求处理

## 开发规范

### 代码风格

- Python：遵循 PEP 8
- JavaScript：ES6+ 语法
- CSS：使用 CSS 变量，遵循设计系统

### 设计系统

CSS 变量定义在 `style.css` 的 `:root` 中：

- `--primary`: 主色调 (#0D9488 青色)
- `--cta`: 强调色 (#F97316 橙色)
- `--glass-bg`: 玻璃背景色
- `--blur-amount`: 模糊量

### 新功能开发流程

1. 在 `watermark_remover.py` 添加后端处理函数
2. 在 `app.py` 添加 API 路由
3. 在 `index.html` 添加 UI 元素
4. 在 `app.js` 添加前端逻辑
5. 在 `style.css` 添加样式（如需要）
6. 更新 `ROADMAP.md` 和 `README.md`

## 已完成功能

### v1.0 基础功能
- 自动检测去水印
- 手动区域去水印
- 按颜色去水印
- 频域滤波去水印
- 文字水印添加
- 图片水印添加

### v1.1 核心体验优化
- 批量处理（ZIP 打包下载）
- 水印模板保存
- 暗色模式
- 图片压缩和格式转换
- 批量手动区域标记

### v1.2 水印功能增强
- 二维码水印（qrcode 库）
- 日期时间水印（支持自定义格式）

## 待开发功能

参见 `ROADMAP.md` 文档

## 常用命令

```bash
# 安装依赖
pip install -r requirements.txt

# 运行开发服务器
python app.py

# 访问地址
http://localhost:5001
```

## 注意事项

- 图片处理使用 OpenCV 和 Pillow
- 二维码生成使用 qrcode[pil] 库
- 前端使用原生 JavaScript，无框架依赖
- 支持中文字体（自动检测系统字体）
