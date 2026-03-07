// File: components/receipt/Receipt.jsx

import React from "react";
import { useAuthConfig } from "../../context/AppState";

const Receipt = React.forwardRef((props, ref) => {
  const {
    cart = [],
    receiptNumber,
    customerName,
    customerPhone,
    receiptData,
  } = props;

  const { user } = useAuthConfig();

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount || 0);

  const currentDate = new Date().toLocaleDateString("en-GB");

  console.log(receiptData)

  return (
    <div
      ref={ref}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20px",
        margin: "auto",
        background: "#fff",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#000",
        border: "2px solid #000",
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, letterSpacing: 3 }}>PROFORMA INVOICE</h1>
      </div>

      {/* SELLER / BUYER BOX */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          border: "1px solid #000",
          padding: 15,
          marginBottom: 20,
        }}
      >
        <div style={{ width: "48%" }}>
          <strong>Seller</strong>
          <p style={{ margin: "5px 0" }}>
            {user?.assignedShop?.name || "Your Company Name"}
          </p>
          <p style={{ margin: 0 }}>Your Business Address</p>
          <p style={{ margin: 0 }}>Phone: 08000000000</p>
        </div>

        <div style={{ width: "48%", textAlign: "right" }}>
          <strong>Buyer</strong>
          <p style={{ margin: "5px 0" }}>
            {customerName || "Walk-in Customer"}
          </p>
          <p style={{ margin: 0 }}>Phone: {customerPhone || "-"}</p>
          <p style={{ margin: 0 }}>Invoice No: {receiptNumber}</p>
          <p style={{ margin: 0 }}>Date: {currentDate}</p>
        </div>
      </div>

      {/* TABLE */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: 20,
        }}
      >
        <thead>
          <tr>
            {[
              "S/N",
              "Name",
              "Dimensions (L x W)",
              "SQM",
              "Qty",
              "₦ Per SQM",
              "₦ Neg. Price",
              "Total Price",
            ].map((head, i) => (
              <th
                key={i}
                style={{
                  border: "1px solid #000",
                  padding: "10px",
                  background: "#f9f9f9",
                }}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {receiptData?.receipt?.products?.map((item, index) => (
            <tr key={index}>
              <td style={td}>{index + 1}</td>
              <td style={{ ...td, textAlign: "left" }}>{item.title}</td>
              <td style={td}>
                {item?.dimensions?.length || "-"} X {item?.dimensions?.width || "-"}
              </td>
              <td style={td}>{item?.dimensions?.totalSquareMeters || 0}</td>
              <td style={td}>{item.quantitySold || 1}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {formatCurrency(item.pricePerSquareMeter || 0)}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                {formatCurrency(item.negotiatedPriceAtSale || 0)}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                {formatCurrency(item.originalPriceAtSale || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS BOX */}
      <div
        style={{
          width: "45%",
          marginLeft: "auto",
          border: "1px solid #000",
          padding: 15,
        }}
      >
        <SummaryRow
          label="Total PCS"
          value={receiptData?.receipt?.products?.length || 0}
        />

        <div
          style={{
            borderTop: "2px solid #000",
            marginTop: 10,
            paddingTop: 10,
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>GRAND TOTAL</span>
          <span>{receiptData?.receipt?.formattedSubTotal || "₦0"}</span>
        </div>
      </div>

      {/* SIGNATURE */}
      <div
        style={{
          marginTop: 60,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          _________________________ <br />
          Authorized Signature
        </div>

        <div>
          _________________________ <br />
          Customer Signature
        </div>
      </div>
    </div>
  );
});

const td = {
  border: "1px solid #000",
  padding: "8px",
  textAlign: "center",
};

const SummaryRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 6,
    }}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default Receipt;