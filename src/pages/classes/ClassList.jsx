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

const blankForm = { name: "", section: "", schoolId: "" };

const ClassList = () => {
  const { token } = useAuth();
  const client = useMemo(() => createApiClient({ baseUrl: API_BASE, getToken: () => token }), [token]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [schools, setSchools] = useState([]);

  const loadClasses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client({ path: "/api/classes", method: "GET" });
      if (!res.success) throw new Error(res.message || "Unable to fetch classes");
      const data = Array.isArray(res.value) ? res.value : [];
      setItems(data);
    } catch (err) {
      setError(err.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async () => {
    try {
      const res = await client({ path: "/api/schools", method: "GET" });
      if (!res.success) throw new Error(res.message || "Unable to fetch schools");
      const data = Array.isArray(res.value) ? res.value : [];
      setSchools(data);
    } catch (err) {
      // silently ignore for UI; dropdown will show empty state
    }
  };

  useEffect(() => {
    loadClasses();
    loadSchools();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name,
        section: form.section || null,
        schoolId: form.schoolId || null,
      };
      const path = editingId ? `/api/classes/${editingId}/update` : "/api/classes";
      const res = await client({ path, method: "POST", body: payload });
      if (!res.success) throw new Error(res.message || "Save failed");
      setMessage(editingId ? "Class updated." : "Class created.");
      setForm(blankForm);
      setEditingId(null);
      loadClasses();
      setShowDrawer(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id || item.classId || item._id);
    setForm({
      name: item.name || "",
      section: item.section ?? item.description ?? "",
      schoolId: item.schoolId || item.schoolID || "",
    });
    setShowDrawer(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this class?");
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      const res = await client({ path: `/api/classes/${id}/delete`, method: "POST" });
      if (!res.success) throw new Error(res.message || "Delete failed");
      setMessage("Class deleted.");
      setItems((prev) => prev.filter((it) => (it.id || it.classId || it._id) !== id));
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  };

  return (
    <React.Fragment>
      <Head title="Classes" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween className="g-3">
            <BlockHeadContent>
              <BlockTitle page tag="h3">
                Classes
              </BlockTitle>
              <div className="text-soft">Browse classes and manage them via the slider form.</div>
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
                <span>New Class</span>
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
                      <h6 className="title">Class List</h6>
                      <p className="text-soft small">CRUD powered by Examiner API.</p>
                    </div>
                    <div className="card-tools">
                      <Button color="light" outline className="btn-icon" onClick={loadClasses} disabled={loading}>
                        <Icon name="reload" />
                      </Button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-middle table-tranx">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>School</th>
                          <th>Section</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td colSpan="4">Loading...</td>
                          </tr>
                        )}
                        {!loading && items.length === 0 && (
                          <tr>
                            <td colSpan="4">No classes found.</td>
                          </tr>
                        )}
                        {!loading &&
                          items.map((item) => {
                            const id = item.id || item.classId || item._id;
                            const schoolLabel =
                              item.schoolName ||
                              item.school?.name ||
                              item.schoolId ||
                              item.schoolID ||
                              "Unknown school";
                            return (
                              <tr key={id}>
                                <td>
                                  <div className="lead-text mb-1">{item.name || "—"}</div>
                                </td>
                                <td>{schoolLabel}</td>
                                <td>{item.section || "—"}</td>
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
              <BlockTitle tag="h5">{editingId ? "Edit Class" : "New Class"}</BlockTitle>
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
                <label className="form-label">Section</label>
                <div className="form-control-wrap">
                  <input
                    type="text"
                    className="form-control"
                    value={form.section}
                    onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">School</label>
                <div className="form-control-wrap">
                  <select
                    className="form-control"
                    value={form.schoolId}
                    onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
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
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
              <div className="form-group">
                <Button color="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Class" : "Create Class"}
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

export default ClassList;
