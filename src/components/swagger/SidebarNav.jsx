import React from "react";

const SidebarNav = ({ groups = [], selectedOperationId, onSelect }) => {
  return (
    <aside className="swagger-sidebar">
      <div className="swagger-sidebar-head">
        <h3>Operations</h3>
        <p>Auto-generated from the Swagger definition</p>
      </div>
      {groups.length === 0 ? (
        <div className="swagger-empty">No operations found in the provided Swagger file.</div>
      ) : (
        groups.map((group) => (
          <div key={group.tag} className="swagger-group">
            <div className="swagger-group-title">
              <span>{group.tag}</span>
              <span className="swagger-count">{group.operations.length}</span>
            </div>
            <div className="swagger-group-list">
              {group.operations.map((op) => {
                const isActive = selectedOperationId === op.id;
                return (
                  <button
                    type="button"
                    key={op.id}
                    className={`swagger-op ${isActive ? "is-active" : ""}`}
                    onClick={() => onSelect(op.id)}
                  >
                    <span className={`swagger-method method-${op.method.toLowerCase()}`}>{op.method}</span>
                    <div className="swagger-op-meta">
                      <div className="swagger-op-summary">{op.summary}</div>
                      <div className="swagger-op-path">{op.path}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </aside>
  );
};

export default SidebarNav;
