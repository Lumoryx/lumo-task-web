# PR Code Review 检查清单

本文档提供了 Code Reviewer 的标准检查清单，确保代码质量、安全性和一致性。

## Code Reviewer 的职责

- ✅ 确保代码遵循 CLAUDE.md 的架构规则
- ✅ 验证测试覆盖率和质量
- ✅ 检查安全问题和最佳实践
- ✅ 评估代码的可读性和维护性
- ✅ 确认 CHANGELOG 和文档的更新

---

## 检查清单

### 1. 代码质量检查

- [ ] **遵循 CLAUDE.md 规则**
  - Frontend：类型定义、组件结构、CSS 规范、状态管理
  - Backend：错误处理、数据库查询、中间件、认证
  - 无硬编码路径、API 端点或配置

- [ ] **代码可读性和风格**
  - 函数名、变量名清晰表意（避免 a, b, x 等）
  - 函数长度合理（一般 < 30 行）
  - 循环和条件的嵌套深度不超过 3 层
  - 复杂逻辑有简洁的注释（解释 WHY，不是 WHAT）

- [ ] **无代码坏味道**
  - 没有重复代码（DRY 原则）
  - 没有魔法数字（使用命名常量）
  - 没有过度设计或过度抽象
  - 没有无效的导入或声明

- [ ] **日志和调试代码**
  - 没有 `console.log()`、`debugger` 语句
  - 只有必要的 `console.error()` 或 `logger.warn()`
  - 日志消息清晰，便于生产环境排查

---

### 2. 类型安全检查

- [ ] **无 TypeScript 类型错误**
  - `npm run typecheck` 通过（CI 已验证）
  - 没有 `any` 类型（除非特殊原因，需注释解释）
  - 没有 `unknown` 的不安全类型断言

- [ ] **没有 TypeScript ignore 注释**
  - 没有 `// @ts-ignore` 注释
  - 没有 `// @ts-expect-error` 注释
  - 如果必须使用，需在 PR 中清楚说明原因

- [ ] **正确的类型定义**
  - 函数参数和返回值都有类型注解
  - React props 定义了类型（`interface Props {}` 或 `type Props = {}`）
  - API 响应和请求体都有 Zod schema 或 TypeScript 类型

---

### 3. 测试覆盖检查

- [ ] **测试存在且全部通过**
  - 新代码有对应的测试（单元测试或集成测试）
  - `npm test` 全部通过（CI 已验证）
  - 没有 xtest、skip 或注释掉的测试

- [ ] **测试覆盖率达标**
  - Backend：新功能的代码覆盖率 ≥ 80%
  - Frontend 新组件：所有公开行为 100% 覆盖
  - 关键路径和错误处理都有测试

- [ ] **测试质量**
  - 测试名称清晰表达意图（describe / it）
  - 测试用例覆盖主流程和边界情况
  - 没有脆弱的 mock 或过度 mock
  - 测试是独立的，不依赖执行顺序

- [ ] **遵循 TDD 流程**（Conventional Commits 中体现）
  - PR 说明中体现了 Red → Green → Refactor 流程
  - 测试优先（test: commit 在 feat/fix 之前）

---

### 4. 安全性检查

- [ ] **没有泄露 Secrets**
  - 没有 API 密钥、密码、令牌等硬编码
  - 没有 `.env`、`config.local` 文件被提交
  - 如果添加配置示例，使用 `.example` 或 `.template`

- [ ] **输入验证和清理**
  - 所有用户输入都经过验证（Zod schema）
  - API 请求的 req.body 都验证
  - 前端表单输入有验证
  - 没有直接使用未验证的用户输入构建 SQL / 正则

- [ ] **SQL 和数据库安全**
  - SQL 查询使用参数化查询（`:name` 形式）
  - 没有字符串拼接 SQL
  - 没有 SQL 注入风险

- [ ] **认证和授权**
  - API 端点有正确的认证检查
  - 授权检查（是否有权访问资源）
  - 没有暴露敏感用户数据（密码哈希、邮箱等）
  - 高风险操作（删除账户、修改密码）有额外验证

- [ ] **依赖安全**
  - 没有添加风险高或维护不良的依赖
  - 依赖版本合理（避免过时或过新）
  - 没有 security audit 警告（CI 检查）

