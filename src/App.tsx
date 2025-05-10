import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./views/Login";
import Register from "./views/Register";
import ForgotPassword from "./views/ForgotPassword";
import Home from "./views/Home";
import Verify from "./views/Verify";
import NotFound from "./views/NotFound";
import Loading from "./views/Loading";
import { useEffect, useState } from "react";
import useFetch from "./hooks/useFetch";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS của react-toastify
import Chatbot from "./views/ChatBot";

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
          <BrowserRouter>
            <Routes>
              {isAuthenticated ? (
                <>
                  <Route path="/" element={<Home />} />
                  {/* <Route path="/friends" element={<Friend />} /> */}
                  {/* <Route path="/postPage" element={<PostPage />} /> */}\
                  <Route path="/chat" element={<Chatbot />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Login />} />{" "}
                  {/* Thêm route /login */}
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                </>
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
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
