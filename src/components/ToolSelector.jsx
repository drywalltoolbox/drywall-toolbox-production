import '../styles/tool-selector.css';

export default function ToolSelector({ brand, tools, onSelectTool, onBack }) {

  return (
    <div className="tool-selector">
      <div className="tool-selector-header">
        <button className="back-button" onClick={onBack} aria-label="Back to brands">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <div className="header-content">
          <h2>{brand}</h2>
        </div>
      </div>

      <div className="tools-grid">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className="tool-card"
            onClick={() => onSelectTool(tool)}
          >
            <div className="tool-card-content">
              <div className="tool-image-placeholder">
                {tool.previewImage ? (
                  <img 
                    src={tool.previewImage} 
                    alt={tool.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : tool.imagePages && Object.keys(tool.imagePages).length > 0 ? (
                  <img 
                    src={tool.imagePages[Object.keys(tool.imagePages)[0]]} 
                    alt={tool.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <svg
                    className="placeholder-icon"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                )}
              </div>
              <h3 className="tool-name">{tool.title}</h3>
            </div>
            <div className="tool-card-background" />
          </button>
        ))}
      </div>

      {tools.length === 0 && (
        <div className="empty-state">
          <p>No tools available for this brand yet.</p>
        </div>
      )}
    </div>
  );
}
