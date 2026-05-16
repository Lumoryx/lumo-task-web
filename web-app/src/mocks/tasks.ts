import type { Task, CompletedEntry } from "@/types/task";

/**
 * Seed task data. The mock API (`src/api/client.ts`) loads this on first
 * run, then writes the live state to `localStorage` so user actions
 * (create / complete / move) persist across reloads.
 *
 * To reset, clear `localStorage["lumo.tasks.v1"]` from devtools.
 */
export const SEED_TASKS: Task[] = [
  {
    id: "t1",
    title: {
      en: "Finish homepage wireframes for client review",
      zh: "完成客户评审用的首页线框",
    },
    desc: {
      en: "Hero, features section, footer. Polish enough for Friday's review.",
      zh: "Hero、功能区、Footer。打磨到周五评审可看的程度。",
    },
    quadrant: "Q1",
    today: true,
    due: "today",
    duration: 90,
    pomos_done: 1,
    pomos_total: 4,
    conviction: 0.92,
    next_step: {
      en: "Open Hero frame · Outline 3 layout options",
      zh: "打开 Hero 画板 · 列 3 个版式",
    },
    reason: {
      en: "Due today and blocks the next design stage. One 25-min focus block to finish the first screen is enough.",
      zh: "今天截止,会卡住下一阶段。一个 25 分钟的专注块就能完成第一屏。",
    },
    not_now: [
      { id: "t2", reason: { en: "Can wait until Sat — no blocker", zh: "周六前都不卡进度" } },
      { id: "t4", reason: { en: "Needs Maya's input first", zh: "得先等 Maya 反馈" } },
    ],
  },
  {
    id: "t2",
    title: { en: "Draft Q3 OKRs", zh: "起草 Q3 OKR 初稿" },
    desc: { en: "Three objectives, five KRs each.", zh: "三个目标,每个 5 个关键结果。" },
    quadrant: "Q2",
    today: true,
    due: "Fri",
    duration: 60,
    pomos_done: 0,
    pomos_total: 3,
  },
  {
    id: "t3",
    title: { en: "Reply to investor follow-up email", zh: "回复投资人跟进邮件" },
    quadrant: "Q1",
    today: true,
    due: "today",
    duration: 20,
    pomos_done: 0,
    pomos_total: 1,
  },
  {
    id: "t4",
    title: { en: "Refactor auth module — token rotation", zh: "重构 auth 模块的 Token 轮换" },
    quadrant: "Q2",
    today: false,
    due: "next wk",
    duration: 180,
    pomos_done: 0,
    pomos_total: 6,
    ai_suggest: "Q2",
  },
  {
    id: "t5",
    title: { en: "Approve Acme invoices", zh: "审批 Acme 发票" },
    quadrant: "Q3",
    today: true,
    due: "today",
    duration: 15,
    pomos_done: 0,
    pomos_total: 1,
  },
  {
    id: "t6",
    title: { en: "Clean up Downloads folder", zh: "清理下载文件夹" },
    quadrant: "Q4",
    today: false,
    due: null,
    duration: 15,
    pomos_done: 0,
    pomos_total: 1,
  },
  {
    id: "t7",
    title: { en: "Plan team offsite agenda", zh: "策划团队 offsite 议程" },
    quadrant: "unclassified",
    today: false,
    due: "Aug 2",
    duration: 45,
    pomos_done: 0,
    pomos_total: 2,
    ai_suggest: "Q2",
  },
  {
    id: "t8",
    title: { en: "Read research on focus rhythms", zh: "读专注节奏相关的研究" },
    quadrant: "unclassified",
    today: false,
    due: null,
    duration: 40,
    pomos_done: 0,
    pomos_total: 2,
    ai_suggest: "Q4",
  },
  {
    id: "t9",
    title: { en: "Renew domain — lumo.app", zh: "续费域名 — lumo.app" },
    quadrant: "Q3",
    today: false,
    due: "Aug 14",
    duration: 5,
    pomos_done: 0,
    pomos_total: 1,
  },
  {
    id: "t10",
    title: { en: "Read Pieter's design crit notes", zh: "阅读 Pieter 的设计批注" },
    quadrant: "Q2",
    today: false,
    due: null,
    duration: 25,
    pomos_done: 0,
    pomos_total: 1,
  },
  {
    id: "t11",
    title: { en: "Reorder office supplies", zh: "补购办公用品" },
    quadrant: "Q4",
    today: false,
    due: null,
    duration: 10,
    pomos_done: 0,
    pomos_total: 1,
  },
];

function todayAt(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const SEED_COMPLETED_TODAY: CompletedEntry[] = [
  {
    id: "c1",
    title: { en: "Reply to design feedback from Pieter", zh: "回复 Pieter 的设计反馈" },
    duration: 18,
    quadrant: "Q2",
    startedAt: todayAt(8, 55),
    completedAt: todayAt(9, 13),
  },
  {
    id: "c2",
    title: { en: "Set up next week's calendar blocks", zh: "排好下周的日程块" },
    duration: 12,
    quadrant: "Q3",
    startedAt: todayAt(9, 20),
    completedAt: todayAt(9, 32),
  },
  {
    id: "c3",
    title: { en: "Review pull request #47", zh: "Review PR #47" },
    duration: 25,
    quadrant: "Q1",
    startedAt: todayAt(10, 5),
    completedAt: todayAt(10, 30),
  },
];
