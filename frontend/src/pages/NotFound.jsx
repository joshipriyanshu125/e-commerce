import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-7xl font-bold">404</h1>

      <p className="mt-4 text-gray-500">
        Page Not Found
      </p>

      <Link
        to="/"
        className="mt-6 px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;