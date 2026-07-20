# Sweet Lemonza — математический отчёт

Дата последней симуляции: 20 июля 2026 года. Актуальная версия математики: `sweet-lemonza-v6`.

Модель использует только виртуальные свадебные лиры. RTP — долгосрочная статистическая оценка, а не обещание возврата в отдельной сессии.

## Сводка режимов

| Режим | Раундов | RTP | Standard error | Примечание |
|---|---:|---:|---:|---|
| Standard | 5 000 000 | 95,7663% | 0,1479 п.п. | Конфигурация не менялась в v5 |
| Lemon Boost | 5 000 000 | 96,5576% | 0,2502 п.п. | Конфигурация не менялась в v5 |
| Bonus Buy v6 | 5 000 000 | **99,5668%** | **≈0,0846 п.п.** | Цена снова 100X, бонус гарантирован |

Оценка Bonus Buy v6 пересчитана из того же пяти-миллионного набора выплат: распределение и выплаты не менялись, изменилась только цена со 103X на 100X. Standard и Lemon Boost также не менялись.

## Изменение Bonus Buy v6

- цена покупки возвращена со 103X к **100X базовой ставки**;
- гарантированный trigger, стартовые 10 фриспинов, weights и multiplier chance не менялись;
- новая цена применяется только к новым раундам с `mathVersion: sweet-lemonza-v6`.

## Изменение Bonus Buy v5

Первичный аудит `sweet-lemonza-v4` на 1 000 000 покупок показал средний возврат около 99,20X при цене 100X. Минимально рискованное изменение:

- цена покупки повышена со 100X до **103X базовой ставки**;
- `bonusBuySymbolWeights` не менялись;
- multiplier chance 12,5% не менялся;
- guaranteed trigger и стартовые 10 фриспинов сохранены;
- natural-trigger free spins Standard/Boost не менялись.

Расчётная цена: `expected payout / target RTP = 99,20X / 0,963 ≈ 103X`.

## Финальная симуляция Bonus Buy

- Seed: `bonus-buy-v5-final`
- Покупок: 5 000 000
- Базовая ставка: 100 лир
- Цена покупки: 10 300 лир
- Total wager: 51 500 000 000 лир
- Total payout: 49 783 419 980 лир
- RTP: 96,6668%
- Средний payout: 99,2439X базовой ставки
- Median: 26,20X
- P95: 469,65X
- P99: 858,60X
- P99.9: 1 659,65X
- Максимум: 5 839,25X
- Среднее число free spins: 10,1795
- Retrigger frequency: 3,4718%
- Максимальная сумма multiplier: 239X

### Распределение payout относительно базовой ставки

| Диапазон | Доля покупок |
|---|---:|
| 0–25X | 48,5725% |
| 25–50X | 19,2737% |
| 50–100X | 9,6506% |
| 100–250X | 9,0631% |
| 250X+ | 13,4401% |

Вклад в RTP Bonus Buy: base 0,3135%, Scatter 3,0356%, free spins 93,3177%.

## Конфигурации

`baseGameSymbolWeights`: Limoncello 1191, Rings 650, Wine 720, Prosecco 800, Cake 900, Bouquet 1000, Lemon 559, Grapes 1440, Olives 1740, Scatter 100.

`lemonBoostSymbolWeights`: Limoncello 1220, Rings 650, Wine 720, Prosecco 800, Cake 900, Bouquet 1000, Lemon 530, Grapes 1440, Olives 1740, Scatter 240. Стоимость — 125% базовой ставки.

`freeSpinsSymbolWeights`: Limoncello 43, Rings 45, Wine 47, Prosecco 49, Cake 51, Bouquet 53, Lemon 55, Grapes 57, Olives 59, Scatter 10.

`bonusBuySymbolWeights`: Limoncello 1204, Rings 650, Wine 720, Prosecco 800, Cake 900, Bouquet 1000, Lemon 546, Grapes 1440, Olives 1740, Scatter 100.

Multiplier chance: Standard 5,5%, Boost 9%, Bonus Buy 12,5%. Значения multiplier: 2X, 3X, 4X, 5X, 6X, 8X, 10X, 12X, 15X, 20X, 25X, 50X и 100X с отдельными весами из production config.

## Ограничения

- Редкие крупные выигрыши повышают дисперсию; другой seed даст немного отличающуюся оценку.
- Новая `mathVersion` записывается только в новые раунды. Существующие v2/v4 result JSON не переписываются и остаются читаемыми.
- В v6 менялась только цена Bonus Buy. Таблица выплат и режимы Standard/Boost не корректировались.

## Повторный запуск

```bash
npm run simulate:sweet-lemonza -- --mode=bonus-buy --spins=1000000 --seed=bonus-buy-v6-primary --stake=100 --json
npm run simulate:sweet-lemonza -- --mode=bonus-buy --spins=5000000 --seed=bonus-buy-v6-final --stake=100 --json
```
