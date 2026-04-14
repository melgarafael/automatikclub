export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[9999] focus:rounded-[2px] focus:bg-blue focus:px-3 focus:py-2 focus:font-body focus:text-[13px] focus:font-medium focus:text-black"
    >
      Pular para conteudo principal
    </a>
  );
}

export default SkipToContent;
