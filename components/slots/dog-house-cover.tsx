export function DogHouseCover() {
  return (
    <div className="relative h-full min-h-52 overflow-hidden bg-[linear-gradient(180deg,#79c8dc_0_48%,#7bc56a_49%_100%)]">
      <div className="absolute inset-x-0 bottom-0 h-[36%] bg-[repeating-linear-gradient(90deg,#f1ddb1_0_34px,#dfc18d_35px_68px)]" />
      <div className="absolute left-7 top-9 h-28 w-24 rounded-t-[3rem] border-[7px] border-[#8f4a32] bg-[#f1b44b]">
        <div className="absolute bottom-0 left-1/2 h-16 w-12 -translate-x-1/2 rounded-t-full bg-[#6f3429]" />
      </div>
      <div className="absolute right-8 top-7 text-6xl">🐕</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <strong className="rotate-[-3deg] font-[Georgia] text-4xl font-black leading-[.9] text-white [text-shadow:0_4px_0_#7e432c,0_8px_18px_rgba(0,0,0,.25)]">
          Casa degli
          <br />
          <span className="text-[#ffe05c]">Sposi</span>
        </strong>
        <span className="mt-3 rounded-full bg-[#773b2b]/90 px-4 py-1 text-[.58rem] font-black uppercase tracking-[.18em] text-white">
          Lucky Wedding Dogs
        </span>
      </div>
    </div>
  );
}
