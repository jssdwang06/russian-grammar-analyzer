# 俄语句子语法分析器

帮助俄语学习者理解句子结构和语法成分的Web应用程序。

## 功能特点

- 输入俄语文本进行分析
- 逐句分析语法结构
- 提供中文翻译
- 显示词法信息（格、数、性、时态等）
- 保存历史记录，方便复习

## 技术栈

### 前端
- React
- CSS
- localStorage (用于历史记录)

### 后端
- Node.js
- Express
- Google Gemini API (用于翻译)

## 安装与运行

### 前提条件
- Node.js (v14+)
- npm (v6+)
- Google Gemini API 密钥

### 安装步骤

1. 克隆仓库
```
git clone <repository-url>
cd russian-grammar-analyzer
```

2. 安装前端依赖
```
cd frontend
npm install
```

3. 安装后端依赖
```
cd ../backend
npm install
```

4. 配置环境变量
在 `backend` 目录中创建 `.env` 文件，并添加以下内容：
```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

### 运行应用

1. 启动后端服务器
```
cd backend
npm run dev
```

2. 启动前端开发服务器
```
cd frontend
npm run dev
```

3. 在浏览器中访问应用
```
http://localhost:5173
```

## 使用说明

1. 在文本输入框中输入俄语文本
2. 点击"进行分析"按钮
3. 查看分析结果，包括原文、翻译和语法分析
4. 使用"上一句"和"下一句"按钮在多个句子之间导航
5. 历史记录会自动保存，可以点击历史记录项目重新加载分析

## 项目结构

```
russian-grammar-analyzer/
├── frontend/                # 前端React应用
│   ├── public/              # 静态资源
│   └── src/                 # 源代码
│       ├── App.jsx          # 主应用组件
│       ├── App.css          # 样式表
│       └── main.jsx         # 入口文件
├── backend/                 # 后端Node.js应用
│   ├── index.js             # 主服务器文件
│   ├── grammarAnalyzer.js   # 语法分析模块
│   └── package.json         # 依赖配置
└── README.md                # 项目说明
```

## 未来计划

- 改进语法分析的准确性
- 添加用户账户系统，实现跨设备同步
- 添加俄语单词发音功能
- 集成在线词典
- 添加导出分析结果功能
- 支持语法错误检测和高亮
