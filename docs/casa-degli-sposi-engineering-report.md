# Casa degli Sposi — engineering audit

## Исходная alpha

До прохода один client component одновременно выполнял сетевой запрос, ручные `wait`, остановку reels, показ линий, bonus reveal, Sticky Wild, звук, баланс и историю. Отсутствовали отменяемый playback, safe skip, stable display IDs, SVG paylines, quick/reduced profiles, dev lab и подробные тесты.

## Новая структура

- `components/slots/dog-house/animation/` — state types, timing profiles, display model, number tween, abortable waits, Animation Director и React playback adapter.
- `components/slots/dog-house/audio/` — типизированные sound events и Web Audio manager с mute, visibility и остановкой loops.
- `components/slots/dog-house/components/` — reels, grid, payline, labels, anticipation, bonus reveal, Big Win, summary, rules, history и animation lab.
- `components/slots/dog-house/dev/` — фиксированные seeded scenarios.
- `domain/slots/dog-house/` — единственный авторитетный engine/result contract.

## Playback

`requesting → starting-reels → spinning → [anticipation] → stopping-reel ×5 → evaluating → (highlighting-line → showing-line-win → collecting-win) ×N → bonus transition/reveal/free spins → bonus-summary → round-complete`.

Director поддерживает `cancel`, `dispose`, pause/resume при visibility и fast-forward текущего раунда. Пользовательский SKIP переключает оставшийся lifecycle на максимальный профиль и сокращает текущую необязательную паузу, но не прыгает в финал. Внутренний `skipToRoundEnd` оставлен только как recovery/dev API и не вызывается playback-компонентом. Финальный баланс всегда берётся из `round.balanceAfter`; повтор неизвестного сетевого результата использует тот же idempotency key.

## Reels и Sticky Wild

Каждый reel имеет самостоятельный viewport. Presentation symbols используются только в движении; три target cells из server result встроены в хвост ленты. Stop выполняется через `translate3d`, overshoot, возврат и нормализацию к точной grid. Sticky Wild получают стабильный `animationId` по позиции и отображаются поверх движущейся ленты.

## Timing profiles (ms)

| Фаза | Normal | Quick | Turbo |
|---|---:|---:|---:|
| Minimum spin | 520 | 300 | 160 |
| Reel deceleration | 300 | 170 | 100 |
| Reel stop gap | 150 | 80 | 45 |
| Line highlight | 520 | 280 | 150 |
| Line value | 400 | 190 | 100 |
| Sticky lock | 480 | 270 | 180 |
| Bonus token | 330 | 180 | 100 |
| Big Win | 1700 | 1050 | 650 |

Reduced motion сохраняет смысловую последовательность, сокращает bounce, particles и длинные transitions.

## Server contract

Каждая линия теперь содержит `basePayout`, `wildPositions`, сумму `wildMultiplier` и финальный `payout`. Round содержит `maxLineMultiplier`, `stickyWildCount` и `bestFreeSpin`. Сохранённые round JSON не переигрываются через RNG.

## Известные ограничения

- Серверный RNG пока основан на отдельных base/free weighted configurations, а не на физических stop-index reel strips.
- Autoplay намеренно не добавлялся: он не является обязательным и увеличивает риск параллельных запросов.
- Полный browser/Playwright visual-regression набор и видеофиксация требуют отдельного запуска браузерного окружения.
