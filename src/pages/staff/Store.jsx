import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, Card, message, Input, Divider, Popconfirm } from "antd";
import { IoAdd, IoCloseOutline } from "react-icons/io5";
import { RiSubtractFill } from "react-icons/ri";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import Receipt from "../../components/receipt/Receipt";
import product_default from "../../assets/product-default.png";
import { useAuthConfig } from "../../context/AppState";
import DotLoader from "react-spinners/DotLoader";

const Store = () => {
  const [loading, setLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [receiptId, setReceiptId] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const { baseUrl, token } = useAuthConfig();
  const receiptRef = useRef();
  const [searchTerm, setSearchTerm] = useState("");
  const [receiptData, setReceiptData] = useState(null);

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(data.products || []);
    } catch (error) {
      messageApi.error("Failed to fetch products.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProducts();
  }, [baseUrl, token]);

  const handleProductClick = (product) => {
    const index = cart.findIndex((item) => item._id === product._id);
    if (index !== -1) {
      const updatedCart = [...cart];
      updatedCart[index].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          length: 0,
          width: 0,
          negotiatedPrice: product.pricePerSquareMeter,
        },
      ]);
    }
  };

  const updateCartItem = (index, field, value) => {
    const updatedCart = [...cart];
    updatedCart[index][field] = value === "" ? "" : Number(value);
    setCart(updatedCart);
  };

  const logReceipt = async () => {
    if (cart.length === 0) return messageApi.warning("Cart is empty");

    setIsModalVisible(true);
    setReceiptLoading(true);

    try {
      const payload = {
        products: cart.map((item) => ({
          productId: item._id,
          quantitySold: Number(item.quantity) || 1,
          length: Number(item.length) || 0,
          width: Number(item.width) || 0,
          negotiatedPrice: Number(item.negotiatedPrice) || 0,
        })),
        customerName: customerName || "Walking Customer",
        customerPhone: customerPhone || "N/A",
      };

      const { data } = await axios.post(
        `${baseUrl}/receipts/preview`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReceiptData(data.receipt);
      setReceiptId(data.receipt._id);
      setReceiptNumber(data.receipt.receiptCode);
    } catch (error) {
      messageApi.error("Failed to generate receipt preview.");
      setIsModalVisible(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    onBeforePrint: async () => {
      setLoading(true);
      try {
        await axios.post(
          `${baseUrl}/receipts/finalize`,
          { receiptId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        messageApi.success("Sale completed successfully!");
        fetchProducts(true);
        return true;
      } catch (error) {
        messageApi.error(error.response?.data?.message || "Sale failed.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    onAfterPrint: () => {
      setIsModalVisible(false);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
    },
  });

  return (
    <div className="p-6 min-h-screen">
      {contextHolder}

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Products */}
        <div className="lg:w-2/3 w-full">
          <Input
            placeholder="Search rugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="large"
            allowClear
            className="mb-5"
          />

          {loading ? (
            <div className="flex justify-center py-20">
              <DotLoader color="#2563eb" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {products
                .filter((p) =>
                  p.title.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product) => (
                  <Card
                    key={product._id}
                    hoverable
                    onClick={() =>
                      product.quantity > 0 && handleProductClick(product)
                    }
                    className={`rounded-xl transition-all ${
                      product.quantity === 0 ? "opacity-50" : ""
                    }`}
                    cover={
                      <img
                        alt="product"
                        src={product.image || product_default}
                        className="h-36 object-contain p-4"
                      />
                    }
                  >
                    <div className="font-semibold text-sm truncate">
                      {product.title}
                    </div>

                    <div className="text-blue-600 font-bold text-sm mt-1">
                      ₦{product.pricePerSquareMeter?.toLocaleString()}/m²
                    </div>

                    <div
                      className={`text-xs mt-1 ${
                        product.quantity < 5
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      Stock: {product.quantity}
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="lg:w-1/3 w-full">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Checkout Cart</h2>

            <div className="space-y-3 mb-4">
              <Input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mb-3!"
              />

              <Input
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <Divider className="my-3" />

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {cart.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold truncate w-4/5">
                      {item.title}
                    </span>

                    <IoCloseOutline
                      className="text-red-500 cursor-pointer text-lg"
                      onClick={() =>
                        setCart(cart.filter((_, i) => i !== index))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      size="small"
                      value={item.length}
                      onChange={(e) =>
                        updateCartItem(index, "length", e.target.value)
                      }
                      placeholder="Length"
                    />

                    <Input
                      type="number"
                      size="small"
                      value={item.width}
                      onChange={(e) =>
                        updateCartItem(index, "width", e.target.value)
                      }
                      placeholder="Width"
                    />

                    <Input
                      type="number"
                      size="small"
                      value={item.negotiatedPrice}
                      onChange={(e) =>
                        updateCartItem(
                          index,
                          "negotiatedPrice",
                          e.target.value
                        )
                      }
                      placeholder="Rate"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"
                        onClick={() =>
                          updateCartItem(
                            index,
                            "quantity",
                            Math.max(1, item.quantity - 1)
                          )
                        }
                      >
                        <RiSubtractFill size={16} />
                      </button>

                      <span className="min-w-[28px] text-center font-semibold text-sm">
                        {item.quantity}
                      </span>

                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition"
                        onClick={() =>
                          updateCartItem(index, "quantity", item.quantity + 1)
                        }
                      >
                        <IoAdd size={16} />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-blue-700">
                      ₦
                      {(
                        item.length *
                        item.width *
                        item.negotiatedPrice *
                        item.quantity
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="primary"
              block
              size="large"
              className="mt-6 h-12 bg-blue-600"
              onClick={logReceipt}
              disabled={cart.length === 0}
            >
              Preview & Generate
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,

          <Popconfirm
            key="confirm"
            title="Confirm Payment"
            description="Has the customer completed the payment?"
            okText="Yes, Payment Received"
            cancelText="No"
            onConfirm={handlePrint}
          >
            <Button
              type="primary"
              className="bg-blue-600"
              loading={loading}
            >
              Complete Sale & Print
            </Button>
          </Popconfirm>,
        ]}
      >
        {receiptLoading ? (
          <div className="h-60 flex justify-center items-center">
            <DotLoader color="#2563eb" />
          </div>
        ) : (
          <Receipt
            ref={receiptRef}
            receiptData={receiptData}
            receiptNumber={receiptNumber}
          />
        )}
      </Modal>
    </div>
  );
};

export default Store;