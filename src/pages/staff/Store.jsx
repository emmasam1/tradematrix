

import React, { useState, useEffect, useRef } from "react";
import { Button, Modal, Card, message, Input, Divider } from "antd";
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
          `${baseUrl}/sell-receipt`,
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
    <div className="p-4">
      {contextHolder}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Products Grid */}
        <div className="lg:w-2/3 w-full">
          <div className="mb-4">
            <Input
              placeholder="Search rugs by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
              allowClear
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-10"><DotLoader color="#2563eb" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products
                .filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((product) => (
                  <Card
                    key={product._id}
                    hoverable
                    onClick={() => product.quantity > 0 && handleProductClick(product)}
                    className={product.quantity === 0 ? "opacity-50" : ""}
                    cover={<img alt="product" src={product.image || product_default} className="h-32 object-contain p-2" />}
                  >
                    <div className="text-xs font-bold truncate">{product.title}</div>
                    <div className="text-blue-600 font-bold text-sm">₦{product.pricePerSquareMeter?.toLocaleString()}/m²</div>
                    <div className={product.quantity < 5 ? "text-red-500 text-[10px]" : "text-green-600 text-[10px]"}>
                      Stock: {product.quantity}
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="lg:w-1/3 w-full">
          <div className="bg-white p-4 rounded-xl shadow-sm border sticky top-4">
            <h2 className="text-lg font-bold mb-2">Checkout Cart</h2>
            
            {/* Customer Inputs */}
            <div className="space-y-2 mb-4">
               <Input 
                 placeholder="Customer Name" 
                 value={customerName} 
                 onChange={(e) => setCustomerName(e.target.value)} 
               />
               <Input 
                 placeholder="Phone Number" 
                 value={customerPhone} 
                 onChange={(e) => setCustomerPhone(e.target.value)} 
               />
            </div>
            
            <Divider className="my-2" />

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {cart.map((item, index) => (
                <div key={index} className="border p-3 rounded-lg bg-gray-50">
                  <div className="flex justify-between font-bold text-sm mb-2">
                    <span className="truncate w-4/5">{item.title}</span>
                    <IoCloseOutline className="text-red-500 cursor-pointer" onClick={() => setCart(cart.filter((_, i) => i !== index))} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Len (m)</label>
                      <Input type="number" size="small" value={item.length} onChange={(e) => updateCartItem(index, "length", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Wid (m)</label>
                      <Input type="number" size="small" value={item.width} onChange={(e) => updateCartItem(index, "width", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Rate</label>
                      <Input type="number" size="small" value={item.negotiatedPrice} onChange={(e) => updateCartItem(index, "negotiatedPrice", e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <RiSubtractFill className="bg-white border rounded p-1 cursor-pointer" onClick={() => updateCartItem(index, "quantity", Math.max(1, item.quantity - 1))} />
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <IoAdd className="bg-white border rounded p-1 cursor-pointer" onClick={() => updateCartItem(index, "quantity", item.quantity + 1)} />
                    </div>
                    <span className="text-xs font-bold text-blue-700">
                      ₦{(item.length * item.width * item.negotiatedPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button type="primary" block size="large" className="mt-6 h-12 bg-blue-600" onClick={logReceipt} disabled={cart.length === 0}>
              Preview & Generate
            </Button>
          </div>
        </div>
      </div>

      <Modal open={isModalVisible} onCancel={() => setIsModalVisible(false)} width={900} footer={[
        <Button key="close" onClick={() => setIsModalVisible(false)}>Cancel</Button>,
        <Button key="print" type="primary" className="bg-blue-600" onClick={handlePrint} loading={loading}>Complete Sale & Print</Button>
      ]}>
        {receiptLoading ? <div className="h-60 flex justify-center items-center"><DotLoader color="#2563eb" /></div> : (
          <Receipt ref={receiptRef} receiptData={receiptData} receiptNumber={receiptNumber} />
        )}
      </Modal>
    </div>
  );
};

export default Store;