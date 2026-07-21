import { memo } from "react";
import type {
  DogHouseCell,
  DogHouseSymbol,
} from "@/domain/slots/dog-house/types";

const META: Record<DogHouseSymbol, { label: string; color: string }> = {
  BRUNO: { label: "Бруно", color: "#6f3c2d" },
  BELLA: { label: "Белла", color: "#efe2cf" },
  PUG: { label: "Мопс", color: "#c58b55" },
  DACHSHUND: { label: "Такса", color: "#a85432" },
  COLLAR: { label: "Ошейник", color: "#45a999" },
  BONE: { label: "Косточка", color: "#f5d99c" },
  A: { label: "A", color: "#e85a48" },
  K: { label: "K", color: "#f3c93e" },
  Q: { label: "Q", color: "#b95ace" },
  J: { label: "J", color: "#46a7d9" },
  TEN: { label: "10", color: "#55bd5c" },
  WILD: { label: "Wild-домик", color: "#f3c64c" },
  BONUS: { label: "Бонусная лапа", color: "#e85d6e" },
};
const DogFace = ({
  kind,
}: {
  kind: "BRUNO" | "BELLA" | "PUG" | "DACHSHUND";
}) => {
  const meta = META[kind],
    long = kind === "DACHSHUND",
    fluffy = kind === "BELLA",
    pug = kind === "PUG";
  return (
    <g>
      <path
        d={
          long
            ? "M18 40Q5 18 20 10Q31 17 31 42"
            : "M20 40Q7 15 24 10Q35 18 34 42"
        }
        fill={kind === "BELLA" ? "#d8bba2" : "#6a3529"}
      />
      <path
        d={
          long
            ? "M82 40Q95 18 80 10Q69 17 69 42"
            : "M80 40Q93 15 76 10Q65 18 66 42"
        }
        fill={kind === "BELLA" ? "#d8bba2" : "#6a3529"}
      />
      <ellipse
        cx="50"
        cy="49"
        rx={fluffy ? 31 : 27}
        ry={fluffy ? 34 : 29}
        fill={meta.color}
      />
      {fluffy && (
        <path
          d="M25 35q-9 10 0 17-8 10 2 18m48-35q9 10 0 17 8 10-2 18"
          fill="none"
          stroke="#fff4e5"
          strokeWidth="8"
          strokeLinecap="round"
        />
      )}
      <circle cx="40" cy="43" r="4" fill="#30231f" />
      <circle cx="60" cy="43" r="4" fill="#30231f" />
      <ellipse
        cx="50"
        cy={pug ? 57 : 59}
        rx={pug ? 13 : 10}
        ry="8"
        fill="#3b2924"
      />
      <path
        d="M42 69q8 8 16 0"
        fill="none"
        stroke="#7c2f35"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M31 77q19 9 38 0"
        fill="none"
        stroke={kind === "BELLA" ? "#d54f86" : "#7952a8"}
        strokeWidth="7"
      />
      <circle cx="50" cy="80" r="5" fill="#f0ca4a" />
    </g>
  );
};

