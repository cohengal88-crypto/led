# Claude setup – skills + Playwright MCP

הרצה אחת מתוך תיקיית הפרויקט (טרמינל ב-VS Code):

```
powershell -ExecutionPolicy Bypass -File claude-setup\install.ps1
```

מה הסקריפט עושה:
1. פורס את `skills.zip` ומעתיק את ה-skills ל-`%USERPROFILE%\.claude\skills`, כך שהם זמינים בכל פרויקט.
2. מוסיף את Playwright MCP לפרויקט (`.mcp.json`), ואם ה-CLI של `claude` מותקן, רושם אותו גם לכל הפרויקטים.
3. מריץ `npm install` ומוריד את Chromium לבדיקות.

| Skill | מקור | גרסה |
|---|---|---|
| emil-design-eng | github.com/emilkowalski/skills (MIT) | 2d22863 |
| impeccable | github.com/pbakaus/impeccable (Apache-2.0) | 3e3a917 |
| taste-skill (`design-taste-frontend`) | github.com/Leonxlnx/taste-skill (MIT) | 12af471 |
| ux-designer | שלך (הומר מ-`.claude/commands/ux-designer.md`) | – |

לפרויקט חדש: מעתיקים את התיקייה `claude-setup` ומריצים שוב, או פשוט משתמשים, כי ה-skills כבר מותקנים גלובלית.
