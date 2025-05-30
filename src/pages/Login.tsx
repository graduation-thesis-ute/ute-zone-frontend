import { LockIcon, MailIcon } from "lucide-react";
import InputField from "../components/InputField";
import { useEffect, useState } from "react";
import { useLoading } from "../hooks/useLoading";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS của react-toastify
import { remoteUrl } from "../types/constant";
import Button from "../components/Button";
import { useNavigate, useLocation } from "react-router-dom";
import { LoadingDialog } from "../components/Dialog";
import UTELogo from "../assets/ute_logo_hcmute.png";
import LoginPageLogo from "../assets/login-page.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, showLoading, hideLoading } = useLoading();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });

  // Kiểm tra lỗi từ query parameter
  useEffect(() => {
    console.log("location", location);
    const queryParams = new URLSearchParams(location.search);
    const error = queryParams.get("error");
    const token = queryParams.get("token");

    console.log("Query params:", { error, token }); // Debug query params

    if (error) {
      const decodedError = decodeURIComponent(error);
      console.log("Detected error:", decodedError);
      toast.error(decodedError, {
        autoClose: 5000,
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }

    if (token) {
      console.log("Detected token:", token);
      localStorage.setItem("accessToken", token);
      navigate("/");
      // Trì hoãn reload để đảm bảo toast hiển thị (nếu cần)
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [location, navigate]);

  // Validation
  const validate = (field: string, value: string) => {
    const newErrors = { ...errors };
    if (field === "username") {
      if (!value.trim()) {
        newErrors.username = "Tên đăng nhập không được bỏ trống";
      } else {
        newErrors.username = "";
      }
    }
    if (field === "password") {
      if (!value.trim()) {
        newErrors.password = "Mật khẩu không được bỏ trống";
      } else if (value.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      } else {
        newErrors.password = "";
      }
    }
    setErrors(newErrors);
  };

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    validate(field, value);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    Object.keys(form).forEach((field) => {
      if (!form[field as keyof typeof form].trim()) {
        newErrors[field as keyof typeof errors] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } không được bỏ trống`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Xử lý đăng nhập thông thường
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    showLoading();
    try {
      const response = await fetch(`${remoteUrl}/v1/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      const data = await response.json();
      localStorage.setItem("accessToken", data.data.accessToken);
      navigate("/");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      hideLoading();
    }
  };

  // Xử lý đăng nhập Google
  const handleGoogleLogin = () => {
    window.location.href = `${remoteUrl}/v1/user/auth/google`;
  };

  return (
    <div className="min-h-screen flex bg-blue-500">
      <div className="w-1/3 flex items-center justify-center p-8">
        <div className="text-white">
          <img
            src={UTELogo}
            alt="UTE Zone logo"
            className="w-full md:w-1/4 lg:w-1/6 mb-4"
          />
          <h1 className="text-4xl font-bold mb-4">UTE Zone</h1>
          <img src={LoginPageLogo} alt="Illustration" className="mb-4" />
        </div>
      </div>
      <div className="w-2/3 bg-white flex items-center justify-center p-8 rounded-s-3xl">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-bold text-center mb-6">Đăng nhập</h2>
          <InputField
            title="Tên đăng nhập"
            isRequire={true}
            placeholder="Nhập email, SĐT hoặc MSSV"
            onChangeText={(value: any) => handleChange("username", value)}
            value={form.username}
            icon={MailIcon}
            error={errors.username}
          />
          <InputField
            title="Mật khẩu"
            isRequire={true}
            placeholder="Nhập mật khẩu"
            onChangeText={(value: any) => handleChange("password", value)}
            value={form.password}
            icon={LockIcon}
            secureTextEntry={!showPassword}
            togglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
            error={errors.password}
          />
          <div className="text-sm text-right">
            <a
              href="/forgot-password"
              className="font-medium text-blue-800 hover:text-indigo-500"
            >
              Quên mật khẩu?
            </a>
          </div>

          <Button title="Đăng nhập" color="royalblue" onPress={handleSubmit} />

          <div className="mt-4 flex items-center justify-center">
            <div className="border-t border-gray-300 flex-grow mr-3"></div>
            <span className="text-gray-500 text-sm">hoặc</span>
            <div className="border-t border-gray-300 flex-grow ml-3"></div>
          </div>

          <button
            className="mt-4 w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 transition-colors"
            onClick={handleGoogleLogin}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="mr-2">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.20-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Đăng nhập với Google
          </button>

          <p className="mt-4 text-center">
            Bạn chưa có tài khoản?{" "}
            <a href="/register" className="text-blue-800 hover:underline">
              Đăng ký ngay
            </a>
          </p>
        </div>
      </div>
      <LoadingDialog isVisible={isLoading} />
    </div>
  );
};

export default Login;