- [ ] **CORS / CSRF 考虑**
  - API 的 CORS 配置合理（不是 `*`)
  - 涉及状态变更的请求有 CSRF token（如适用）

---

### 5. 性能检查

- [ ] **没有明显的性能回归**
  - 没有新的 N+1 数据库查询
  - 没有同步阻塞操作在异步流程中
  - 没有内存泄漏（循环引用、未清理的 event listener）
  - 前端没有不必要的 re-render

- [ ] **算法复杂度合理**
  - 查询数据库时有 index 支持
  - 排序、搜索算法的复杂度合理
  - 没有嵌套循环（O(n²)）处理大数据集

---

### 6. 文档和更新检查

- [ ] **代码注释合理**
  - 复杂逻辑有注释（解释为什么这样做）
  - 没有过度注释（好代码自文档）
  - 注释准确，不是复述代码

- [ ] **CHANGELOG 更新**
  - 如果是功能新增、Bug 修复或 Breaking Change，CHANGELOG.md 已更新
  - CHANGELOG 遵循格式：Added / Fixed / Changed / Deprecated / Removed

- [ ] **API 文档更新**（如适用）
  - 新增 API 端点有文档
  - 参数和返回值都有说明
  - 示例请求和响应清晰

- [ ] **README 或 ADR 更新**（如适用）
  - 新增的架构决策记录在 .github/adr/
  - 项目配置或安装步骤有变化，README.md 已更新

---

### 7. 向后兼容性检查

- [ ] **API 变更标记清楚**
  - 删除端点或参数：标记为 Breaking Change
  - 修改参数类型：标记为 Breaking Change
  - 新增可选参数：不是 Breaking Change
  - 行为变更：检查是否影响现有用户

- [ ] **数据库迁移**（如适用）
  - 迁移是可逆的（有 rollback）
  - 迁移不会丢失数据
  - 迁移脚本清晰，有注释

---

### 8. 最终检查

- [ ] **PR 模板完整**
  - [ ] 变更说明清晰
  - [ ] 选择了相关的 ECC skills
  - [ ] 包含了自测清单
  - [ ] 有 UI 截图（如适用）
  - [ ] 关联了 Issue（Closes #xxx）

- [ ] **分支和 Commit 规范**
  - 分支名遵循约定（feature/xxx、fix/xxx）
  - Commit 消息遵循 Conventional Commits

- [ ] **没有冲突**
  - PR 已 rebase 到 main 最新 commit
  - 没有未解决的冲突

---

## 常见问题

### Q: 如何评估代码质量？

A: 遵循以下标准：
1. **可读性**：新开发者能否在 5 分钟内理解代码
2. **维护性**：修改代码时是否容易定位和修改
3. **可测试性**：是否容易编写单元测试
4. **可复用性**：是否有潜在的通用性

### Q: 测试覆盖率如何计算？

A: 使用 Istanbul / nyc 等工具：
```bash
npm test -- --coverage
```

关键指标：
- **Line coverage**: 至少 80%
- **Branch coverage**: 至少 75%
- **Function coverage**: 至少 80%

### Q: 什么时候应该 Request Changes？

A: 以下情况：
- 违反 CLAUDE.md 的强制规则
- 安全问题（泄露 secrets、输入验证缺失等）
- 严重的代码质量问题（不可读、过度复杂）
- 测试覆盖不足（< 80% 或关键路径未测）

其他问题可以用评论建议，让作者自行判断。

### Q: 如何处理分歧？

A: 如果 Reviewer 和 Author 在某个实现细节上有分歧，应该：
1. 讨论为什么这样做会更好
2. 参考项目的架构决策记录 (ADR)
3. 如果没有明确的规则，两种方案都可接受

---

## Reviewer 的权限

- 有 write 权限的开发者可以 Approve PR
- 仅 CODEOWNERS 的 Approve 才能触发 merge（见 BRANCH_PROTECTION.md）
- 其他开发者的 Approve 是参考性的，不影响 merge

---

## 感谢参考

- [Google's Code Review Guidelines](https://google.github.io/eng-practices/review/)
- [CLAUDE.md](/CLAUDE.md) - 项目工程标准
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
