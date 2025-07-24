import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload,
  useLoaderData,
  useLocation
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// CSS imports
import "./styles/global.css";
import "./styles/components.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap",
  },
  {
    rel: "stylesheet", 
    href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@100;200;300;400;500;600;700;800;900&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  // Get theme from cookies or default to light
  const cookieHeader = request.headers.get("Cookie");
  const theme = cookieHeader?.includes("theme=dark") ? "dark" : "light";
  const language = cookieHeader?.includes("language=en") ? "en" : "bn";

  return json({
    theme,
    language,
    ENV: {
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  
  return (
    <html lang={data?.language || "bn"} className={data?.theme || "light"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Vehicle Management System - যানবাহন ব্যবস্থাপনা সিস্টেম" />
        <title>Vehicle Management System</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 font-bengali">
        <div id="root">
          {children}
        </div>
        
        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={data?.theme || "light"}
          toastClassName="font-bengali"
        />
        
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        
        {/* Global environment variables */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data?.ENV)}`,
          }}
        />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login" || location.pathname === "/";

  return (
    <div className="min-h-screen">
      {isLoginPage ? (
        // Login page layout
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <Outlet />
        </div>
      ) : (
        // Main application layout
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </div>
      )}
    </div>
  );
}

// Error boundary
export function ErrorBoundary() {
  return (
    <html lang="bn" className="light">
      <head>
        <title>Error - Vehicle Management System</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 font-bengali">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              আমরা দুঃখিত, কিছু একটা ভুল হয়েছে। পেইজটি রিফ্রেশ করে চেষ্টা করুন।
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Refresh Page / পেইজ রিফ্রেশ করুন
            </button>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
