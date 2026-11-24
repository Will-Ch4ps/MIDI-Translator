type Props = { message: string; onClose: () => void };

export function ErrorBar({ message, onClose }: Props) {
  return (
    <div className="errorbar" role="alert">
      <span className="errorbar__text">{message}</span>
      <button type="button" className="btn" onClick={onClose}>Fechar</button>
    </div>
  );
}
