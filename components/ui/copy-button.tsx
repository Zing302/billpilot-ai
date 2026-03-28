type CopyButtonProps = {
  copied: boolean;
  onCopy: () => Promise<void>;
};

export function CopyButton({ copied, onCopy }: CopyButtonProps) {
  return (
    <button className="secondary-button copy-button" onClick={onCopy} type="button">
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
