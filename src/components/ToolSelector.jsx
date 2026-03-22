import { useState } from 'react';
import '../styles/tool-selector.css';

export default function ToolSelector({ brand, tools, onSelectTool, onBack }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Group tools by category if they have categories defined
  const groupedTools = tools.reduce((acc, tool) => {
    const category = tool.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {});

  // Determine if we should show categories - show if any tool has a category defined
  const categories = Object.keys(groupedTools).sort();
  const hasAnyCategory = tools.some(tool => tool.category);
  const shouldShowCategoryView = hasAnyCategory || categories.length > 1;

  // If showing category view and no category is selected, show category cards
  const showCategoryCards = shouldShowCategoryView && !selectedCategory;

  return (
    <div className="tool-selector">
      <div className="tool-selector-header">
        <button 
          className="back-button" 
          onClick={selectedCategory ? () => setSelectedCategory(null) : onBack}
          aria-label={selectedCategory ? "Back to categories" : "Back to brands"}
        >
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
          <h2>{selectedCategory || brand}</h2>
        </div>
      </div>

      {showCategoryCards ? (
        // Show category cards
        <div className="categories-grid">
          {categories.map((category) => (
            <button
              key={category}
              className="category-card"
              onClick={() => setSelectedCategory(category)}
            >
              <div className="category-card-content">
                <h3 className="category-name">{category}</h3>
                <p className="category-count">{groupedTools[category].length} tool{groupedTools[category].length !== 1 ? 's' : ''}</p>
              </div>
              <div className="category-card-background" />
            </button>
          ))}
        </div>
      ) : showCategoryCards === false && selectedCategory ? (
        // Show tools in selected category
        <div className="tools-grid">
          {groupedTools[selectedCategory].map((tool) => (
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
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : tool.imagePages && Object.keys(tool.imagePages).length > 0 ? (
                    <img 
                      src={tool.imagePages[Object.keys(tool.imagePages)[0]]} 
                      alt={tool.title}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
      ) : (
        // Fallback: show all tools without categories
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
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : tool.imagePages && Object.keys(tool.imagePages).length > 0 ? (
                    <img 
                      src={tool.imagePages[Object.keys(tool.imagePages)[0]]} 
                      alt={tool.title}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
      )}

      {tools.length === 0 && (
        <div className="empty-state">
          <p>No tools available for this brand yet.</p>
        </div>
      )}
    </div>
  );
}
