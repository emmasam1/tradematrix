import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { Input, Form, Button, message } from "antd";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { baseUrl, saveToken } = useAuthConfig();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/login`, values);
      saveToken(response.data.token, response.data.user);

      messageApi.success("Login successful");

      if (response.data.user.role === "super_admin") {
        navigate("/dashboard");
        console.log(response)
      } else if (response.data.user.role === "cashier") {
        console.log(response)
        navigate("/store");
      }
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f5f2]">
      {contextHolder}

      {/* LEFT SIDE - IMAGE */}
      <div className="hidden lg:flex w-1/2 relative h-screen">
        <img
          src="/rug_bg.jpg"
          alt="Luxury Rug Showroom"
          className="object-cover w-full h-full"
        />

        {/* Elegant Overlay */}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Premium Rug Management
          </h2>
          <p className="text-lg text-gray-200 max-w-md">
            Seamlessly manage rug sales, inventory, and showroom operations
            with our specialized POS system.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="flex w-full lg:w-1/2 justify-center items-center px-6 sm:px-10 lg:px-20">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">
              
            </h1>
            <p className="text-gray-500">
              Sign in to access your sales dashboard
            </p>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Enter a valid email address" },
              ]}
            >
              <Input size="large" placeholder="you@rugbusiness.com" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
                { min: 6, message: "Minimum 6 characters required" },
              ]}
            >
              <Input.Password size="large" placeholder="Enter password" />
            </Form.Item>

            {/* <div className="flex justify-between items-center mb-6">
              <NavLink
                to="/reset-password"
                className="text-sm text-amber-700 hover:underline"
              >
                Forgot password?
              </NavLink>
            </div> */}

            <Button
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="!rounded-lg !bg-amber-700 hover:!bg-amber-800 !text-white"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;