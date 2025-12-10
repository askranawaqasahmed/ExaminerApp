import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import ApiExplorer from "@/pages/api-explorer/ApiExplorer";
import Login from "@/pages/auth/Login";
import Homepage from "@/pages/Homepage";
import ClassList from "@/pages/classes/ClassList";
import ExamList from "@/pages/exams/ExamList";
import QuestionList from "@/pages/questions/QuestionList";
import SchoolList from "@/pages/schools/SchoolList";
import StudentList from "@/pages/students/StudentList";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/layout/Index";
import ThemeProvider from "@/layout/provider/Theme";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const Router = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ThemeProvider />
              </ProtectedRoute>
            }
          >
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Homepage />} />
              <Route path="classes" element={<ClassList />} />
              <Route path="exams" element={<ExamList />} />
              <Route path="questions" element={<QuestionList />} />
              <Route path="students" element={<StudentList />} />
              <Route path="schools" element={<SchoolList />} />
              <Route path="api-explorer" element={<ApiExplorer />} />
              <Route path="api-explorer/:tag" element={<ApiExplorer />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default Router;
