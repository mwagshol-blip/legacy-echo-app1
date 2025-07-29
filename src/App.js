import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./styles.css";

// Category config with featured images URLs for UI (replace these URLs with your own or free icons)
const categoryConfigs = {
  Books: {
    image: "https://cdn-icons-png.flaticon.com/512/29/29302.png",
    fields: [
      { name: "title", label: "Title" },
      { name: "author", label: "Author" },
      { name: "link", label: "Link (optional)" },
      { name: "comments", label: "Comments" },
    ],
    prompts: [
      "List books that changed your life.",
      "Why is reading important to you?",
      "Favorite childhood reads?",
    ],
  },
  Movies: {
    image: "https://cdn-icons-png.flaticon.com/512/744/744922.png",
    fields: [
      { name: "film", label: "Film Title" },
      { name: "director", label: "Director" },
      { name: "link", label: "Link (optional)" },
      { name: "comments", label: "Comments" },
    ],
    prompts: [
      "Which film do you rewatch the most?",
      "What movie made you cry?",
      "Movies that shaped your thinking?",
    ],
  },
  Music: {
    image: "https://cdn-icons-png.flaticon.com/512/727/727245.png",
    fields: [
      { name: "artist", label: "Artist" },
      { name: "album", label: "Album" },
      { name: "song", label: "Song" },
      { name: "link", label: "Link (optional)" },
      { name: "comments", label: "Comments" },
    ],
    prompts: [
      "What songs define your youth?",
      "What’s a song that lifts your spirit?",
      "Who’s your favorite artist?",
    ],
  },
  Philosophy: {
    image: "https://cdn-icons-png.flaticon.com/512/3221/3221893.png",
    fields: [
      { name: "schoolOfThought", label: "School of Thought" },
      { name: "name", label: "Philosopher Name" },
      { name: "works", label: "Works" },
      { name: "comments", label: "Comments" },
    ],
    prompts: [
      "What is one belief you hold deeply?",
      "What life lessons do you want to pass on?",
      "What is your personal motto?",
    ],
  },
  Places: {
    image: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    fields: [
      { name: "placeName", label: "Place Name" },
      { name: "location", label: "Location" },
      { name: "comments", label: "Comments" },
    ],
    prompts: [
      "Describe a place that changed your life.",
      "What place do you dream to visit?",
      "Favorite travel memories?",
    ],
  },
};

const defaultCategories = Object.keys(categoryConfigs);

