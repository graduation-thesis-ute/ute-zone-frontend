import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";
import Loading from "./pages/Loading";
import { useEffect, useState } from "react";
import useFetch from "./hooks/useFetch";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS của react-toastify
import PagePostDetail from "./components/page/PagePostDetail";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { post, loading } = useFetch();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        const res = await post("/v1/user/verify-token", { accessToken: token });
        if (res.result) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("accessToken");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Verify token error:", error);
        localStorage.removeItem("accessToken");
        setIsAuthenticated(false);
      }
    };

    checkToken();
  }, []);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <Routes>
            {isAuthenticated ? (
              <>
                <Route path="/" element={<Home />} />
                <Route
                  path="/pages/:pageId/posts/:postId"
                  element={<PagePostDetail />}
                />
              </>
            ) : (
              <>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </>
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
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
          />
        </>
      )}
    </>
  );
};

export default App;
