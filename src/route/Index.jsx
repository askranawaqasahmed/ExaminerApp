import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ApiExplorer from "@/pages/api-explorer/ApiExplorer";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<ApiExplorer />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
