import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import DotLoader from "react-spinners/DotLoader";
import { useReactToPrint } from "react-to-print";
import Receipt from "../../components/receipt/Receipt";

const ReceiptSearch = () => {
  const { baseUrl, token } = useAuthConfig();

  const [searchLoading, setSearchLoading] = useState(false);
  const [rePrintLoading, setReprintLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [receiptData, setReceiptData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [products, setProducts] = useState([]);

  const receiptRef = useRef();

  /* ---------------- FETCH PRODUCTS ---------------- */

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${baseUrl}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProducts(response.data.products);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    fetchProducts();
  }, [token]);

  /* ---------------- SEARCH RECEIPT ---------------- */

  const onFinish = async ({ receiptId }) => {
    setSearchLoading(true);

    try {
      const response = await axios.get(
        `${baseUrl}/receipts/search?receiptCode=${receiptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const receipt = response.data.receipt;

      const enrichedProducts = receipt.products.map((item) => {
        const product = products.find((p) => p._id === item.product);

        return {
          ...item,
          productDetails: product || null,
        };
      });

      const enrichedReceipt = {
        ...receipt,
        enrichedProducts,
      };

      setReceiptData(enrichedReceipt);
      setIsModalVisible(true);

      messageApi.success("Receipt loaded successfully.");
    } catch (error) {
      console.error("Error fetching receipt:", error);

      messageApi.error(
        error?.response?.data?.message || "Error searching receipt."
      );
    } finally {
      setSearchLoading(false);
    }
  };

  /* ---------------- PRINT RECEIPT ---------------- */

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,

    onBeforePrint: async () => {
      if (!receiptData?._id) return;

      setReprintLoading(true);

      try {
        await axios.post(
          `${baseUrl}/receipts/reprint`,
          { receiptId: receiptData._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        messageApi.success("Receipt re-printed!");
      } catch (error) {
        console.error(error);
        messageApi.error(error?.response?.data?.message || "Re-print failed");
      } finally {
        setReprintLoading(false);
      }
    },

    onAfterPrint: () => {
      setIsModalVisible(false);
    },
  });

  /* ---------------- FETCH ALL RECEIPTS ---------------- */

  const getAllReceipt = async () => {
    setFetchLoading(true);

    try {
      const response = await axios.get(`${baseUrl}/receipts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(response.data);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      messageApi.error("Error fetching receipt.");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getAllReceipt();
    }
  }, [token]);

  /* ---------------- RENDER ---------------- */

  return (
    <div className="p-2">
      {contextHolder}

      <div className="flex justify-end">
        <Form form={form} onFinish={onFinish} layout="inline">
          <Form.Item
            name="receiptId"
            rules={[
              { required: true, message: "Please enter receipt ID" },
              { pattern: /^\d+$/, message: "Must be numeric" },
            ]}
          >
            <Input
              placeholder="Enter receipt ID"
              maxLength={10}
              style={{ width: 250 }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={searchLoading}>
              Search Receipt
            </Button>
          </Form.Item>
        </Form>
      </div>

      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={900}
        footer={
          <Button
            type="primary"
            onClick={handlePrint}
            loading={rePrintLoading}
          >
            Re-Print Receipt
          </Button>
        }
      >
        {searchLoading ? (
          <div className="flex justify-center p-10">
            <DotLoader color="#1890ff" size={60} />
          </div>
        ) : (
          <Receipt ref={receiptRef} receiptData={receiptData} />
        )}
      </Modal>
    </div>
  );
};

export default ReceiptSearch;