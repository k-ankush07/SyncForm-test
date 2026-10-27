
import React from "react";

export default function LivePreview({ pages,templateTitle }) {
  // Find the currently open page.
  const currentPage = pages.find((page) => page.open);

  if (!currentPage) {
    return <p>Select a page to preview</p>;
  }

  return (
    <div
      style={{
        background: "#f4f4f4",
        padding: "24px",
        borderRadius: "12px",
        minHeight: "400px",
      }}
    >
         <h2>{templateTitle}</h2>
      <div
        style={{
          background: "#ffffff",
          padding: "24px",
          borderRadius: "8px",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <h2>{currentPage.label}</h2>
       

        {/* Display elements outside rows */}
        {currentPage.rootElements.map((element) => (
          <div key={element.id} style={{ marginBottom: "16px" }}>
            <label>{element.label}</label>
            <input
              type="text"
              placeholder={element.label}
              style={{
                display: "block",
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        {/* Display rows and their fields */}
        {currentPage.rows.map((row) => (
          <div
            key={row.id}
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {row.fields.map((field) => (
              <div key={field} style={{ flex: 1, minWidth: 0 }}>
                <label>{field}</label>
                <input
                  type="text"
                  placeholder={field}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            {row.elements.map((element) => (
              <div key={element.id} style={{ flex: 1, minWidth: 0 }}>
                <label>{element.label}</label>
                <input
                  type="text"
                  placeholder={element.label}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
