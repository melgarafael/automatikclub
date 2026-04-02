export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="fixed left-2 top-2 z-[9999] -translate-y-full rounded-[2px] bg-blue px-3 py-2 font-body text-[13px] font-medium text-black transition-transform duration-150 focus:translate-y-0"
    >
      Pular para conteudo principal
    </a>
  );
}

export default SkipToContent;
