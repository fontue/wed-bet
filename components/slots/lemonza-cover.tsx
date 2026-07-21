export function LemonzaCover() {
  return (
    <div className="relative h-full min-h-52 overflow-hidden bg-[linear-gradient(165deg,#5aa6c9_0%,#8ed3de_38%,#f6d876_39%,#f3c757_100%)]">
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(150deg,#fff8e5_0_48%,#e9d9b7_49%_100%)]" />
      <div className="absolute -left-10 -top-12 size-44 rounded-full bg-[#f3d447] shadow-[inset_-12px_-12px_0_#dda936]" />
      <svg
        viewBox="0 0 400 220"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          d="M0 70c70 30 110-20 180 15s135-20 220 5v65H0Z"
          fill="#3788a7"
          opacity=".55"
        />
        <path d="M0 160h400v60H0Z" fill="#fff6dc" />
        <path
          d="m0 180 40-20 40 20 40-20 40 20 40-20 40 20 40-20 40 20 40-20 40 20"
          fill="none"
          stroke="#397ca0"
          strokeWidth="8"
          opacity=".55"
        />
        <path
          d="M330 0c-8 40-31 73-68 100"
          fill="none"
          stroke="#376847"
          strokeWidth="8"
        />
        <g fill="#72a557">
          {[
            [292, 45],
            [321, 29],
            [270, 70],
            [343, 51],
            [251, 92],
          ].map(([x, y], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="17"
              ry="8"
              transform={`rotate(-35 ${x} ${y})`}
            />
          ))}
        </g>
        <g fill="#f2d13e" stroke="#d5a72f" strokeWidth="2">
          {[
            [310, 57],
            [350, 29],
            [277, 93],
          ].map(([x, y], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="14"
              ry="11"
              transform={`rotate(-20 ${x} ${y})`}
            />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="serif rotate-[-3deg] text-4xl font-black text-white [text-shadow:0_3px_0_#22624e,0_6px_14px_rgba(0,0,0,.25)] sm:text-5xl">
          Sweet
          <br />
          <span className="text-[#f7db50]">Lemonza</span>
        </span>
        <span className="mt-2 rounded-full bg-[#174b38]/85 px-4 py-1 text-[.6rem] font-extrabold uppercase tracking-[.2em] text-white">
          La Dolce Vita Spins
        </span>
      </div>
    </div>
  );
}
