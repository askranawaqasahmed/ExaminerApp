const swaggerModules = ["Class", "Exam", "Question", "School", "Student"];

const menu = [
  {
    icon: "dashboard-fill",
    text: "Dashboard",
    link: "/dashboard",
  },
  ...swaggerModules.map((name) => ({
    icon: "layers-fill",
    text: name,
    link:
      name === "Class"
        ? "/classes"
        : name === "Exam"
        ? "/exams"
        : name === "Question"
        ? "/questions"
        : name === "Student"
        ? "/students"
        : name === "School"
        ? "/schools"
        : `/api-explorer/${encodeURIComponent(name)}`,
  })),
];

const ecommerceMenu = menu;
export { menu, ecommerceMenu };
