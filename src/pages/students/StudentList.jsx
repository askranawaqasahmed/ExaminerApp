import React, { useEffect, useMemo, useState } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockBetween,
  Button,
  Icon,
  Row,
  Col,
} from "@/components/Component";
import SimpleBar from "simplebar-react";
import { createApiClient } from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "https://examiner.ideageek.pk";
const blankForm = {
  schoolId: "",
  classId: "",
  studentNumber: "",
  firstName: "",
  lastName: "",
  username: "",
  password: "",
};

const StudentList = () => {
  const { token } = useAuth();
  const client = useMemo(() => createApiClient({ baseUrl: API_BASE, getToken: () => token }), [token]);

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client({ path: "/api/students", method: "GET" });
      if (!res.ok) throw new Error(res?.data?.message || "Unable to fetch students");
      setStudents(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await client({ path: "/api/classes", method: "GET" });
      if (!res.ok) throw new Error(res?.data?.message || "Unable to fetch classes");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setClasses(data);
    } catch (err) {
      // ignore
    }
  };

  const loadSchools = async () => {
    try {
      const res = await client({ path: "/api/schools", method: "GET" });
      if (!res.ok) throw new Error(res?.data?.message || "Unable to fetch schools");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setSchools(data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadStudents();
    loadClasses();
    loadSchools();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getId = (item = {}) => item.id || item.studentId || item._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        schoolId: form.schoolId || null,
        classId: form.classId || null,
        studentNumber: form.studentNumber || null,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        username: form.username || null,
        password: form.password || null,
      };
      const path = editingId ? `/api/students/${editingId}/update` : "/api/students";
      const res = await client({ path, method: "POST", body: payload });
      if (!res.ok) throw new Error(res?.data?.message || "Save failed");
      setMessage(editingId ? "Student updated." : "Student created.");
      setForm(blankForm);
      setEditingId(null);
      loadStudents();
      setShowDrawer(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(getId(item));
    setForm({
      schoolId: item.schoolId || item.school?.id || "",
      classId: item.classId || item.class?.id || "",
      studentNumber: item.studentNumber || "",
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      username: item.username || "",
      password: "",
    });
    setShowDrawer(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this student?");
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      const res = await client({ path: `/api/students/${id}/delete`, method: "POST" });
      if (!res.ok) throw new Error(res?.data?.message || "Delete failed");
      setMessage("Student deleted.");
      setStudents((prev) => prev.filter((item) => getId(item) !== id));
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  };

  const availableClasses = useMemo(() => {
    if (!form.schoolId) return classes;
    return classes.filter(
      (cls) => (cls.schoolId || cls.schoolID || cls.school?.id) === form.schoolId
    );
  }, [classes, form.schoolId]);

  return (
    <React.Fragment>
      <Head title="Students" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween className="g-3">
            <BlockHeadContent>
              <BlockTitle page tag="h3">
                Students
              </BlockTitle>
              <div className="text-soft">Manage student records.</div>
            </BlockHeadContent>
            <BlockHeadContent className="nk-block-tools-opt">
              <Button
                color="primary"
                onClick={() => {
                  setForm(blankForm);
                  setEditingId(null);
                  setShowDrawer(true);
                }}
              >
                <Icon name="plus" />
                <span>New Student</span>
              </Button>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <Row className="g-gs">
            <Col xxl="12">
              <div className="card">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Student List</h6>
                      <p className="text-soft small">CRUD powered by Examiner API.</p>
                    </div>
                    <div className="card-tools">
                      <Button color="light" outline className="btn-icon" onClick={loadStudents} disabled={loading}>
                        <Icon name="reload" />
                      </Button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-middle table-tranx">
                      <thead className="table-light">
                        <tr>
                          <th>Number</th>
                          <th>Name</th>
                          <th>School</th>
                          <th>Class</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td colSpan="5">Loading...</td>
                          </tr>
                        )}
                        {!loading && students.length === 0 && (
                            <tr>
                              <td colSpan="5">No students found.</td>
                            </tr>
                        )}
                        {!loading &&
                          students.map((item) => {
                            const id = getId(item);
                            const schoolLabel =
                              item.schoolName ||
                              item.school?.name ||
                              item.schoolId ||
                              item.schoolID ||
                              "Unknown school";
                            const classLabel =
                              item.className ||
                              item.class?.name ||
                              item.classId ||
                              item.classID ||
                              "Unknown class";
                            const fullName = [item.firstName, item.lastName].filter(Boolean).join(" ") || "—";
                            return (
                              <tr key={id}>
                                <td>{item.studentNumber || "—"}</td>
                                <td>
                                  <div className="lead-text mb-1">{fullName}</div>
                                  <span className="sub-text text-soft">{item.username || ""}</span>
                                </td>
                                <td>{schoolLabel}</td>
                                <td>{classLabel}</td>
                                <td className="text-end">
                                  <Button size="sm" color="light" className="me-1" onClick={() => handleEdit(item)}>
                                    <Icon name="edit" />
                                  </Button>
                                  <Button size="sm" color="danger" outline onClick={() => handleDelete(id)}>
                                    <Icon name="trash" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Block>

        <SimpleBar
          className={`nk-add-product toggle-slide toggle-slide-right toggle-screen-any ${
            showDrawer ? "content-active" : ""
          }`}
        >
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">{editingId ? "Edit Student" : "New Student"}</BlockTitle>
              <div className="text-soft small">Fill required fields and save.</div>
            </BlockHeadContent>
          </BlockHead>
          <Block>
            <form className="gy-3" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">School</label>
                <div className="form-control-wrap">
                  <select
                    className="form-control"
                    value={form.schoolId}
                    onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value, classId: "" }))}
                    required
                  >
                    <option value="">Select school</option>
                    {schools.map((school) => {
                      const val = school.id || school.schoolId || school._id;
                      return (
                        <option key={val} value={val}>
                          {school.name || `School ${val}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <div className="form-control-wrap">
                  <select
                    className="form-control"
                    value={form.classId}
                    onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                    required
                  >
                    <option value="">Select class</option>
                    {availableClasses.map((cls) => {
                      const val = cls.id || cls.classId || cls._id;
                      return (
                        <option key={val} value={val}>
                          {cls.name || `Class ${val}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="form-group mb-2">
                <label className="form-label">Student Number</label>
                <div className="form-control-wrap">
                  <input
                    type="text"
                    className="form-control"
                    value={form.studentNumber}
                    onChange={(e) => setForm((f) => ({ ...f, studentNumber: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group mb-2">
                <label className="form-label">First Name</label>
                <div className="form-control-wrap">
                  <input
                    type="text"
                    className="form-control"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group mb-2">
                <label className="form-label">Last Name</label>
                <div className="form-control-wrap">
                  <input
                    type="text"
                    className="form-control"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group mb-2">
                <label className="form-label">Username</label>
                <div className="form-control-wrap">
                  <input
                    type="text"
                    className="form-control"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    disabled={Boolean(editingId)}
                  />
                </div>
              </div>
              <div className="form-group mb-2">
                <label className="form-label">Password</label>
                <div className="form-control-wrap">
                  <input
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={editingId ? "Leave blank to keep existing password" : ""}
                  />
                </div>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
              <div className="student-form-footer">
                <div className="student-form-actions">
                  <Button color="primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Student" : "Create Student"}
                  </Button>
                  <Button
                    type="button"
                    color="light"
                    className="ms-0"
                    onClick={() => {
                      setShowDrawer(false);
                      setError("");
                      setMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </Block>
        </SimpleBar>
        {showDrawer && <div className="toggle-overlay" onClick={() => setShowDrawer(false)}></div>}
      </Content>
    </React.Fragment>
  );
};

export default StudentList;
