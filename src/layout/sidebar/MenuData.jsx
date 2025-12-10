const swaggerModules = ["Auth", "Class", "Exam", "Question", "School", "Student"];

const menu = [
  {
    icon: "dashboard-fill",
    text: "Dashboard",
    link: "/dashboard",
  },
  {
    heading: "Swagger Modules",
  },
  ...swaggerModules.map((name) => ({
    icon: "layers-fill",
    text: name,
    link: name === "Class" ? "/classes" : `/api-explorer/${encodeURIComponent(name)}`,
  })),
  {
    icon: "server-fill",
    text: "All Operations",
    link: "/api-explorer",
  },
];

const ecommerceMenu = menu;
export { menu, ecommerceMenu };
