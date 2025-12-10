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
  name: "",
  subject: "",
  schoolId: "",
  classId: "",
  totalMarks: "",
  questionCount: "",
  examDate: "",
};

const ExamList = () => {
  const { token } = useAuth();
  const client = useMemo(
    () => createApiClient({ baseUrl: API_BASE, getToken: () => token }),
    [token]
  );

  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const loadExams = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client({ path: "/api/exams", method: "GET" });
      if (!res.ok) throw new Error(res?.data?.message || "Unable to fetch exams");
      setItems(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load exams.");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    loadExams();
    loadSchools();
    loadClasses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name,
        subject: form.subject || null,
        schoolId: form.schoolId || null,
        classId: form.classId || null,
        totalMarks: form.totalMarks ? Number(form.totalMarks) : null,
        questionCount: form.questionCount ? Number(form.questionCount) : null,
        examDate: form.examDate || null,
      };
      const path = editingId ? `/api/exams/${editingId}/update` : "/api/exams";
      const res = await client({ path, method: "POST", body: payload });
      if (!res.ok) throw new Error(res?.data?.message || "Save failed");
      setMessage(editingId ? "Exam updated." : "Exam created.");
      setForm(blankForm);
      setEditingId(null);
      loadExams();
      setShowDrawer(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id || item.examId || item._id);
    setForm({
      name: item.name || "",
      subject: item.subject || "",
      schoolId: item.schoolId || item.schoolID || "",
      classId: item.classId || "",
      totalMarks: item.totalMarks?.toString() || "",
      questionCount: item.questionCount?.toString() || "",
      examDate: item.examDate ? item.examDate.split("T")[0] : "",
    });
    setShowDrawer(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this exam?");
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      const res = await client({ path: `/api/exams/${id}/delete`, method: "POST" });
      if (!res.ok) throw new Error(res?.data?.message || "Delete failed");
      setMessage("Exam deleted.");
      setItems((prev) => prev.filter((it) => (it.id || it.examId || it._id) !== id));
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
      <Head title="Exams" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween className="g-3">
            <BlockHeadContent>
              <BlockTitle page tag="h3">
                Exams
              </BlockTitle>
              <div className="text-soft">Create, edit, and remove exams.</div>
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
                <span>New Exam</span>
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
                      <h6 className="title">Exam List</h6>
                      <p className="text-soft small">CRUD powered by Examiner API.</p>
                    </div>
                    <div className="card-tools">
                      <Button color="light" outline className="btn-icon" onClick={loadExams} disabled={loading}>
                        <Icon name="reload" />
                      </Button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-middle table-tranx">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Subject</th>
                          <th>Class</th>
                          <th>Date</th>
                          <th>Total Marks</th>
                          <th>Questions</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td colSpan="7">Loading...</td>
                          </tr>
                        )}
                        {!loading && items.length === 0 && (
                          <tr>
                            <td colSpan="7">No exams found.</td>
                          </tr>
                        )}
                        {!loading &&
                          items.map((item) => {
                            const id = item.id || item.examId || item._id;
                            const schoolLabel =
                              item.schoolName ||
                              item.school?.name ||
                              item.schoolId ||
                              item.schoolID ||
                              "Unknown school";
                            const classLabel = item.className || `Class ${item.classId || item.classID || "—"}`;
                            const dateLabel = item.examDate ? new Date(item.examDate).toLocaleDateString() : "—";
                            return (
                              <tr key={id}>
                                <td>
                                  <div className="lead-text mb-1">{item.name || "—"}</div>
                                  <span className="sub-text text-soft">{schoolLabel}</span>
                                </td>
                                <td>{item.subject || "—"}</td>
                                <td>{classLabel}</td>
                                <td>{dateLabel}</td>
                                <td>{item.totalMarks ?? "—"}</td>
                                <td>{item.questionCount ?? "—"}</td>
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
              <BlockTitle tag="h5">{editingId ? "Edit Exam" : "New Exam"}</BlockTitle>
              <div className="text-soft small">Fill required fields and save.</div>
            </BlockHeadContent>
          </BlockHead>
          <Block>
            <form className="gy-3" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <div className="form-control-wrap">
                  <input
                    type="text"
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <div className="form-control-wrap">
                  <input
                    type="text"
                    className="form-control"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">School</label>
                <div className="form-control-wrap">
                  <select
                    className="form-control"
                    value={form.schoolId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        schoolId: e.target.value,
                        classId: "",
                      }))
                    }
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
              <div className="form-group">
                <div className="row gx-2">
                  <div className="col">
                    <label className="form-label">Total Marks</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.totalMarks}
                      onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))}
                    />
                  </div>
                  <div className="col">
                    <label className="form-label">Question Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.questionCount}
                      onChange={(e) => setForm((f) => ({ ...f, questionCount: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <div className="form-control-wrap">
                  <input
                    type="date"
                    className="form-control"
                    value={form.examDate}
                    onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                  />
                </div>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
              <div className="form-group">
                <Button color="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Exam" : "Create Exam"}
                </Button>
                <Button
                  type="button"
                  color="light"
                  className="ms-2"
                  onClick={() => {
                    setShowDrawer(false);
                    setError("");
                    setMessage("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Block>
        </SimpleBar>
        {showDrawer && <div className="toggle-overlay" onClick={() => setShowDrawer(false)}></div>}
      </Content>
    </React.Fragment>
  );
};

export default ExamList;
