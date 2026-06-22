# Engineering Roles / 工程角色

Six subagents model the delivery chain for Lumo Task. Each owns a clear boundary and hands off explicitly. They encode the rules already in [`CLAUDE.md`](/CLAUDE.md) as callable roles, so a 100%-AI workflow stays disciplined.

每个里程碑/功能都沿这条链推进，角色边界清晰、显式交接。

## The chain / 交接链

```
PM → Architect(含契约) → Engineer → Reviewer → QA → Release
                              ↑__________|
                          (Reviewer 可打回或直接修)
```

| # | Agent | Owns | Boundary |
|---|-------|------|----------|
| 1 | `product-manager` | 需求：用户故事 + 可测验收标准 + 优先级 + 成功指标 | What/Why only — 不碰实现 |
| 2 | `architect` | 拆 Story、ADR，**统筹所有 API/契约变更**（`@lumo/contracts`） | How it's shaped — 唯一可改契约者 |
| 3 | `engineer` | 全栈实现（Hono + React/Zustand），契约消费方，TDD | 不改契约，不自审合并 |
| 4 | `reviewer` | 审 PR + **直接修问题**，合并前最后关卡 | 不改契约、不扩产品范围 |
| 5 | `qa` | E2E + 回归 + **安全审查**（合一），可阻断 | 验收标准即测试依据 |
| 6 | `release` | 版本、CHANGELOG、release、ROADMAP | 不写功能代码 |

## Two enforced gates / 两条硬卡口

1. **Contract-first** — 任何 API 变更，Architect 先改 `@lumo/contracts`，否则 `make ci` 一致性测试挂。
2. **AC = tests** — PM 的验收标准直接转成 QA 的 Playwright 断言，"需求即测试"。

## How to invoke / 用法

In Claude Code, delegate a stage to its role, e.g. *"As the architect, land the contract for Task Search"*. Each agent loads the relevant `/ecc:*` skills itself. See each `*.md` for the full role prompt.

> Definition of Done (milestone): PRD → 契约先行 → TDD 红绿 → 双端 typecheck/test → Reviewer 修复 → QA(E2E+安全)放行 → CHANGELOG + ROADMAP 更新。
