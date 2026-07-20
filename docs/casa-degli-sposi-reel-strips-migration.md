# Casa degli Sposi — план миграции на physical reel strips

## Текущее состояние

Production engine `domain/slots/dog-house/engine.ts` использует independent weighted-cell модель. Для каждой позиции сервер выбирает символ из весовой таблицы с ограничениями по номеру барабана: Bonus только на reels 1/3/5, Wild только на reels 2/3/4, во free spins Bonus отсутствует.

Визуальные `BASE_PRESENTATION_STRIPS` и `FREE_SPIN_PRESENTATION_STRIPS` находятся только в presentation layer. Они создают разнообразную transform-анимацию и плавно подводят уже полученный серверный target, но не участвуют в RNG и не влияют на RTP.

## Отличие physical strips

В physical reel strip модели сервер выбирает stop index на заранее заданной циклической полосе каждого барабана. Три видимых символа связаны соседством на этой полосе. Это меняет совместные вероятности символов, частоту линий, Bonus, Wild и накопления Sticky Wild; простое сохранение текущих отдельных weights не гарантирует прежние RTP или volatility.

## Риски миграции

- изменение RTP и hit frequency;
- изменение частоты Bonus и распределения free spins;
- изменение частоты нескольких Wild на линии и line multipliers;
- изменение sticky accumulation и хвоста крупных выигрышей;
- несовместимость повторного расчёта старой истории, если не сохранить прежний engine route.

## Предлагаемый план

1. Зафиксировать отдельные base/free strips и stop-index RNG.
2. Создать новый engine adapter без изменения presentation layer.
3. Ввести новую `mathVersion`, например `casa-degli-sposi-v3-strips`.
4. Оставить v2 result JSON только для чтения; историю отображать из сохранённого результата без повторного RNG.
5. Добавить тесты stop-index boundaries, symbol restrictions, paylines, Bonus и Sticky Wild.
6. Провести калибровочные прогоны 1–5 млн раундов, затем независимый финальный прогон минимум 5 млн.
7. Сравнить RTP, hit frequency, Bonus frequency, line multiplier distribution, sticky distribution, percentiles и max-win tail с v2.
8. Переключать production на новую версию только после отдельного подтверждения математической конфигурации.

## Решение для текущего patch

Dog House engine остаётся на independent weighted-cell модели `casa-degli-sposi-v2`. Миграция на physical reel strips намеренно не выполнялась, чтобы не менять математику и существующие round records.
