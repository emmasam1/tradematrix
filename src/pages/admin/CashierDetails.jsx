import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Table, Button, Card, Statistic, Row, Col, Tag, Space, message, Spin } from "antd";
import { ArrowLeftOutlined, ShoppingCartOutlined, DollarOutlined, PercentageOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import dayjs from "dayjs";

const CashierDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { baseUrl, token } = useAuthConfig();
  
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const fetchCashierDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/cashier/${id}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setDetails(response.data.summary);
      setTransactions(response.data.transactions);

    } catch (err) {
      console.error("Error fetching cashier details:", err);
      message.error("Could not load cashier performance details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCashierDetails();
  }, [id]);

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("DD MMM YYYY, hh:mm A"),
    },
    {
      title: "Product",
      dataIndex: "productTitle",
      key: "productTitle",
      render: (text) => <span className="font-medium text-gray-700">{text}</span>,
    },
    {
      title: "Area (sqm)",
      dataIndex: "area",
      key: "area",
      render: (val) => `${val} sqm`,
    },
    {
      title: "Price/sqm",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (val) => `₦${val.toLocaleString()}`,
    },
    {
      title: "Amount Paid",
      dataIndex: "amountPaid",
      key: "amountPaid",
      render: (val) => <span className="text-emerald-600 font-bold">₦{val.toLocaleString()}</span>,
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      render: (val) => (
        <Tag color={val > 0 ? "volcano" : "blue"}>
          {val > 0 ? `-₦${val.toLocaleString()}` : "None"}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading Performance Data..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation & Header */}
      <div className="mb-6 flex items-center justify-between">
        <Space size="middle">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold m-0">{details?.name}'s Performance</h1>
        </Space>
        <Tag color="cyan" className="px-3 py-1 text-sm uppercase">Cashier: {details?.name}</Tag>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border-t-4 border-emerald-500">
            <Statistic 
              title="Total Revenue Generated" 
              value={details?.totalSales} 
              prefix={<DollarOutlined />} 
              precision={2}
              formatter={(val) => `₦${val.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border-t-4 border-blue-500">
            <Statistic 
              title="Transactions Completed" 
              value={details?.transactions} 
              prefix={<ShoppingCartOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="shadow-sm border-t-4 border-orange-500">
            <Statistic 
              title="Avg Negotiation Loss" 
              value={details?.discountPercentage} 
              prefix={<PercentageOutlined />} 
              suffix="%" 
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Transaction Breakdown */}
      <Card title="Detailed Sales Breakdown" className="shadow-sm rounded-xl overflow-hidden">
        <Table
          dataSource={transactions}
          columns={columns}
          size="small"
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          className="border-t border-gray-100 custom-pagination"
        />
      </Card>
    </div>
  );
};

export default CashierDetails;