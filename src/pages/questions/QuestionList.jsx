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
const QUESTION_TYPES = [
  { value: 0, label: "MCQ" },
  { value: 1, label: "Detailed" },
  { value: 2, label: "Diagram" },
];

const blankForm = {
  examId: "",
  questionNumber: "",
  text: "",
  type: "0",
  marks: "",
  lines: "",
  boxSize: "1",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  optionKeyA: "A",
  optionKeyB: "B",
  optionKeyC: "C",
  optionKeyD: "D",
  correctOption: "",
};

const getTypeLabel = (value) => QUESTION_TYPES.find((t) => t.value === value)?.label || "Unknown";
const getBoxSizeLabel = (value) => {
  if (value === 2 || value === "2") return "Full page";
  if (value === 1 || value === "1") return "Half page";
  return "Auto";
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
      if (!res.success) throw new Error(res.message || "Unable to fetch exams");
      const data = Array.isArray(res.value) ? res.value : [];
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
      if (!res.success) throw new Error(res.message || "Unable to fetch questions");
      const data = Array.isArray(res.value) ? res.value : [];
      setQuestions(data);
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

  useEffect(() => {
    if (Number(form.type) !== 0 && form.correctOption) {
      setForm((f) => ({ ...f, correctOption: "" }));
    }
  }, [form.type, form.correctOption]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const questionType = Number(form.type || selectedExam?.type || 0);
      const isMcqType = questionType === 0;
      const isDetailedType = questionType === 1;
      const isDiagramType = questionType === 2;
      const optionsArray = isMcq
        ? ["A", "B", "C", "D"]
            .map((letter, idx) => {
              const textValue = form[`option${letter}`];
              const keyValue = form[`optionKey${letter}`] || letter;
              if (!textValue) return null;
              return { key: keyValue, text: textValue, order: idx + 1 };
            })
            .filter(Boolean)
        : [];

      const resolvedCorrectOption = isMcqType
        ? form.correctOption || optionsArray[0]?.key || null
        : null;

      const payload = {
        examId: form.examId || selectedExamId || null,
        questionNumber: form.questionNumber ? Number(form.questionNumber) : null,
        text: form.text,
        type: questionType,
        marks: form.marks ? Number(form.marks) : null,
        lines: isDetailedType && form.lines ? Number(form.lines) : null,
        boxSize: isDiagramType && form.boxSize ? Number(form.boxSize) : null,
        options: optionsArray,
        correctOption: resolvedCorrectOption,
      };
      const path = editingId ? `/api/questions/${editingId}/update` : "/api/questions";
      const res = await client({ path, method: "POST", body: payload });
      if (!res.success) throw new Error(res.message || "Save failed");
      setMessage(editingId ? "Question updated." : "Question created.");
      const defaultType = selectedExam?.type ?? 0;
      setForm({ ...blankForm, examId: selectedExamId, type: defaultType.toString() });
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
      if (!Array.isArray(item.options)) return { key: String.fromCharCode(65 + index), text: "" };
      const candidate = item.options[index];
      if (!candidate) return { key: String.fromCharCode(65 + index), text: "" };
      return {
        key: candidate.key || candidate.option || candidate.label || String.fromCharCode(65 + index),
        text: candidate.text || candidate.value || candidate.optionText || candidate.name || candidate.option || "",
      };
    };
    const resolvedType = Number(item.type ?? selectedExam?.type ?? 0);
    const option1 = optionFromArray(0);
    const option2 = optionFromArray(1);
    const option3 = optionFromArray(2);
    const option4 = optionFromArray(3);
    setEditingId(getId(item));
    setForm({
      examId,
      questionNumber: item.questionNumber?.toString() || "",
      text: item.text || "",
      type: resolvedType.toString(),
      marks: item.marks?.toString() || "",
      lines: item.lines?.toString() || "",
      boxSize: (item.boxSize ?? 1).toString(),
      optionA: item.optionA || option1.text || "",
      optionB: item.optionB || option2.text || "",
      optionC: item.optionC || option3.text || "",
      optionD: item.optionD || option4.text || "",
      optionKeyA: option1.key || "A",
      optionKeyB: option2.key || "B",
      optionKeyC: option3.key || "C",
      optionKeyD: option4.key || "D",
      correctOption: resolvedType === 0 ? item.correctOption || item.correctAnswer || option1.key || "" : "",
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
      if (!res.success) throw new Error(res.message || "Delete failed");
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

  const availableQuestionTypes = useMemo(() => QUESTION_TYPES, []);

  const mcqOptionKeys = useMemo(() => {
    if (Number(form.type) !== 0) return [];
    const entries = [
      [form.optionKeyA || "A", form.optionA],
      [form.optionKeyB || "B", form.optionB],
      [form.optionKeyC || "C", form.optionC],
      [form.optionKeyD || "D", form.optionD],
    ];
    return entries.filter(([, text]) => text).map(([key]) => key);
  }, [
    form.type,
    form.optionKeyA,
    form.optionKeyB,
    form.optionKeyC,
    form.optionKeyD,
    form.optionA,
    form.optionB,
    form.optionC,
    form.optionD,
  ]);

  const isMcq = Number(form.type) === 0;
  const isDetailed = Number(form.type) === 1;
  const isDiagram = Number(form.type) === 2;

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
                  const defaultType = selectedExam?.type ?? 0;
                  setForm({ ...blankForm, examId: selectedExamId, type: defaultType.toString() });
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
                          <th>Type</th>
                          <th>Marks / Details</th>
                          <th>Options / Notes</th>
                          <th>Correct</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                                            <tbody>
                        {loading && (
                          <tr>
                            <td colSpan="7">Loading...</td>
                          </tr>
                        )}
                        {!loading && !selectedExamId && (
                          <tr>
                            <td colSpan="7">Choose an exam to load questions.</td>
                          </tr>
                        )}
                        {!loading && selectedExamId && questions.length === 0 && (
                          <tr>
                            <td colSpan="7">No questions found.</td>
                          </tr>
                        )}
                        {!loading &&
                          questions.map((item) => {
                            const id = getId(item);
                            const questionNumber = item.questionNumber ?? "-";
                            const typeValue = Number(item.type ?? 0);
                            const typeLabel = getTypeLabel(typeValue);
                            const optionsFromArray = Array.isArray(item.options)
                              ? item.options
                                  .map((opt, idx) => {
                                    const key =
                                      opt.key ||
                                      opt.option ||
                                      opt.label ||
                                      opt.keyLabel ||
                                      String.fromCharCode(65 + idx);
                                    const value =
                                      opt.text || opt.value || opt.optionText || opt.name || opt.option || "";
                                    return value ? `${key}: ${value}` : "";
                                  })
                                  .filter(Boolean)
                              : [];
                            const optionsFallback = [
                              [item.optionKeyA || "A", item.optionA],
                              [item.optionKeyB || "B", item.optionB],
                              [item.optionKeyC || "C", item.optionC],
                              [item.optionKeyD || "D", item.optionD],
                            ]
                              .filter(([, value]) => value)
                              .map(([key, value]) => `${key}: ${value}`);
                            const options = [...optionsFromArray, ...optionsFallback].join(" | ");
                            const boxSizeLabel = getBoxSizeLabel(item.boxSize ?? 1);
                            const marksDetail = [
                              item.marks !== null && item.marks !== undefined ? `${item.marks} marks` : null,
                              typeValue !== 0 ? (item.lines ? `${item.lines} lines` : null) : null,
                              `Box: ${boxSizeLabel}`,
                            ]
                              .filter(Boolean)
                              .join(" | ") || "-";
                            const correctOption =
                              typeValue === 0
                                ? item.correctOption ||
                                  item.correctAnswer ||
                                  (Array.isArray(item.options)
                                    ? item.options.find((opt) => opt.isCorrect || opt.correct)?.key ||
                                      item.options.find((opt) => opt.isCorrect || opt.correct)?.option ||
                                      ""
                                    : "")
                                : "N/A";
                            const optionsNote =
                              typeValue === 0
                                ? options || "No options"
                                : typeValue === 2
                                ? `Diagram question (${boxSizeLabel})`
                                : "Detailed question";
                            return (
                              <tr key={id}>
                                <td>
                                  <div className="lead-text mb-1">{questionNumber}</div>
                                  <span className="sub-text text-soft">{selectedExam?.name || "-"}</span>
                                </td>
                                <td>{item.text || "-"}</td>
                                <td>
                                  <span className="badge bg-light text-dark">{typeLabel}</span>
                                </td>
                                <td>{marksDetail}</td>
                                <td>{optionsNote}</td>
                                <td>{correctOption || "N/A"}</td>
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
              <div className="form-group">
                <label className="form-label">Question Type</label>
                <div className="form-control-wrap">
                  <select
                    className="form-control"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    {availableQuestionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-note-alt">
                    MCQ needs options + correct answer; detailed/diagram skip options.
                  </div>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-md-4">
                  <div className="form-group">
                    <label className="form-label">Marks</label>
                    <div className="form-control-wrap">
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        value={form.marks}
                        onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                {isDetailed && (
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Lines</label>
                      <div className="form-control-wrap">
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          value={form.lines}
                          onChange={(e) => setForm((f) => ({ ...f, lines: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {isDiagram && (
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Answer Space</label>
                      <div className="form-control-wrap">
                        <select
                          className="form-control"
                          value={form.boxSize}
                          onChange={(e) => setForm((f) => ({ ...f, boxSize: e.target.value }))}
                        >
                          <option value="1">Half page box</option>
                          <option value="2">Full page box</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isMcq ? (
                <>
                  {["A", "B", "C", "D"].map((letter, index) => (
                    <div className="form-group" key={letter}>
                      <label className="form-label">Option {letter}</label>
                      <div className="row gx-2">
                        <div className="col-4 col-md-3">
                          <input
                            type="text"
                            className="form-control"
                            value={form[`optionKey${letter}`]}
                            onChange={(e) => setForm((f) => ({ ...f, [`optionKey${letter}`]: e.target.value }))}
                            placeholder={letter}
                          />
                        </div>
                        <div className="col">
                          <input
                            type="text"
                            className="form-control"
                            value={form[`option${letter}`]}
                            onChange={(e) => setForm((f) => ({ ...f, [`option${letter}`]: e.target.value }))}
                            placeholder={`Option ${letter} text`}
                          />
                        </div>
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
                      >
                        <option value="">Select correct answer</option>
                        {mcqOptionKeys.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="alert alert-info">
                  Options and correct answer are not required for detailed or diagram questions.
                </div>
              )}
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
