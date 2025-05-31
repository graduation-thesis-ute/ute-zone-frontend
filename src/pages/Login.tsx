import { LockIcon, MailIcon } from "lucide-react";
import InputField from "../components/InputField";
import { useEffect, useState } from "react";
import { useLoading } from "../hooks/useLoading";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { remoteUrl } from "../types/constant";
import Button from "../components/Button";
import { useNavigate, useLocation } from "react-router-dom";
import { LoadingDialog } from "../components/Dialog";
import UTELogo from "../assets/ute_logo_hcmute.png";
import LoginPageLogo from "../assets/login-page.png";
import GoogleIcon from "../assets/google.png";
import { useGoogleLogin } from "@react-oauth/google";

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

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const error = queryParams.get("error");
    const token = queryParams.get("token");

    if (error) {
      const decodedError = decodeURIComponent(error);
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
      localStorage.setItem("accessToken", token);
      navigate("/");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [location, navigate]);

  const validate = (field: string, value: string) => {
    const newErrors = { ...errors };
    if (field === "username") {
      newErrors.username = !value.trim()
        ? "Tên đăng nhập không được bỏ trống"
        : "";
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
        body: JSON.stringify(form),
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    showLoading();
    try {
      const response = await fetch(`${remoteUrl}/v1/user/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (!data.result) {
        throw new Error(data.message);
      }

      localStorage.setItem("accessToken", data.data.accessToken);
      navigate("/");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      hideLoading();
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      toast.error("Đăng nhập Google thất bại");
    },
    flow: "implicit",
  });

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

          <div className="mt-4">
            <button
              onClick={() => loginWithGoogle()}
              className="w-full h-12 bg-white text-gray-700 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50"
            >
              <img src={GoogleIcon} alt="Google" className="w-6 h-6" />
              <span>Đăng nhập bằng Google</span>
            </button>
          </div>

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
