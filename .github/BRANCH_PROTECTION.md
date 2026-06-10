# 分支保护规则

本文档声明了 lumo-task-web 项目的 main 分支保护策略。

## main 分支保护规则

### 1. 必需的 CI 检查

所有 PR 合并到 main 前，**必须**通过以下 CI 检查（由 `.github/workflows/ci.yml` 的 `ci` job 触发）：

- ✅ Frontend typecheck (`npm run typecheck` in web-app)
- ✅ Frontend lint (`npm run lint` in web-app)
- ✅ Frontend build (`npm run build` in web-app)
- ✅ Frontend UI tests (Playwright)
- ✅ Backend typecheck (`npm run typecheck` in backend)
- ✅ Backend build (`npm run build` in backend)
- ✅ Backend API tests (`npm test` in backend)
- ✅ Backend integration tests (`npm run test:integration` in backend)
- ✅ Security audit (`npm audit --audit-level=high`)

**CI 聚合检查**: `.github/workflows/ci.yml` 的 `ci` job 是所有检查的聚合器，所有 CI 检查都必须通过。

### 2. Code Review 要求

- **最少审查数**: 至少 1 个代码审查通过（来自 CODEOWNERS）
- **审查标准**: 参考 [PR_REVIEW_CHECKLIST.md](PR_REVIEW_CHECKLIST.md)
- **Dismiss stale reviews**: 有新 commit 后，之前的审查视为过时并自动 dismiss

### 3. 代码所有者（CODEOWNERS）

见 [CODEOWNERS](CODEOWNERS) 文件。默认所有 PR 需要 @jalenforwu 审查。

### 4. 分支保持最新

- **Require branches to be up to date before merging**: PR 在 merge 前必须 rebase 到 main 的最新 commit
- 防止基于过时 commit 的代码被合并

### 5. Merge 策略

**Squash and merge** (`Squash and merge` option)

- 优点：
  - 保持 main 分支的 commit 历史干净
  - 每个 PR 对应一个 commit
  - 便于回滚和 git blame
  
- Feature branch 的多个 commit 会被压缩为一个 commit
- Commit 消息使用 PR 标题和描述生成

**禁止的操作**：
- ❌ 直接 push 到 main（Feature branch 只！）
- ❌ Force push（git push --force）
- ❌ 绕过 CI 检查（--no-verify）
- ❌ Merge commit（使用 rebase + squash）

### 6. 管理员可以绕过这些规则

仅在以下紧急情况下，管理员可以绕过保护规则：

1. **生产服务中断**：需要立即 hotfix
2. **安全漏洞**：需要紧急补丁
3. **严重数据丢失**：需要立即回滚

绕过规则时，**必须**：
- 在 Slack / 沟通工具中通知所有开发者
- 创建相应的 Issue 记录原因和操作
- 补充相应的代码审查（事后追溯）

---

## 工作流

### 典型的 PR 提交流程

```bash
# 1. 从 main 创建特性分支
git checkout main
git pull origin main
git checkout -b feature/my-feature

# 2. 编码、测试、提交
npm test && npm run typecheck
git add .
git commit -m "feat(scope): description"

# 3. Push 到 origin
git push -u origin feature/my-feature

# 4. 在 GitHub 上创建 PR
# - 选择 main 作为目标分支
# - 填写 PR 模板
# - 等待 CI 检查通过

# 5. Code Review
# - 至少一个 CODEOWNERS 的 Approve
# - 如果有 Request Changes，修改后 push
# - 如果有新 commit，会自动 dismiss 旧 review

# 6. Merge
# - 点击 "Squash and merge" 按钮
# - 确认 commit 消息
# - 删除 feature branch（GitHub 会提示）

# 7. 本地清理
git fetch origin
git checkout main
git pull origin main
git branch -d feature/my-feature
```

### 如果 PR 与 main 有冲突

```bash
# 方式 1：Rebase（推荐，保持历史干净）
git fetch origin
git rebase origin/main
# 解决冲突...
git push --force-with-lease origin feature/my-feature

# 方式 2：Merge（如果 rebase 较为复杂）
git fetch origin
git merge origin/main
# 解决冲突...
git push origin feature/my-feature
```

---

## 监控和维护

### Branch Protection 的检查

GitHub 会在 PR 页面显示保护规则的遵循情况：

```
✓ All checks have passed
✓ This branch has no conflicts with the base branch
✓ 1 approving review
✓ Requires code review by a CODEOWNERS owner
```

如果某个检查失败，PR 页面会显示原因和修复建议。

### 常见问题

**Q: 为什么我的 PR 不能 merge？**
A: 检查以下可能性：
- CI 检查未通过（查看 CI 详情）
- 没有获得 CODEOWNERS 的 Approve
- 分支不是基于 main 的最新 commit

**Q: 我的 PR 冲突了怎么办？**
A: 将 feature branch rebase 到 main 的最新 commit，然后 push（参考上面的工作流）。

**Q: 我能绕过这些规则吗？**
A: 一般不建议。如果是紧急情况（生产中断、安全漏洞），联系管理员。

---

## 参考

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [PR_REVIEW_CHECKLIST.md](PR_REVIEW_CHECKLIST.md) - Code Review 标准
- [CODEOWNERS](CODEOWNERS) - 代码所有者
