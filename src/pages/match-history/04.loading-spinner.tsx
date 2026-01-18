import { LoadingSpinner as SharedLoadingSpinner } from "../../components/LoadingSpinner";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-6 sm:py-8">
      <SharedLoadingSpinner size="sm" />
    </div>
  );
}
