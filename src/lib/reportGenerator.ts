// src/lib/reportGenerator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns"; // Assuming you use date-fns, or use standard JS Date

// --- TYPE DEFINITIONS ---
interface ReportData {
  id: string;
  date: string;
  service: string;
  farmer: string;
  provider: string;
  status: string;
  amount: number;
}

// --- CSV GENERATOR ---
export const generateCSV = (data: ReportData[], filename: string) => {
  // 1. Define Headers
  const headers = ["Booking ID", "Date", "Service", "Farmer", "Provider", "Status", "Amount (GHS)"];

  // 2. Map Data to CSV Rows
  const rows = data.map((row) => [
    row.id,
    row.date,
    `"${row.service}"`, // Quote strings to handle commas inside names
    `"${row.farmer}"`,
    `"${row.provider}"`,
    row.status,
    row.amount.toFixed(2),
  ]);

  // 3. Combine into a CSV string
  const csvContent = [
    headers.join(","), 
    ...rows.map((r) => r.join(","))
  ].join("\n");

  // 4. Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- PDF GENERATOR ---
export const generatePDF = (data: ReportData[], title: string, filename: string) => {
  const doc = new jsPDF();

  // 1. Add Title and Date
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  // 2. Define Columns
  const tableColumn = ["Date", "Service", "Farmer", "Provider", "Status", "Amount"];
  
  // 3. Define Rows
  const tableRows = data.map((row) => [
    row.date,
    row.service,
    row.farmer,
    row.provider,
    row.status,
    `GHS ${row.amount.toFixed(2)}`,
  ]);

  // 4. Generate Table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 163, 74] }, // Green color to match your theme
  });

  // 5. Save
  doc.save(`${filename}.pdf`);
};