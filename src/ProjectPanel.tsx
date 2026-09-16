interface ProjectPanelProps {
  name: string;
  brief: string;
  onNameChange: (name: string) => void;
  onBriefChange: (brief: string) => void;
  onClose: () => void;
}

function ProjectPanel({
  name,
  brief,
  onNameChange,
  onBriefChange,
  onClose,
}: ProjectPanelProps) {
  return (
    <div className="inspector">
      <h2>Project</h2>

      <label>
        Project Name
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <label>
        Game Idea / Brief
        <textarea
          value={brief}
          rows={10}
          placeholder="Describe the game you want to make."
          onChange={(event) => onBriefChange(event.target.value)}
        />
      </label>

      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          background: 'white',
          cursor: 'pointer',
        }}
      >
        Done
      </button>
    </div>
  );
}

export default ProjectPanel;
