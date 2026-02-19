interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium';
}

export function LoadingSpinner({ message, size = 'medium' }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner" />
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
}
