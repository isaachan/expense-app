---
Task ID: 1
Agent: main
Task: 搭建记账本网页应用

Work Log:
- 初始化 fullstack 开发环境
- 设计 Prisma schema：Expense 模型（date, amount, category, note）
- 安装 xlsx 库用于 Excel 导入导出
- 创建 API 路由：GET/POST /api/expenses, PUT/DELETE /api/expenses/[id], GET /api/expenses/export, POST /api/expenses/import, GET /api/expenses/stats
- 创建 Zustand store 管理前端状态
- 创建 ExpenseForm 组件（记账表单 + 导入导出按钮）
- 创建 ExpenseList 组件（搜索、分页、编辑对话框、删除确认）
- 创建 ExpenseReport 组件（月度统计、饼图、柱状图、分类明细）
- 创建主页面 page.tsx（Tabs 布局：记账/明细/报表）
- 使用 Agent Browser 完成端到端验证：添加记录、查看列表、查看报表、编辑对话框均正常

Stage Summary:
- 完整的记账本应用已搭建完成，包含记账、明细、报表三个 Tab
- 数据库使用 SQLite + Prisma
- Excel 导入导出通过 xlsx 库实现
- 报表使用 Recharts 饼图和柱状图
- 微信 SSO 登录留有占位提示，需配置 AppID/AppSecret 后启用
- 浏览器验证通过，所有核心功能正常工作