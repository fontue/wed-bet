"use client";
import { useEffect, useId, useRef, useState } from "react";
import { formatLira } from "@/domain/market";
import {
  DOG_HOUSE_PAYLINES,
  DOG_HOUSE_SYMBOLS,
} from "@/domain/slots/dog-house/config";
import { DogHouseSymbolIcon } from "../../dog-house-symbol";
import { useAccessibleDialog } from "../../shared/use-accessible-dialog";

export function DogHouseRulesModal({
  stake,
  onClose,
}: {
  stake: number;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0),
    dialog = useRef<HTMLElement>(null),
    titleId = useId(),
    prize = (value: number) => formatLira(Math.floor((stake * value) / 100));
  useAccessibleDialog(dialog, onClose);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight")
        setPage((value) => Math.min(4, value + 1));
      if (event.key === "ArrowLeft") setPage((value) => Math.max(0, value - 1));
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const pages = [
    <div className="dogslot-info-paytable" key="pay">
      <p>
        Выплаты идут слева направо по соседним барабанам. Ставка делится на 20
        фиксированных линий.
      </p>
      {DOG_HOUSE_SYMBOLS.map((item, index) => (
        <article key={item.id}>
          <DogHouseSymbolIcon cell={{ id: -800 - index, symbol: item.id }} />
          <b>{item.title}</b>
          <span>
            3 · {prize(item.payouts[0])}
            <br />4 · {prize(item.payouts[1])}
            <br />5 · {prize(item.payouts[2])}
          </span>
        </article>
      ))}
    </div>,
    <div className="dogslot-info-copy" key="wild">
      <DogHouseSymbolIcon cell={{ id: -900, symbol: "WILD", multiplier: 3 }} />
      <h3>Wild 2X и 3X</h3>
      <p>
        Только барабаны 2, 3 и 4. Заменяет обычные символы. Множители
        участвующих Wild на каждой линии складываются, но не перемножаются.
      </p>
      <p>
        Во фриспинах Wild фиксируется на позиции вместе со своим множителем.
      </p>
    </div>,
    <div className="dogslot-info-copy" key="bonus">
      <DogHouseSymbolIcon cell={{ id: -901, symbol: "BONUS" }} />
      <h3>Bonus Paw</h3>
      <p>
        Лапы возможны только на барабанах 1, 3 и 5. Три лапы платят 5X общей
        ставки и открывают девять значений 1–3.
      </p>
      <p>
        Сумма даёт 9–27 фриспинов. Bonus во фриспинах отсутствует, retrigger
        невозможен.
      </p>
    </div>,
    <div className="dogslot-info-lines" key="lines">
      <h3>20 линий</h3>
      {DOG_HOUSE_PAYLINES.map((line, index) => (
        <span key={index}>
          <b>{index + 1}</b>
          {line.map((row, reel) => (
            <i key={reel} style={{ gridRow: row + 1, gridColumn: reel + 1 }} />
          ))}
        </span>
      ))}
    </div>,
    <div className="dogslot-info-copy" key="controls">
      <h3>Управление</h3>
      <p>
        Кнопки − и + меняют общую ставку. Скорость переключается между NORMAL,
        QUICK и TURBO.
      </p>
      <p>
        SKIP включает максимальную скорость до конца текущего раунда. Повторное
        нажатие сокращает текущую паузу, но линии, reveal, Sticky Wild и free
        spins продолжают показываться по порядку.
      </p>
      <p>
        Высокая волатильность. Только виртуальные свадебные лиры.
        Самостоятельная реализация.
      </p>
    </div>,
  ];
  return (
    <div
      className="dogslot-overlay dogslot-rules-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="dogslot-rules dogslot-rules-v2"
      >
        <header>
          <div>
            <small>Casa degli Sposi</small>
            <h2 id={titleId}>Информация об игре</h2>
          </div>
          <button aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="dogslot-rules-scroll">{pages[page]}</div>
        <footer>
          <button
            aria-label="Предыдущая страница"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
          >
            ←
          </button>
          <b>
            {page + 1} / {pages.length}
          </b>
          <button
            aria-label="Следующая страница"
            disabled={page === pages.length - 1}
            onClick={() => setPage((value) => value + 1)}
          >
            →
          </button>
        </footer>
      </section>
    </div>
  );
}
