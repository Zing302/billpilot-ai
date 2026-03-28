type StatusMessageProps = {
  text: string;
  isError?: boolean;
};

export function StatusMessage({ text, isError = false }: StatusMessageProps) {
  return (
    <p className={isError ? "status status-error" : "status"} role="status" aria-live="polite">
      {text}
    </p>
  );
}
