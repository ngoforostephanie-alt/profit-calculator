import { useRouteError, Link } from "react-router";
import { AlertCircle, Home } from "lucide-react";

export function ErrorPage() {
  const error = useRouteError() as any;
  const errorCode = error?.status || 500;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center">
        <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-xl mb-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>

        <div className="text-6xl font-bold text-red-600 mb-2">
          {errorCode}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          We're terribly sorry!
        </h1>

        <p className="text-gray-600 mb-6">
          {error?.status === 404
            ? "The page you're looking for seems to have wandered off. It might have been moved or deleted."
            : "Something unexpected happened on our end. Our team has been notified and we're working to fix it."}
        </p>

        {error?.statusText && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
            <p className="text-sm text-gray-700">
              <strong>Error Code:</strong> {errorCode}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Details:</strong> {error.statusText}
            </p>
            {error?.message && (
              <p className="text-sm text-gray-600 mt-1">{error.message}</p>
            )}
          </div>
        )}

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Take Me Home
        </Link>
      </div>
    </div>
  );
}