export const DogHouseSymbolIcon = memo(function DogHouseSymbolIcon({
  cell,
  className = "",
}: {
  cell: DogHouseCell;
  className?: string;
}) {
  const { symbol } = cell,
    meta = META[symbol],
    card = ["A", "K", "Q", "J", "TEN"].includes(symbol),
    dog = (["BRUNO", "BELLA", "PUG", "DACHSHUND"] as const).includes(
      symbol as never,
    );
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={meta.label}
      className={className}
    >
      {dog && (
        <>
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="14"
            fill={
              symbol === "BRUNO"
                ? "#54a8c5"
                : symbol === "BELLA"
                  ? "#d763a4"
                  : symbol === "PUG"
                    ? "#d7a04b"
                    : "#52a085"
            }
            stroke="#fff0b2"
            strokeWidth="5"
          />
          <path d="M11 76Q50 59 89 76V89H11Z" fill="rgba(74,38,28,.22)" />
          <DogFace kind={symbol as "BRUNO" | "BELLA" | "PUG" | "DACHSHUND"} />
        </>
      )}
      {symbol === "COLLAR" && (
        <>
          <path
            d="M18 38q32 29 64 0l-6 25q-26 23-52 0Z"
            fill="#4bb09c"
            stroke="#165548"
            strokeWidth="5"
          />
          <rect x="43" y="62" width="14" height="12" rx="3" fill="#f2c54c" />
          <circle
            cx="50"
            cy="78"
            r="8"
            fill="#f2c54c"
            stroke="#a97924"
            strokeWidth="3"
          />
        </>
      )}
      {symbol === "BONE" && (
        <>
          <path
            d="M27 38q-12-9-18 2-5 10 7 15-9 10 1 17 10 7 18-5l31-29q8 11 18 4 10-8 1-17 12-5 7-15-6-11-18-2Z"
            fill="#f7dfa6"
            stroke="#a9793f"
            strokeWidth="4"
          />
          <path
            d="m33 58 35-33"
            stroke="#fff7d9"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
      {card && (
        <>
          <text
            x="50"
            y="70"
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            fontSize={symbol === "TEN" ? 58 : 70}
            fontWeight="900"
            fill={meta.color}
            stroke="#fff5d4"
            strokeWidth="5"
            paintOrder="stroke"
          >
            {symbol === "TEN" ? "10" : symbol}
          </text>
        </>
      )}
      {symbol === "WILD" && (
        <>
          <path
            d="M8 42 50 8l42 34-8 8-34-27-34 27Z"
            fill="#e9534f"
            stroke="#7c302a"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M17 43h66v46H17Z"
            fill="#f0b84b"
            stroke="#7f432d"
            strokeWidth="5"
          />
          <path
            d="M29 89V56q21-20 42 0v33Z"
            fill="#74392f"
            stroke="#fff0a0"
            strokeWidth="4"
          />
          <path d="M36 62q14-12 28 0v27H36Z" fill="#4a2926" />
          <rect
            x="20"
            y="31"
            width="60"
            height="23"
            rx="7"
            fill="#fff0a0"
            stroke="#7c382c"
            strokeWidth="4"
          />
          <text
            x="50"
            y="48"
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            fontSize="17"
            fontWeight="900"
            fill="#b83b3e"
            stroke="#fff8c8"
            strokeWidth="1.5"
            paintOrder="stroke"
          >
            WILD
          </text>
          <text
            x="50"
            y="83"
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            fontSize="28"
            fontWeight="900"
            fill="#ffe45b"
            stroke="#321b1a"
            strokeWidth="4"
            paintOrder="stroke"
          >
            {cell.multiplier ?? 2}X
          </text>
        </>
      )}
      {symbol === "BONUS" && (
        <>
          <circle
            cx="50"
            cy="40"
            r="33"
            fill="#f7cf45"
            stroke="#9d5727"
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="40"
            r="27"
            fill="#ffe477"
            stroke="#fff2af"
            strokeWidth="3"
          />
          <ellipse cx="50" cy="48" rx="16" ry="13" fill="#d94355" />
          <circle cx="31" cy="33" r="7" fill="#e95767" />
          <circle cx="44" cy="24" r="7" fill="#e95767" />
          <circle cx="57" cy="24" r="7" fill="#e95767" />
          <circle cx="70" cy="33" r="7" fill="#e95767" />
          <path
            d="M10 66Q50 58 90 66L84 91Q50 84 16 91Z"
            fill="#b93642"
            stroke="#742c2d"
            strokeWidth="4"
          />
          <path
            d="M16 70Q50 63 84 70"
            fill="none"
            stroke="#f26a69"
            strokeWidth="3"
          />
          <text
            x="50"
            y="84"
            textAnchor="middle"
            fontFamily="Arial Black, sans-serif"
            fontSize="19"
            fontWeight="900"
            fill="#ffe45f"
            stroke="#6f2929"
            strokeWidth="3"
            paintOrder="stroke"
          >
            BONUS
          </text>
        </>
      )}
    </svg>
  );
});
