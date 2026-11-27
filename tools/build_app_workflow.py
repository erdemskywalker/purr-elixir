"""
App Factory Multi-Agent Autonomous Production Pipeline (Antigravity run_workflow)

Args:
  app_dir (str): Absolute path to the scaffolded app directory, e.g. /home/erdemskywalker/app-factory/apps/001-my-app
  max_critic_rounds (int, optional): Maximum Visual Design Critic revision rounds (default: 3)
  pass_score (int, optional): Minimum Visual Critic score out of 100 (default: 85)
"""

import json
from pathlib import Path

FACTORY_ROOT = "/home/erdemskywalker/app-factory"
APP_DIR = args["app_dir"]
MAX_ROUNDS = int(args.get("max_critic_rounds", 3))
PASS_SCORE = int(args.get("pass_score", 85))

PROMPTS_DIR = Path(FACTORY_ROOT) / ".agents/skills/app-factory/prompts"
RUBRIC_PATH = Path(FACTORY_ROOT) / ".agents/skills/app-factory/rubric.json"


def load_template(name: str) -> str:
    text = (PROMPTS_DIR / name).read_text(encoding="utf-8")
    rendered = (
        text.replace("{{APP_DIR}}", APP_DIR)
        .replace("{{FACTORY_ROOT}}", FACTORY_ROOT)
        .replace("{{PASS_SCORE}}", str(PASS_SCORE))
    )
    return (
        rendered
        + f"\n\n## Uygulamaya Özel Zorunlu Prompt Notları\n"
        + f"Göreve başlamadan önce mutlaka `{APP_DIR}/AGENT_PROMPTS.md` dosyasını da okuyup kendi rolüne ait maddeleri birebir uygula.\n"
    )


# ==============================================================================
# PHASE 1: UI & Apple HIG Design System Architect
# ==============================================================================
phase("1. UI & Apple HIG Design System")
log(f"Starting ui-architect for {APP_DIR}")

ui_arch_result = await agent(
    load_template("01_ui_architect.md"),
    schema={
        "type": "object",
        "properties": {
            "theme_path": {"type": "string"},
            "blueprint_path": {"type": "string"},
            "screens": {"type": "array", "items": {"type": "string"}},
            "differentiation_summary": {"type": "string"},
        },
        "required": ["theme_path", "blueprint_path", "screens", "differentiation_summary"],
    },
    role="UI & Apple HIG Architect",
)
log("UI Architect completed:", json.dumps(ui_arch_result, ensure_ascii=False))

# ==============================================================================
# PHASE 2: Parallel Core Build (Real SQLite/SQL Data + iOS Frontend)
# ==============================================================================
phase("2. Parallel Core Build (SQLite + Frontend)")

# Step 2A: Real SQLite Schema & Repository first (so app-ui-dev consumes exact repository exports)
data_result = await agent(
    load_template("02a_data_sql_dev.md"),
    schema={
        "type": "object",
        "properties": {
            "sql_files": {"type": "array", "items": {"type": "string"}},
            "repository_path": {"type": "string"},
            "tables": {"type": "array", "items": {"type": "string"}},
            "sql_verified": {"type": "boolean"},
        },
        "required": ["sql_files", "repository_path", "tables", "sql_verified"],
    },
    role="SQL & Data Layer Dev",
)
log("Data/SQL Dev completed:", json.dumps(data_result, ensure_ascii=False))

# Step 2B: iOS-First Frontend on Core Engine + Real Repository
ui_dev_result = await agent(
    load_template("02b_app_ui_dev.md")
    + f"\n\nData Layer Summary:\n{json.dumps(data_result, ensure_ascii=False)}",
    schema={
        "type": "object",
        "properties": {
            "screens_built": {"type": "array", "items": {"type": "string"}},
            "locales": {"type": "array", "items": {"type": "string"}},
            "e2e_test_path": {"type": "string"},
            "notes": {"type": "string"},
        },
        "required": ["screens_built", "locales", "e2e_test_path"],
    },
    role="iOS Frontend & Capacitor Dev",
)
log("App UI Dev completed:", json.dumps(ui_dev_result, ensure_ascii=False))

# ==============================================================================
# PHASE 3: Functional QA, Compliance & Bugfix
# ==============================================================================
phase("3. Functional QA & Bugfix")

qa_result = await agent(
    load_template("03_qa_bugfix.md"),
    schema={
        "type": "object",
        "properties": {
            "all_tests_passed": {"type": "boolean"},
            "bugs_fixed": {"type": "array", "items": {"type": "string"}},
            "screenshots_dir": {"type": "string"},
            "console_errors": {"type": "integer"},
        },
        "required": ["all_tests_passed", "bugs_fixed", "screenshots_dir", "console_errors"],
    },
    role="QA & Bugfix Engineer",
)
log("QA & Bugfix completed:", json.dumps(qa_result, ensure_ascii=False))

