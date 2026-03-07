

import React from "react";
import { useAuthConfig } from "../../context/AppState";

const Receipt = React.forwardRef((props, ref) => {
  const { receiptNumber, receiptData } = props;
  const { user } = useAuthConfig();

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div ref={ref} style={{
      width: "210mm",
      minHeight: "297mm",
      padding: "40px",
      margin: "auto",
      background: "#fff",
      fontFamily: "'Helvetica', 'Arial', sans-serif",
      fontSize: "12px",
      color: "#000"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", color: "#1e3a8a", fontWeight: "900" }}>
          {user?.assignedShop?.name?.toUpperCase() || "GREY & GREMA CARPETS"}
        </h1>
        <p style={{ margin: "5px 0", fontSize: "11px", color: "#64748b" }}>
          IMPORTERS OF QUALITY PERSIAN RUGS & INTERIOR DECOR
        </p>
        <div style={{ marginTop: "10px", borderTop: "2px solid #1e3a8a", borderBottom: "2px solid #1e3a8a", padding: "8px 0" }}>
          <h2 style={{ margin: 0, fontSize: "16px", letterSpacing: "5px", fontWeight: "bold" }}>PROFORMA INVOICE</h2>
        </div>
      </div>

      {/* Meta Info */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px", backgroundColor: "#f8fafc", padding: "15px", borderRadius: "8px" }}>
        <div>
          <h4 style={{ margin: "0 0 8px 0", color: "#1e3a8a", fontSize: "10px", textTransform: "uppercase" }}>Bill To:</h4>
          <p style={{ margin: 0, fontWeight: "bold", fontSize: "15px" }}>{receiptData?.customerName || "Walking Customer"}</p>
          <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{receiptData?.customerPhone || "N/A"}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "2px 0" }}><strong>No:</strong> <span style={{ color: "#dc2626" }}>{receiptNumber}</span></p>
          <p style={{ margin: "2px 0" }}><strong>Date:</strong> {currentDate}</p>
          <p style={{ margin: "2px 0" }}><strong>Issued By:</strong> {user?.firstName} {user?.lastName}</p>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #1e3a8a" }}>
            <th style={th}>SN</th>
            <th style={{ ...th, textAlign: "left" }}>PRODUCT DESCRIPTION</th>
            <th style={th}>DIMENSIONS</th>
            <th style={th}>SQM</th>
            <th style={th}>QTY</th>
            <th style={th}>RATE (₦)</th>
            <th style={th}>TOTAL (₦)</th>
          </tr>
        </thead>
        <tbody>
          {receiptData?.products?.map((item, index) => {
            const totalSqm = item.dimensions?.totalSquareMeters || 0;
            const rate = totalSqm > 0 ? (item.negotiatedPriceAtSale / totalSqm) : 0;
            
            return (
              <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={td}>{index + 1}</td>
                <td style={{ ...td, textAlign: "left", fontWeight: "bold" }}>{item.title}</td>
                <td style={td}>{item.dimensions?.length}m x {item.dimensions?.width}m</td>
                <td style={td}>{totalSqm.toFixed(2)}</td>
                <td style={td}>{item.quantity}</td>
                <td style={td}>{rate.toLocaleString()}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: "bold" }}>
                  {(item.negotiatedPriceAtSale * item.quantity).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Section */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "280px", backgroundColor: "#f8fafc", padding: "20px", borderRadius: "8px" }}>
          <div style={sumRow}>
            <span style={{ color: "#64748b" }}>Gross Amount:</span>
            <span>₦{receiptData?.subTotal?.toLocaleString()}</span>
          </div>
          <div style={{ ...sumRow, color: "#dc2626" }}>
            <span>Negotiation Discount:</span>
            <span>- ₦{receiptData?.discountTotal?.toLocaleString()}</span>
          </div>
          <div style={{ ...sumRow, borderTop: "1px solid #cbd5e1", marginTop: "12px", paddingTop: "12px", fontWeight: "bold", fontSize: "18px", color: "#1e3a8a" }}>
            <span>Net Payable:</span>
            <span>₦{receiptData?.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer / Terms */}
      <div style={{ marginTop: "60px", padding: "20px", border: "1px dashed #cbd5e1", borderRadius: "8px" }}>
        <h4 style={{ margin: "0 0 10px 0", fontSize: "11px", color: "#1e3a8a" }}>TERMS & CONDITIONS:</h4>
        <ul style={{ margin: 0, paddingLeft: "15px", fontSize: "10px", color: "#64748b", lineHeight: "1.6" }}>
          <li>Goods sold in good condition are not returnable or exchangeable.</li>
          <li>This proforma is valid for 24 hours from the date of issue.</li>
          <li>Kindly ensure measurements are verified before installation.</li>
        </ul>
      </div>

      {/* Signature Area */}
      <div style={{ marginTop: "60px", display: "flex", justifyContent: "space-between" }}>
        <div style={sigBox}><div style={sigLine}></div><p style={{ fontSize: "10px", color: "#64748b" }}>Store Manager</p></div>
        <div style={sigBox}><div style={sigLine}></div><p style={{ fontSize: "10px", color: "#64748b" }}>Customer Acceptance</p></div>
      </div>
    </div>
  );
});

const th = { padding: "12px 5px", fontSize: "10px", color: "#1e3a8a", textTransform: "uppercase" };
const td = { padding: "15px 5px", textAlign: "center", fontSize: "11px" };
const sumRow = { display: "flex", justifyContent: "space-between", marginBottom: "10px" };
const sigBox = { width: "200px", textAlign: "center" };
const sigLine = { borderBottom: "1.5px solid #1e3a8a", marginBottom: "8px" };

export default Receipt;