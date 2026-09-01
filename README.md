# Кючука Against The World — modular source

Редактираме само съответния модул. Не пипаме `dist/` ръчно.

## Панели
- `panels/streets.html` — Уличките
- `panels/mapPanel.html` — Карта
- `panels/workPanel.html` — Работа
- `panels/shopPanel.html` — Пазар
- `panels/invPanel.html` — Инвентар
- `panels/fanPanel.html` — Агитките
- `panels/gangPanel.html` — Бандите
- `panels/premiumPanel.html` — Кючукойни

## Логика
- `js/core.js` — вход, профил, играчи, PvP, общи функции
- `js/activity.js` — работа, патрул, активност
- `js/shop.js` — пазар + инвентар
- `js/premium.js` — Кючукойни
- `js/fans.js` — Агитките
- `js/gangs.js` — Бандите
- `js/boot.js` — стартиране и периодично обновяване

## Стилове
- `css/styles.css` — общ стил

## Правило
При промяна по Пазара се редактират само `panels/shopPanel.html` и/или `js/shop.js`.
При промяна по Работа — само `panels/workPanel.html` и/или `js/activity.js`.
И т.н.

`dist/index.html` е сглобена production версия и се генерира от модулите.