export default function App() {
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState({});
  const [imageURL, setImageURL] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [type, setType] = useState("text");
  const [editingIndex, setEditingIndex] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterTag, setFilterTag] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] = useState(defaultCategories);

  // Prompt for the selected category
  const prompt =
    category && categoryConfigs[category]
      ? categoryConfigs[category].prompts[
          Math.floor(Math.random() * categoryConfigs[category].prompts.length)
        ]
      : "";

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageURL(url);
  };

  // Handle video upload
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoURL(url);
    setType("video");
  };

  // Reset form
  const resetForm = () => {
    setFormData({});
    setImageURL(null);
    setVideoURL(null);
    setType("text");
    setCategory("");
    setEditingIndex(null);
  };

  // Save or update entry
  const handleSave = () => {
    if (!category) {
      alert("Please select a category.");
      return;
    }
    const entry = {
      category,
      type,
      data: formData,
      imageURL,
      videoURL,
      timestamp: new Date().toISOString(),
    };
    let newEntries;
    if (editingIndex !== null) {
      newEntries = [...entries];
      newEntries[editingIndex] = entry;
    } else {
      newEntries = [entry, ...entries];
    }
    setEntries(newEntries);
    resetForm();
  };

  // Edit entry
  const handleEdit = (index) => {
    const entry = entries[index];
    setCategory(entry.category);
    setFormData(entry.data);
    setImageURL(entry.imageURL);
    setVideoURL(entry.videoURL);
    setType(entry.type);
    setEditingIndex(index);
  };

  // Delete entry
  const handleDelete = (index) => {
    if (window.confirm("Delete this entry?")) {
      setEntries(entries.filter((_, i) => i !== index));
      resetForm();
    }
  };

  // Add new category
  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      alert("Category already exists.");
      return;
    }
    setCategories([...categories, name]);
    categoryConfigs[name] = {
      image:
        "https://cdn-icons-png.flaticon.com/512/565/565547.png", // default icon for new category
      fields: [
        { name: "title", label: "Title" },
        { name: "comments", label: "Comments" },
      ],
      prompts: ["Add your entries here."],
    };
    setNewCategoryName("");
  };

  // Filter entries by category and optionally tag (hashtag)
  const filteredEntries = entries.filter((e) => {
    if (filterCategory !== "All" && e.category !== filterCategory) return false;
    if (
      filterTag &&
      !Object.values(e.data)
        .join(" ")
        .toLowerCase()
        .includes(filterTag.toLowerCase())
    )
      return false;
    return true;
  });

  // Group filtered entries by category
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {});

  // Export current filtered entries to PDF with images if possible
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Legacy Echo Entries", 14, 22);

    let y = 30;
    Object.entries(groupedEntries).forEach(([cat, entries]) => {
      doc.setFontSize(18);
      doc.setTextColor("#2563eb");
      doc.text(cat, 14, y);
      y += 10;

      entries.forEach((entry) => {
        doc.setFontSize(12);
        doc.setTextColor("#000");

        const fields = categoryConfigs[cat]?.fields || [];

        fields.forEach(({ label, name }) => {
          const val = entry.data[name] || "";
          if (val) {
            doc.text(`${label}: ${val}`, 14, y);
            y += 7;
          }
        });

        if (entry.data.comments) {
          doc.text(`Comments: ${entry.data.comments}`, 14, y);
          y += 7;
        }

        if (entry.imageURL) {
          // Try to add image as thumbnail
          try {
            const img = new Image();
            img.src = entry.imageURL;
            // Due to cross-origin restrictions, this might fail on remote URLs
            doc.addImage(entry.imageURL, "JPEG", 140, y - 10, 30, 30);
          } catch {
            // ignore if failed
          }
        }

        y += 15;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      y += 10;
    });

    doc.save("legacy-echo-entries.pdf");
  };

  return (
    <div className="container">
      <header className="banner-header">
  <img src="/banner2.png" alt="Legacy Echo Banner" className="banner-image" />
  <p className="subheader">Preserve your favorite books, movies, music, philosophy, places & more.</p>
</header>

      <section className="form-section">
        <div className="form-row category-select-row">
          <label>Category:</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setFormData({});
              setImageURL(null);
              setVideoURL(null);
              setType("text");
              setEditingIndex(null);
            }}
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {category && (
            <img
              src={categoryConfigs[category]?.image}
              alt={category}
              className="category-image"
            />
          )}
        </div>

        {category && (
          <>
            <p className="prompt">
              <em>Prompt: {prompt}</em>
            </p>

            {categoryConfigs[category]?.fields.map(({ name, label }) => (
              <div key={name} className="form-row">
                {name === "comments" ? (
                  <textarea
                    placeholder={label}
                    value={formData[name] || ""}
                    onChange={(e) => handleFieldChange(name, e.target.value)}
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={label}
                    value={formData[name] || ""}
                    onChange={(e) => handleFieldChange(name, e.target.value)}
                  />
                )}
              </div>
            ))}

            <div className="form-row">
              <label>Type:</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="text">Text</option>
                <option value="video">Video</option>
              </select>
            </div>

            {type === "text" && (
              <div className="form-row">
                <label>Image Upload:</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {imageURL && (
                  <img src={imageURL} alt="Uploaded" className="preview-image" />
                )}
              </div>
            )}

            {type === "video" && (
              <div className="form-row">
                <label>Video Upload:</label>
                <input type="file" accept="video/*" onChange={handleVideoUpload} />
                {videoURL && (
                  <video controls className="preview-video" src={videoURL}></video>
                )}
              </div>
            )}

            <button className="save-btn" onClick={handleSave}>
              {editingIndex !== null ? "Update Entry" : "Add Entry"}
            </button>
          </>
        )}
      </section>

      <section className="filters-section">
        <label>Filter by Category:</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="All">All</option>
          {categories.map((cat) => (
            <option key={"f" + cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <label>Filter by Hashtag/Text:</label>
        <input
          type="text"
          placeholder="Enter hashtag or text to filter"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
        />

        <button onClick={exportPDF} className="export-btn">
          Export to PDF
        </button>
      </section>

      <section className="entries-section">
        <h2>Entries ({filteredEntries.length})</h2>

        {filteredEntries.length === 0 && <p>No entries found.</p>}

        {Object.entries(groupedEntries).map(([cat, entries]) => (
          <div key={cat} className="category-group">
            <h3 className="category-header">
              <img
                src={categoryConfigs[cat]?.image}
                alt={cat}
                className="category-list-image"
              />{" "}
              {cat}
            </h3>

            {entries.map((entry, i) => (
              <div key={i} className="entry-card">
                <small className="timestamp">
                  {new Date(entry.timestamp).toLocaleString()}
                </small>

                <div className="entry-details">
                  {categoryConfigs[cat]?.fields.map(({ name, label }) => (
                    // Don't show comments here again (will show after)
                    name !== "comments" && (
                      <p key={name}>
                        <strong>{label}:</strong> {entry.data[name] || "-"}
                      </p>
                    )
                  ))}

                  {entry.imageURL && (
                    <img
                      src={entry.imageURL}
                      alt="thumbnail"
                      className="entry-image"
                    />
                  )}

                  {entry.type === "video" && entry.videoURL && (
                    <video
                      controls
                      className="entry-video"
                      src={entry.videoURL}
                    ></video>
                  )}

                  {/* Show comments once here */}
                  {entry.data.comments && (
                    <p className="comments">
                      <strong>Comments:</strong> {entry.data.comments}
                    </p>
                  )}
                </div>

                <div className="entry-actions">
                  <button onClick={() => handleEdit(i)}>Edit</button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(i)}
                    title="Delete Entry"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="add-category-section">
        <h3>Add New Category</h3>
        <input
          type="text"
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <button onClick={handleAddCategory}>Add Category</button>
      </section>
    </div>
  );
}
