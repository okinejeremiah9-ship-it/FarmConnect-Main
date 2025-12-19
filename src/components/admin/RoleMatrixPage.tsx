// Location: src/components/admin/RoleMatrixPage.tsx
import React from "react";

export const RoleMatrixPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Role Matrix</h1>
      <p className="text-gray-600 mt-2">
        Define what each role can access (Farmer, Provider, Admin).
      </p>

      <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
        <p className="text-sm text-gray-700">
          Add your role-permission table UI here (this file exists so Vite can resolve the import).
        </p>
      </div>
    </div>
  );
};
