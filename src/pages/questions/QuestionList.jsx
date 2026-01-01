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
  examId: "",
  questionNumber: "",
  text: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "",
};

const QuestionList = () => {
  const { token } = useAuth();
  const client = useMemo(() => createApiClient({ baseUrl: API_BASE, getToken: () => token }), [token]);

  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const getId = (item = {}) => item.id || item.questionId || item._id;

  const loadExams = async () => {
    try {
      const res = await client({ path: "/api/exams", method: "GET" });
      if (!res.ok) throw new Error(res?.data?.message || "Unable to fetch exams");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setExams(data);
      setSelectedExamId((prev) => {
        if (prev) return prev;
        const first = data[0]?.id || data[0]?.examId || data[0]?._id;
        return first || "";
      });
    } catch (err) {
      // ignore; filter stays empty
    }
  };

  const loadQuestions = async (examId) => {
    const targetExamId = examId || selectedExamId;
    if (!targetExamId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await client({ path: `/api/questions/by-exam/${targetExamId}`, method: "GET" });
      if (!res.ok) throw new Error(res?.data?.message || "Unable to fetch questions");
      setQuestions(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load questions.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedExamId) {
      loadQuestions(selectedExamId);
    } else {
      setQuestions([]);
    }
  }, [selectedExamId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const optionsArray = ["A", "B", "C", "D"]
        .map((letter, idx) => {
          const key = `option${letter}`;
          const value = form[key];
          return value ? { option: letter, text: value, index: idx, isCorrect: form.correctOption === letter } : null;
        })
        .filter(Boolean);
      const payload = {
        examId: form.examId || selectedExamId || null,
        questionNumber: form.questionNumber ? Number(form.questionNumber) : null,
        text: form.text,
        optionA: form.optionA,
        optionB: form.optionB,
        optionC: form.optionC,
        optionD: form.optionD,
        options: optionsArray,
        correctOption: form.correctOption,
      };
      const path = editingId ? `/api/questions/${editingId}/update` : "/api/questions";
      const res = await client({ path, method: "POST", body: payload });
      if (!res.ok) throw new Error(res?.data?.message || "Save failed");
      setMessage(editingId ? "Question updated." : "Question created.");
      setForm(blankForm);
      setEditingId(null);
      loadQuestions(selectedExamId);
      setShowDrawer(false);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    const examId = item.examId || item.examID || selectedExamId;
    const optionFromArray = (index) => {
      if (!Array.isArray(item.options)) return "";
      const candidate = item.options[index];
      if (!candidate) return "";
      return candidate.text || candidate.value || candidate.optionText || candidate.label || candidate.option || "";
    };
    setEditingId(getId(item));
    setForm({
      examId,
      questionNumber: item.questionNumber?.toString() || "",
      text: item.text || "",
      optionA: item.optionA || optionFromArray(0) || "",
      optionB: item.optionB || optionFromArray(1) || "",
      optionC: item.optionC || optionFromArray(2) || "",
      optionD: item.optionD || optionFromArray(3) || "",
      correctOption:
        item.correctOption ||
        item.correctAnswer ||
        (Array.isArray(item.options)
          ? item.options.find((opt) => opt.isCorrect || opt.correct)?.option ||
            item.options.find((opt) => opt.isCorrect || opt.correct)?.label ||
            ""
          : ""),
    });
    setShowDrawer(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const confirmed = window.confirm("Delete this question?");
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      const res = await client({ path: `/api/questions/${id}/delete`, method: "POST" });
      if (!res.ok) throw new Error(res?.data?.message || "Delete failed");
      setMessage("Question deleted.");
      setQuestions((prev) => prev.filter((it) => getId(it) !== id));
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  };

  const selectedExam = useMemo(
    () => exams.find((exam) => (exam.id || exam.examId || exam._id) === selectedExamId),
    [exams, selectedExamId]
  );

  return (
    <React.Fragment>
      <Head title="Questions" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween className="g-3">
            <BlockHeadContent>
              <BlockTitle page tag="h3">
                Questions
              </BlockTitle>
              <div className="text-soft">
                Manage questions for {selectedExam?.name || "the selected exam"}.
              </div>
            </BlockHeadContent>
            <BlockHeadContent className="nk-block-tools-opt">
              <Button
                color="primary"
                onClick={() => {
                  setForm({ ...blankForm, examId: selectedExamId });
                  setEditingId(null);
                  setShowDrawer(true);
                }}
              >
                <Icon name="plus" />
                <span>New Question</span>
              </Button>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <div className="card card-bordered mb-3">
          <div className="card-inner">
            <label className="form-label mb-1">Filter by Exam</label>
            <select
              className="form-select"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value || "")}
            >
              <option value="">Select exam</option>
              {exams.map((exam) => {
                const id = exam.id || exam.examId || exam._id;
                return (
                  <option key={id} value={id}>
                    {exam.name || `Exam ${id}`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <Block>
          <Row className="g-gs">
            <Col xxl="12">
              <div className="card">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Question List</h6>
                      <p className="text-soft small">CRUD driven by Examiner API.</p>
                    </div>
                    <div className="card-tools">
                      <Button
                        color="light"
                        outline
                        className="btn-icon"
                        onClick={() => loadQuestions(selectedExamId)}
                        disabled={loading || !selectedExamId}
                      >
                        <Icon name="reload" />
                      </Button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-middle table-tranx">
                      <thead className="table-light">
                        <tr>
                          <th>Question #</th>
                          <th>Text</th>
                          <th>Options</th>
                          <th>Correct</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td colSpan="5">Loading...</td>
                          </tr>
                        )}
                        {!loading && !selectedExamId && (
                          <tr>
                            <td colSpan="5">Choose an exam to load questions.</td>
                          </tr>
                        )}
                        {!loading && selectedExamId && questions.length === 0 && (
                          <tr>
                            <td colSpan="5">No questions found.</td>
                          </tr>
                        )}
                        {!loading &&
                          questions.map((item) => {
                            const id = getId(item);
                            const questionNumber = item.questionNumber ?? "—";
                            const optionsFromArray = Array.isArray(item.options)
                              ? item.options
                                  .map((opt, idx) => {
                                    const key =
                                      opt.option ||
                                      opt.label ||
                                      opt.key ||
                                      opt.optionLabel ||
                                      String.fromCharCode(65 + idx);
                                    const value =
                                      opt.text || opt.value || opt.optionText || opt.name || opt.option || "";
                                    return value ? `${key}: ${value}` : "";
                                  })
                                  .filter(Boolean)
                              : [];
                            const optionsFallback = [
                              ["A", item.optionA],
                              ["B", item.optionB],
                              ["C", item.optionC],
                              ["D", item.optionD],
                            ]
                              .filter(([, value]) => value)
                              .map(([key, value]) => `${key}: ${value}`);
                            const options = [...optionsFromArray, ...optionsFallback].join(" | ");
                            const correctOption =
                              item.correctOption ||
                              item.correctAnswer ||
                              (Array.isArray(item.options)
                                ? item.options.find((opt) => opt.isCorrect || opt.correct)?.option ||
                                  item.options.find((opt) => opt.isCorrect || opt.correct)?.label ||
                                  ""
                                : "—");
                            return (
                              <tr key={id}>
                                <td>
                                  <div className="lead-text mb-1">{questionNumber}</div>
                                  <span className="sub-text text-soft">{selectedExam?.name || "—"}</span>
                                </td>
                                <td>{item.text || "—"}</td>
                                <td>{options || "—"}</td>
                                <td>{correctOption}</td>
                                <td className="text-end">
                                  <Button
                                    size="sm"
                                    color="light"
                                    className="me-1"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Icon name="edit" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="danger"
                                    outline
                                    onClick={() => handleDelete(id)}
                                  >
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
          className={`nk-add-product toggle-slide toggle-slide-right toggle-screen-any question-form-drawer ${
            showDrawer ? "content-active" : ""
          }`}
        >
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">{editingId ? "Edit Question" : "New Question"}</BlockTitle>
              <div className="text-soft small">Fill required fields and save.</div>
            </BlockHeadContent>
          </BlockHead>
          <Block>
            <form className="gy-3 question-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Exam</label>
                <div className="form-control-wrap">
                  <select
                    className="form-control"
                    value={form.examId || selectedExamId}
                    onChange={(e) => setForm((f) => ({ ...f, examId: e.target.value }))}
                    required
                  >
                    <option value="">Select exam</option>
                    {exams.map((exam) => {
                      const id = exam.id || exam.examId || exam._id;
                      return (
                        <option key={id} value={id}>
                          {exam.name || `Exam ${id}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Question Number</label>
                <div className="form-control-wrap">
                  <input
                    type="number"
                    className="form-control"
                    value={form.questionNumber}
                    onChange={(e) => setForm((f) => ({ ...f, questionNumber: e.target.value }))}
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Question Text</label>
                <div className="form-control-wrap">
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.text}
                    onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                    required
                  />
                </div>
              </div>
              {["optionA", "optionB", "optionC", "optionD"].map((field, index) => (
                <div className="form-group" key={field}>
                  <label className="form-label">Option {String.fromCharCode(65 + index)}</label>
                  <div className="form-control-wrap">
                    <input
                      type="text"
                      className="form-control"
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Correct Option</label>
                <div className="form-control-wrap">
                  <select
                    className="form-control"
                    value={form.correctOption}
                    onChange={(e) => setForm((f) => ({ ...f, correctOption: e.target.value }))}
                    required
                  >
                    <option value="">Select correct answer</option>
                    {["A", "B", "C", "D"].map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
              <div className="form-group question-form-footer">
                <Button color="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Question" : "Create Question"}
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

export default QuestionList;