# ==============================================================================
# PHASE 4: Visual Design Critic & Self-Healing Revision Loop (Max 3 Rounds)
# ==============================================================================
phase("4. Visual Design Critic & Apple HIG Loop")

critic_schema = {
    "type": "object",
    "properties": {
        "round": {"type": "integer"},
        "total_score": {"type": "integer"},
        "scores": {
            "type": "object",
            "properties": {
                "apple_hig": {"type": "integer"},
                "visual_polish": {"type": "integer"},
                "usability_responsive": {"type": "integer"},
                "admob_compliance": {"type": "integer"},
                "apple_review_safety": {"type": "integer"},
            },
            "required": [
                "apple_hig",
                "visual_polish",
                "usability_responsive",
                "admob_compliance",
                "apple_review_safety",
            ],
        },
        "hard_blockers": {"type": "array", "items": {"type": "string"}},
        "actionable_fixes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "screen": {"type": "string"},
                    "severity": {"type": "string"},
                    "issue": {"type": "string"},
                    "fix_instruction": {"type": "string"},
                },
                "required": ["screen", "severity", "issue", "fix_instruction"],
            },
        },
        "pass": {"type": "boolean"},
    },
    "required": ["round", "total_score", "scores", "hard_blockers", "actionable_fixes", "pass"],
}

# Persistent Critic retains memory across revision rounds to verify every fix visually
critic = agent(
    load_template("04_design_critic.md"),
    role="Visual Design Critic & Apple Reviewer",
)

critic_history = []
final_critic = None

for round_num in range(1, MAX_ROUNDS + 1):
    log(f"--- Visual Critic Round {round_num}/{MAX_ROUNDS} ---")
    turn_prompt = (
        f"Tur {round_num}/{MAX_ROUNDS} değerlendirmesini yap. "
        f"{APP_DIR}/artifacts/screenshots/ içindeki TÜM güncel PNG ekran görüntülerini `read_file` ile görsel olarak incele, "
        f"{RUBRIC_PATH} rubriğine göre puanla ve sonucu {APP_DIR}/CRITIC_REPORT.md dosyasına (Tur {round_num} başlığıyla) ekle."
    )
    if round_num > 1:
        turn_prompt += " Önceki turda bildirdiğin sorunların ekran görüntülerinde gerçekten giderilip giderilmediğini tek tek doğrula."

    eval_res = await critic(turn_prompt, schema=critic_schema)
    critic_history.append(eval_res)
    final_critic = eval_res

    score = eval_res["total_score"]
    blockers = eval_res["hard_blockers"]
    passed_gate = eval_res["pass"] and score >= PASS_SCORE and len(blockers) == 0
    log(f"Round {round_num} Score: {score}/100 | Blockers: {len(blockers)} | Pass: {passed_gate}")

    if passed_gate:
        break

    if round_num < MAX_ROUNDS:
        polish_prompt = (
            load_template("04b_ui_polisher.md")
            + f"\n\n### Critic Round {round_num} Bulguları (Kesin Düzeltilecekler):\n"
            + json.dumps(eval_res, ensure_ascii=False, indent=2)
        )
        polish_res = await agent(
            polish_prompt,
            schema={
                "type": "object",
                "properties": {
                    "fixes_applied": {"type": "array", "items": {"type": "string"}},
                    "qa_reverified": {"type": "boolean"},
                },
                "required": ["fixes_applied", "qa_reverified"],
            },
            role=f"UI Polisher (Round {round_num})",
        )
        log(f"UI Polisher Round {round_num} finished:", json.dumps(polish_res, ensure_ascii=False))

del critic

# ==============================================================================
# PHASE 4.5: Independent Playtester, Fun Factor & Edge-Case Critic (Max 2 Rounds)
# ==============================================================================
phase("4.5. Independent Playtester & Fun Critic Loop")

MAX_PLAYTEST_ROUNDS = int(args.get("max_playtest_rounds", 2))
PLAYTEST_RUBRIC_PATH = Path(FACTORY_ROOT) / ".agents/skills/app-factory/playtest_rubric.json"

