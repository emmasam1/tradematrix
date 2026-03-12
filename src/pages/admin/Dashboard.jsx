import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import { message, DatePicker, Table, Select, Spin, Button, Space } from "antd";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import DotLoader from "react-spinners/DotLoader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import the function directly
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);


const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF6666",
  "#A28CFF", "#33CCCC", "#FF33A1", "#66FF66", "#FF9933",
];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesTrends, setSalesTrends] = useState([]);
  const [cashierBreakdown, setCashierBreakdown] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dailySales, setDailySales] = useState(0);
  const [viewChart, setViewChart] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const [messageApi, contextHolder] = message.useMessage();
  const { baseUrl, token } = useAuthConfig();
  const navigate = useNavigate();

  const fetchDashboardData = async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await axios.get(
        `${baseUrl}/dashboard?month=${selectedMonth}&year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      setSummary(data.monthlySummary || {});
      setSalesTrends(data.salesTrends || []);
      setTopProducts(data.topProducts || []);
      setCashierBreakdown(data.cashierBreakdown || []);
      setCategorySummary(data.categorySummary || []);
      
      const selectedStr = selectedDate.format("YYYY-MM-DD");
      const found = data.salesTrends?.find(item => item.date === selectedStr);
      setDailySales(found?.totalSales || 0);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      messageApi.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear, token]);

  const handleDateChange = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const selectedStr = date.format("YYYY-MM-DD");
    const found = salesTrends.find(item => item.date === selectedStr);
    setDailySales(found?.totalSales || 0);
  };

const downloadPDFReport = () => {
    const doc = new jsPDF();
    const dateStr = dayjs().format("YYYY-MM-DD_HH-mm");

    // Helper to replace the Naira symbol with "N" to avoid encoding errors
    const formatCurrencyForPDF = (val) => {
      if (!val) return "N0.00";
      // Replaces the Unicode Naira symbol with a standard 'N'
      return typeof val === "string" ? val.replace(/₦/g, "N") : `N${val.toLocaleString()}`;
    };

    doc.setFontSize(18);
    doc.text("Sales Dashboard Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Period: ${dayjs().month(selectedMonth - 1).format("MMMM")} ${selectedYear}`, 14, 30);
    doc.text(`Generated on: ${dayjs().format("lll")}`, 14, 37);

    // Summary Statistics
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Monthly Revenue', formatCurrencyForPDF(summary.formattedActualRevenue)],
        ['Potential Revenue', formatCurrencyForPDF(summary.formattedPotentialRevenue)],
        ['Negotiation Loss Rate', `${summary.negotiationLossRate || 0}%`],
        ['Total Transactions', summary.totalTransactions || 0],
        ['Total Area Sold', summary.formattedAreaSold || "0 sqm"],
      ],
      theme: 'striped',
      headStyles: { fillStyle: [31, 41, 55] },
    });

    const finalY = doc.lastAutoTable.finalY;

    // Top Products Table
    doc.setFontSize(14);
    doc.text("Top Selling Products", 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Product', 'Qty Sold', 'Revenue']],
      body: topProducts.map(p => [
        p.title, 
        p.totalSold, 
        formatCurrencyForPDF(p.formattedRevenue)
      ]),
      theme: 'grid',
      headStyles: { fillStyle: [79, 70, 229] },
    });

    doc.save(`Dashboard_Report_${dateStr}.pdf`);
  };
  const productColumns = [
    { title: "Product Name", dataIndex: "title", key: "title" },
    { title: "Qty Sold", dataIndex: "totalSold", key: "totalSold" },
    { title: "Revenue", dataIndex: "formattedRevenue", key: "formattedRevenue" },
  ];

  const cashierColumns = [
    { title: "Cashier", dataIndex: "name", key: "name" },
    { title: "Transactions", dataIndex: "transactions", key: "transactions" },
    { title: "Sales", dataIndex: "formattedSales", key: "formattedSales" },
    { 
        title: "Loss Rate", 
        dataIndex: "discountPercentage", 
        key: "discountPercentage",
        render: (val) => `${val}%`
    },
  ];

  return (
    <div className="p-4">
      {contextHolder}
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Business Overview</h1>
        <Button 
          type="primary" 
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          onClick={downloadPDFReport}
        >
          📄 Download PDF Report
        </Button>
      </div>

      {refreshing && (
        <div className="absolute top-4 right-6 z-10">
          <Spin size="small" />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-white/20 p-3 rounded-lg text-xl">💰</div>
            <div className="text-right">
              <p className="opacity-80 text-sm">Monthly Revenue</p>
              <h2 className="font-bold text-2xl">{summary.formattedActualRevenue || "₦0.00"}</h2>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Select
              size="small"
              className="w-full"
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: dayjs().month(i).format("MMMM"),
              }))}
            />
            <Select
              size="small"
              value={selectedYear}
              onChange={setSelectedYear}
              options={[2024, 2025, 2026].map(y => ({ value: y, label: y }))}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-white/20 p-3 rounded-lg text-xl">📅</div>
            <div className="text-right">
              <p className="opacity-80 text-sm">Daily Sales</p>
              <h2 className="font-bold text-2xl">₦{dailySales.toLocaleString()}</h2>
            </div>
          </div>
          <DatePicker
            size="small"
            className="w-full"
            allowClear={false}
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl shadow-lg p-4">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-lg text-xl">📈</div>
            <div className="ml-4">
              <p className="opacity-80 text-sm">Potential Revenue</p>
              <h2 className="font-bold text-2xl">{summary.formattedPotentialRevenue || "₦0.00"}</h2>
              <p className="text-xs">Loss Rate: {summary.negotiationLossRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow-lg p-4">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-lg text-xl">🧾</div>
            <div className="ml-4">
              <p className="opacity-80 text-sm">Transactions</p>
              <h2 className="font-bold text-2xl">{summary.totalTransactions || 0}</h2>
              <p className="text-xs">Area Sold: {summary.formattedAreaSold || "0 sqm"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h2 className="font-bold text-gray-700 mb-4">Top Selling Products</h2>
          <Table
            loading={loading}
            size="small"
            columns={productColumns}
            dataSource={topProducts}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h2 className="font-bold text-gray-700 mb-4">7-Day Sales Trend</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrends}>
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(val) => `₦${val.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalSales" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700">Cashier Performance</h2>
            <Button 
              type="primary" 
              size="small"
              ghost
              onClick={() => setViewChart(!viewChart)}
            >
              {viewChart ? "Show Table" : "Show Chart"}
            </Button>
          </div>
          
          {viewChart ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashierBreakdown}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(val) => `₦${val.toLocaleString()}`} />
                  <Bar dataKey="totalSales" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Table
              loading={loading}
              size="small"
              columns={cashierColumns}
              dataSource={cashierBreakdown}
              rowKey="cashierId"
              pagination={{ pageSize: 5 }}
              onRow={(record) => ({
                onClick: () => navigate(`/dashboard/cashier-details/${record.cashierId}`),
                className: "cursor-pointer hover:bg-blue-50 transition-colors"
              })}
            />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h2 className="font-bold text-gray-700 mb-4">Sales by Category</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySummary}
                  dataKey="totalSales"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.categoryName}
                >
                  {categorySummary.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `₦${val.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;