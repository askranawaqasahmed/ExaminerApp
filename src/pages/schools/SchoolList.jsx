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
const blankForm = { name: "", code: "", address: "" };

const SchoolList = () => {
  const { token } = useAuth();
  const client = useMemo(() => createApiClient({ baseUrl: API_BASE, getToken: () => token }), [token]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const loadSchools = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client({ path: "/api/schools", method: "GET" });
      if (!res.success) throw new Error(res.message || "Unable to fetch schools");
      const data = Array.isArray(res.value) ? res.value : [];
      setItems(data);
    } catch (err) {
      setError(err.message || "Failed to load schools.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        code: form.code || null,
        address: form.address || null,
      };
      const path = editingId ? `/api/schools/${editingId}/update` : "/api/schools";
      const res = await client({ path, method: "POST", body: payload });
      if (!res.success) throw new Error(res.message || "Save failed");
      setMessage(editingId ? "School updated." : "School created.");
      setForm(blankForm);
      setEditingId(null);
      loadSchools();
      setShowDrawer(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    const id = item.id || item.schoolId || item._id;
    setEditingId(id);
    setForm({
      name: item.name || "",
      code: item.code || "",
      address: item.address || "",
    });
    setShowDrawer(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this school?");
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      const res = await client({ path: `/api/schools/${id}/delete`, method: "POST" });
      if (!res.success) throw new Error(res.message || "Delete failed");
      setMessage("School deleted.");
      setItems((prev) => prev.filter((it) => (it.id || it.schoolId || it._id) !== id));
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  };

  return (
    <React.Fragment>
      <Head title="Schools" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween className="g-3">
            <BlockHeadContent>
              <BlockTitle page tag="h3">
                Schools
              </BlockTitle>
              <div className="text-soft">Create, edit, and remove schools.</div>
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
                <span>New School</span>
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
                      <h6 className="title">School List</h6>
                      <p className="text-soft small">CRUD powered by Examiner API.</p>
                    </div>
                    <div className="card-tools">
                      <Button color="light" outline className="btn-icon" onClick={loadSchools} disabled={loading}>
                        <Icon name="reload" />
                      </Button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-middle table-tranx">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Code</th>
                          <th>Address</th>
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
                            <td colSpan="4">No schools found.</td>
                          </tr>
                        )}
                        {!loading &&
                          items.map((item) => {
                            const id = item.id || item.schoolId || item._id;
                            return (
                              <tr key={id}>
                                <td>
                                  <div className="lead-text mb-1">{item.name || "—"}</div>
                                </td>
                                <td>{item.code || "—"}</td>
                                <td>{item.address || "—"}</td>
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
              <BlockTitle tag="h5">{editingId ? "Edit School" : "New School"}</BlockTitle>
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
                <label className="form-label">Code</label>
                <div className="form-control-wrap">
                  <input
                    type="text"
                    className="form-control"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <div className="form-control-wrap">
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
              <div className="form-group">
                <Button color="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update School" : "Create School"}
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

export default SchoolList;