playtest_schema = {
    "type": "object",
    "properties": {
        "round": {"type": "integer"},
        "total_score": {"type": "integer"},
        "scores": {
            "type": "object",
            "properties": {
                "fun_and_content": {"type": "integer"},
                "controls_and_robustness": {"type": "integer"},
                "visual_usability": {"type": "integer"},
                "audio_and_juice": {"type": "integer"},
                "store_and_retention": {"type": "integer"},
            },
            "required": [
                "fun_and_content",
                "controls_and_robustness",
                "visual_usability",
                "audio_and_juice",
                "store_and_retention",
            ],
        },
        "critical_bugs": {"type": "array", "items": {"type": "string"}},
        "actionable_fixes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "area": {"type": "string"},
                    "severity": {"type": "string"},
                    "issue": {"type": "string"},
                    "fix_instruction": {"type": "string"},
                },
                "required": ["area", "severity", "issue", "fix_instruction"],
            },
        },
        "pass": {"type": "boolean"},
    },
    "required": ["round", "total_score", "scores", "critical_bugs", "actionable_fixes", "pass"],
}

playtester = agent(
    load_template("04c_playtest_fun_critic.md"),
    role="Independent Playtester & Fun Critic",
)

playtest_history = []
final_playtest = None

for pt_round in range(1, MAX_PLAYTEST_ROUNDS + 1):
    log(f"--- Independent Playtester Round {pt_round}/{MAX_PLAYTEST_ROUNDS} ---")
    pt_prompt = (
        f"Bağımsız Playtest Tur {pt_round}/{MAX_PLAYTEST_ROUNDS} değerlendirmesini yap. "
        f"{APP_DIR} uygulamasını gerçek tarayıcıda oyna/kullan, canlı kullanım ekran görüntülerini incele, "
        f"{PLAYTEST_RUBRIC_PATH} rubriğine göre acımasızca puanla ve raporu {APP_DIR}/PLAYTEST_REPORT.md dosyasına yaz."
    )
    if pt_round > 1:
        pt_prompt += " Önceki turda tespit ettiğin tüm kritik bug ve eğlence/UX pürüzlerinin gerçekten giderilip giderilmediğini canlı testle doğrula."

    pt_res = await playtester(pt_prompt, schema=playtest_schema)
    playtest_history.append(pt_res)
    final_playtest = pt_res

    pt_score = pt_res["total_score"]
    pt_bugs = pt_res["critical_bugs"]
    pt_passed = pt_res["pass"] and pt_score >= PASS_SCORE and len(pt_bugs) == 0
    log(f"Playtest Round {pt_round} Score: {pt_score}/100 | Critical Bugs: {len(pt_bugs)} | Pass: {pt_passed}")

    if pt_passed:
        break

    if pt_round < MAX_PLAYTEST_ROUNDS:
        exp_prompt = (
            load_template("04d_experience_polisher.md")
            + f"\n\n### Playtester Tur {pt_round} Bulguları (Kesin Düzeltilecekler):\n"
            + json.dumps(pt_res, ensure_ascii=False, indent=2)
        )
        exp_res = await agent(
            exp_prompt,
            schema={
                "type": "object",
                "properties": {
                    "fixes_applied": {"type": "array", "items": {"type": "string"}},
                    "qa_reverified": {"type": "boolean"},
                },
                "required": ["fixes_applied", "qa_reverified"],
            },
            role=f"Experience & Fun Polisher (Round {pt_round})",
        )
        log(f"Experience Polisher Round {pt_round} finished:", json.dumps(exp_res, ensure_ascii=False))

del playtester

# ==============================================================================
# PHASE 5: Parallel App Store Launch Pack, ASO & 1024x1024 App Icon Generation
# ==============================================================================
phase("5. App Store Launch, ASO & Icon Assets")

launch_tasks = [
    ("icons", load_template("05a_icon_generator.md"), "App Icon Designer", "self"),
    ("store", load_template("05b_store_launch.md"), "ASO & App Store Launch Engineer", "self"),
]

launch_results = await parallel(
    launch_tasks,
    lambda item: agent(
        item[1],
        schema={
            "type": "object",
            "properties": {
                "task": {"type": "string"},
                "outputs": {"type": "array", "items": {"type": "string"}},
                "summary": {"type": "string"},
            },
            "required": ["task", "outputs", "summary"],
        },
        role=item[2],
        type_name=item[3],
    ),
)

final_summary = {
    "app_dir": APP_DIR,
    "ui_architect": ui_arch_result,
    "data_layer": data_result,
    "frontend": ui_dev_result,
    "qa": qa_result,
    "critic_rounds": len(critic_history),
    "final_critic": final_critic,
    "playtest_rounds": len(playtest_history),
    "final_playtest": final_playtest,
    "launch_assets": launch_results,
}
print(json.dumps(final_summary, ensure_ascii=False, indent=2))
